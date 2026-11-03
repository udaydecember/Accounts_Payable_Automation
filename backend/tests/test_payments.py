from decimal import Decimal
from datetime import date
import pytest
from fastapi import HTTPException
from backend.app.core.database import SessionLocal
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.services.payment_service import payment_service

def test_payment_request_and_execution():
    db = SessionLocal()
    try:
        finance_user = db.query(User).filter(User.email == "finance@enterprise.com").first()

        # Invoice in Ready_For_Payment
        inv = Invoice(
            invoice_number="INV-PAY-TEST-01",
            invoice_date=date.today(),
            total_amount=Decimal("2000.00"),
            amount_payable=Decimal("2000.00"),
            amount_paid=Decimal("0.00"),
            status="Ready_For_Payment",
            currency="USD"
        )
        db.add(inv)
        db.commit()

        # 1. Create Payment Request
        req = payment_service.create_payment_request(db, inv.id, finance_user, requested_amount=Decimal("2000.00"))
        assert req.status == "Payment_Requested"
        assert inv.status == "Payment_Processing"

        # 2. Execute Payment
        txn = payment_service.execute_payment(db, req.id, simulate_failure=False)
        assert txn.status == "Success"
        assert txn.bank_reference_number is not None
        assert inv.status == "Paid"
        assert inv.amount_paid == Decimal("2000.00")

        # 3. Check Payment Advice Generated
        assert req.advice is not None
        assert req.advice.net_paid_amount < Decimal("2000.00")  # Verified TDS deduction
    finally:
        db.close()

def test_unapproved_invoice_cannot_be_paid():
    db = SessionLocal()
    try:
        finance_user = db.query(User).filter(User.email == "finance@enterprise.com").first()

        inv = Invoice(
            invoice_number="INV-UNAPPROVED-01",
            invoice_date=date.today(),
            total_amount=Decimal("1500.00"),
            amount_payable=Decimal("1500.00"),
            amount_paid=Decimal("0.00"),
            status="Approval_Pending",  # NOT Ready_For_Payment
            currency="USD"
        )
        db.add(inv)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            payment_service.create_payment_request(db, inv.id, finance_user)
        assert exc_info.value.status_code == 400
        assert "Invoice cannot be paid" in exc_info.value.detail
    finally:
        db.close()
