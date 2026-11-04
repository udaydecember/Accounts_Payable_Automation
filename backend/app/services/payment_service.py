import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.models.vendor import Vendor
from backend.app.models.payment import PaymentRequest, PaymentBatch, PaymentTransaction, PaymentAdvice
from backend.app.models.system import IntegrationLog

class PaymentService:
    def __init__(self):
        pass

    def create_payment_request(
        self,
        db: Session,
        invoice_id: str,
        user: User,
        requested_amount: Optional[Decimal] = None,
        payment_method: str = 'NEFT/RTGS'
    ) -> PaymentRequest:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail='Invoice not found.')

        if invoice.status not in ['Ready_For_Payment', 'Partially_Paid']:
            raise HTTPException(
                status_code=400,
                detail=f'Invoice cannot be paid: Status is "{invoice.status}". Must be "Ready_For_Payment" or "Partially_Paid".'
            )

        # Check existing active payment request
        existing_req = db.query(PaymentRequest).filter(
            PaymentRequest.invoice_id == invoice.id,
            PaymentRequest.status.in_(['Payment_Requested', 'Payment_Processing'])
        ).first()
        if existing_req:
            raise HTTPException(
                status_code=400,
                detail=f'Duplicate payment request prevented: Active request {existing_req.request_number} already exists.'
            )

        outstanding = invoice.total_amount - invoice.amount_paid
        pay_amount = requested_amount or outstanding
        if pay_amount <= 0 or pay_amount > outstanding:
            raise HTTPException(
                status_code=400,
                detail=f'Invalid payment amount {pay_amount}. Outstanding amount is {outstanding}.'
            )

        req_num = f'PAY-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'
        payment_request = PaymentRequest(
            request_number=req_num,
            invoice_id=invoice.id,
            requested_amount=pay_amount,
            currency=invoice.currency,
            status='Payment_Requested',
            payment_method=payment_method,
            requested_by_id=user.id,
            requested_at=datetime.now(timezone.utc)
        )
        db.add(payment_request)
        invoice.status = 'Payment_Processing'
        db.commit()
        db.refresh(payment_request)
        return payment_request

    def create_batch(self, db: Session, invoice_ids: List[str], user: User) -> PaymentBatch:
        if not invoice_ids:
            raise HTTPException(status_code=400, detail='Select at least one invoice for the payment batch.')

        invoices = db.query(Invoice).filter(Invoice.id.in_(invoice_ids)).all()
        for inv in invoices:
            if inv.status not in ['Ready_For_Payment', 'Partially_Paid']:
                raise HTTPException(
                    status_code=400,
                    detail=f'Invoice {inv.invoice_number} is not eligible for payment (Status: {inv.status}).'
                )

        batch_number = f'BATCH-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:5].upper()}'
        total_batch_amt = sum((inv.total_amount - inv.amount_paid) for inv in invoices)

        batch = PaymentBatch(
            batch_number=batch_number,
            total_amount=total_batch_amt,
            currency=invoices[0].currency if invoices else 'USD',
            total_invoices=len(invoices),
            status='Draft',
            created_by_id=user.id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(batch)
        db.flush()

        for inv in invoices:
            outstanding = inv.total_amount - inv.amount_paid
            req_num = f'PAY-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'
            pay_req = PaymentRequest(
                request_number=req_num,
                invoice_id=inv.id,
                batch_id=batch.id,
                requested_amount=outstanding,
                currency=inv.currency,
                status='Payment_Requested',
                payment_method='NEFT/RTGS',
                requested_by_id=user.id,
                requested_at=datetime.now(timezone.utc)
            )
            db.add(pay_req)
            inv.status = 'Payment_Processing'

        db.commit()
        db.refresh(batch)
        return batch

    def execute_payment(
        self,
        db: Session,
        payment_request_id: str,
        simulate_failure: bool = False
    ) -> PaymentTransaction:
        req = db.query(PaymentRequest).filter(PaymentRequest.id == payment_request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail='Payment request not found.')

        invoice = req.invoice
        txn_ref = f'TXN-{uuid.uuid4().hex[:10].upper()}'
        bank_utr = f'UTR{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:4].upper()}'

        if simulate_failure:
            txn = PaymentTransaction(
                payment_request_id=req.id,
                transaction_reference=txn_ref,
                bank_reference_number=None,
                amount_paid=Decimal('0.00'),
                currency=req.currency,
                payment_date=date.today(),
                status='Failed',
                failure_reason='Simulated Bank Gateway Error: Insufficient Account Balance or Invalid IFSC'
            )
            db.add(txn)
            req.status = 'Failed'
            invoice.status = 'Ready_For_Payment'  # Revert back for retry
            db.commit()
            return txn

        # Successful payment execution simulation
        txn = PaymentTransaction(
            payment_request_id=req.id,
            transaction_reference=txn_ref,
            bank_reference_number=bank_utr,
            amount_paid=req.requested_amount,
            currency=req.currency,
            payment_date=date.today(),
            status='Success',
            failure_reason=None
        )
        db.add(txn)

        req.status = 'Paid'
        invoice.amount_paid += req.requested_amount
        if invoice.amount_paid >= invoice.total_amount:
            invoice.status = 'Paid'
        else:
            invoice.status = 'Partially_Paid'

        # Generate Payment Advice
        advice_num = f'ADV-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:5].upper()}'
        tds_deduction = round(req.requested_amount * Decimal('0.02'), 2)  # 2% standard TDS deduction simulation
        net_paid = req.requested_amount - tds_deduction

        advice = PaymentAdvice(
            advice_number=advice_num,
            payment_request_id=req.id,
            vendor_id=invoice.vendor_id or (db.query(Vendor).first().id if db.query(Vendor).first() else None),
            total_gross_amount=req.requested_amount,
            tax_deducted_tds=tds_deduction,
            other_deductions=Decimal('0.00'),
            net_paid_amount=net_paid,
            payment_date=date.today(),
            bank_ref_no=bank_utr
        )
        db.add(advice)

        # Update parent batch status if part of batch
        if req.batch_id:
            batch = db.query(PaymentBatch).filter(PaymentBatch.id == req.batch_id).first()
            if batch:
                all_reqs = db.query(PaymentRequest).filter(PaymentRequest.batch_id == batch.id).all()
                if all(r.status == 'Paid' for r in all_reqs):
                    batch.status = 'Completed'
                    batch.processed_at = datetime.now(timezone.utc)
                else:
                    batch.status = 'Processing'

        db.commit()
        db.refresh(txn)
        return txn

payment_service = PaymentService()
