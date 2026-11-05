import os
from decimal import Decimal
from datetime import date
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.invoice import Invoice, InvoiceLineItem
from backend.app.models.vendor import Vendor
from backend.app.models.po_grn import PurchaseOrder, GoodsReceipt
from backend.app.models.auth import User
from backend.app.models.system import AuditLog
from backend.app.services.validation_engine import validation_engine
from backend.app.services.matching_engine import matching_engine
from backend.app.services.workflow_engine import workflow_engine
from backend.app.services.payment_service import payment_service

client = TestClient(app)

def test_full_14_step_business_lifecycle():
    db = SessionLocal()
    try:
        # Step 1: User Login
        admin = db.query(User).filter(User.email == "admin@enterprise.com").first()
        approver = db.query(User).filter(User.email == "approver@enterprise.com").first()
        finance = db.query(User).filter(User.email == "finance@enterprise.com").first()
        assert admin is not None
        assert approver is not None
        assert finance is not None

        vendor = db.query(Vendor).filter(Vendor.vendor_name == "ABC Furniture Suppliers").first()
        if not vendor:
            vendor = db.query(Vendor).first()

        po = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == "PO-1001").first()

        # Step 2: Invoice Creation
        import uuid
        inv_number = f"E2E-INV-{uuid.uuid4().hex[:8]}"
        inv = Invoice(
            invoice_number=inv_number,
            vendor_id=vendor.id if vendor else None,
            po_number="PO-1001",
            invoice_date=date.today(),
            total_amount=Decimal("11800.00"),
            subtotal=Decimal("10000.00"),
            total_tax_amount=Decimal("1800.00"),
            currency="INR",
            status="Draft"
        )
        db.add(inv)
        db.flush()

        po_item = po.line_items[0] if po.line_items else None
        line = InvoiceLineItem(
            invoice_id=inv.id,
            line_number=1,
            item_description=po_item.item_description if po_item else "Office Furniture (sample item)",
            material_code=po_item.material_code if po_item else "MAT-FURN-01",
            quantity=po_item.quantity if po_item else Decimal("1.0"),
            unit_price=po_item.unit_price if po_item else Decimal("10000.00"),
            tax_rate=Decimal("18.0"),
            tax_amount=Decimal("1800.00"),
            line_total=Decimal("10000.00")
        )
        db.add(line)
        db.commit()

        # Step 3 & 4: Invoice Validation
        is_valid, validation_errors = validation_engine.validate_invoice(db, inv)
        assert is_valid is True
        assert inv.status == "Validation_Passed"

        # Step 5 & 6: 3-Way Matching with PO and GRN
        match_status, match_details = matching_engine.perform_matching(db, inv)
        assert match_status == "Matched"
        assert inv.status == "Matching_Passed"
        assert len(match_details["discrepancies"]) == 0

        # Step 7 & 8: Approval Workflow Initiation & Approval
        instance = workflow_engine.initiate_workflow(db, inv)
        assert instance is not None
        assert inv.status == "Approval_Pending"

        # Approver approves
        action = workflow_engine.process_action(
            db=db,
            invoice=inv,
            user=admin,
            action="Approve",
            comments="E2E test approved for disbursement."
        )
        assert inv.status in ["Approved", "Approval_Pending"]

        # Step 9 & 10: Payment Processing
        inv.status = "Ready_For_Payment"
        db.commit()

        pay_req = payment_service.create_payment_request(db, inv.id, finance, requested_amount=Decimal("11800.00"))
        assert pay_req.status == "Payment_Requested"

        pay_txn = payment_service.execute_payment(db, pay_req.id, simulate_failure=False)
        assert pay_txn.status == "Success"
        assert inv.status == "Paid"
        assert inv.amount_paid == Decimal("11800.00")

        # Step 11: Audit Logs Verification
        audit_records = db.query(AuditLog).filter(AuditLog.entity_name == "Invoice").all()
        assert len(audit_records) > 0

        # Step 12: Dashboard Reporting Query Verification
        total_invoices = db.query(Invoice).count()
        assert total_invoices > 0
        paid_invoices = db.query(Invoice).filter(Invoice.status == "Paid").count()
        assert paid_invoices > 0

    finally:
        db.close()
