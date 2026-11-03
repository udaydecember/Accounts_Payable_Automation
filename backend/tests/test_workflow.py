from decimal import Decimal
from datetime import date
import pytest
from fastapi import HTTPException
from backend.app.core.database import SessionLocal
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.services.workflow_engine import workflow_engine

def test_workflow_maker_checker_enforcement():
    db = SessionLocal()
    try:
        maker = db.query(User).filter(User.email == "maker@enterprise.com").first()
        approver = db.query(User).filter(User.email == "approver@enterprise.com").first()

        inv = Invoice(
            invoice_number="INV-MAKER-CHECKER-01",
            invoice_date=date.today(),
            total_amount=Decimal("3500.00"),
            uploader_id=maker.id,  # Maker is the creator
            status="Draft"
        )
        db.add(inv)
        db.commit()

        # Route for approval
        instance = workflow_engine.initiate_workflow(db, inv)
        assert instance.status == "Pending"

        # Attempt Maker approving their own invoice -> Must raise HTTP 403
        with pytest.raises(HTTPException) as exc_info:
            workflow_engine.process_action(db, inv, maker, "Approve", comments="Self approval")
        assert exc_info.value.status_code == 403
        assert "Maker-Checker Violation" in exc_info.value.detail

        # Independent approver approving
        manager = db.query(User).filter(User.email == "manager@enterprise.com").first()
        updated_inst = workflow_engine.process_action(db, inv, manager, "Approve", comments="Verified and approved.")
        assert updated_inst.status == "Approved"
        assert inv.status == "Ready_For_Payment"
    finally:
        db.close()
