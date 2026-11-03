from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.models.payment import PaymentRequest, PaymentBatch, PaymentTransaction, PaymentAdvice
from backend.app.schemas.payment import (
    PaymentRequestResponse, PaymentBatchResponse, PaymentTransactionResponse,
    PaymentAdviceResponse, PaymentRequestCreate, PaymentBatchCreate
)
from backend.app.services.payment_service import payment_service
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/payments", tags=["Payments"])

class ExecutePaymentRequest(BaseModel):
    simulate_failure: bool = False

@router.get("/ready", response_model=List[dict])
def list_ready_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).filter(Invoice.status.in_(["Ready_For_Payment", "Partially_Paid"])).all()
    results = []
    for inv in invoices:
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor_name_raw or (inv.vendor.vendor_name if inv.vendor else "Unknown"),
            "total_amount": float(inv.total_amount),
            "amount_paid": float(inv.amount_paid),
            "outstanding_amount": float(inv.total_amount - inv.amount_paid),
            "currency": inv.currency,
            "due_date": str(inv.due_date or inv.invoice_date),
            "status": inv.status
        })
    return results

@router.get("/requests", response_model=List[PaymentRequestResponse])
def list_payment_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PaymentRequest)
    if status:
        query = query.filter(PaymentRequest.status == status)
    return query.order_by(PaymentRequest.requested_at.desc()).all()

@router.post("/request", response_model=PaymentRequestResponse)
def create_payment_request(
    req: PaymentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "finance_executive"]))
):
    pay_req = payment_service.create_payment_request(
        db=db,
        invoice_id=req.invoice_id,
        user=current_user,
        requested_amount=req.requested_amount,
        payment_method=req.payment_method
    )
    log_audit(db, action="CREATE_PAYMENT_REQUEST", entity_name="PaymentRequest", entity_id=pay_req.id, user_id=current_user.id, details={"invoice_id": req.invoice_id, "amount": str(req.requested_amount)})
    return pay_req

@router.post("/batch", response_model=PaymentBatchResponse)
def create_payment_batch(
    req: PaymentBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "finance_executive"]))
):
    batch = payment_service.create_batch(db, req.invoice_ids, current_user)
    log_audit(db, action="CREATE_PAYMENT_BATCH", entity_name="PaymentBatch", entity_id=batch.id, user_id=current_user.id, details={"batch_number": batch.batch_number, "total_amount": str(batch.total_amount)})
    return batch

@router.get("/batches", response_model=List[PaymentBatchResponse])
def list_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PaymentBatch).order_by(PaymentBatch.created_at.desc()).all()

@router.post("/execute/{payment_request_id}", response_model=PaymentTransactionResponse)
def execute_payment(
    payment_request_id: str,
    exec_req: ExecutePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "finance_executive"]))
):
    txn = payment_service.execute_payment(
        db=db,
        payment_request_id=payment_request_id,
        simulate_failure=exec_req.simulate_failure
    )
    log_audit(db, action="EXECUTE_PAYMENT", entity_name="PaymentTransaction", entity_id=txn.id, user_id=current_user.id, details={"status": txn.status, "ref": txn.transaction_reference})
    return txn

@router.get("/advice/{advice_id}", response_model=PaymentAdviceResponse)
def get_payment_advice(advice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    advice = db.query(PaymentAdvice).filter(PaymentAdvice.id == advice_id).first()
    if not advice:
        raise HTTPException(status_code=404, detail="Payment advice not found")
    return advice
