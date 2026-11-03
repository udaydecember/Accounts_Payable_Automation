from decimal import Decimal
from datetime import date
import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.invoice import Invoice, InvoiceLineItem
from backend.app.models.vendor import Vendor
from backend.app.services.validation_engine import validation_engine

def test_validation_mandatory_fields_and_math():
    db = SessionLocal()
    try:
        # Create an invalid invoice with missing number and math discrepancy
        inv = Invoice(
            invoice_number="",  # Missing
            invoice_date=date.today(),
            total_amount=Decimal("1000.00"),
            subtotal=Decimal("500.00"),
            total_tax_amount=Decimal("100.00"),  # 500 + 100 != 1000
            currency="USD",
            status="Draft"
        )
        db.add(inv)
        db.commit()

        passed, exceptions = validation_engine.validate_invoice(db, inv)
        assert passed is False
        rule_codes = [e["rule_code"] for e in exceptions]
        assert "MANDATORY_INVOICE_NUM_MISSING" in rule_codes
        assert "AMOUNT_CALCULATION_MISMATCH" in rule_codes
    finally:
        db.close()

def test_validation_duplicate_detection():
    db = SessionLocal()
    try:
        # Query existing Acme vendor
        vendor = db.query(Vendor).filter(Vendor.vendor_code == "VEND-ACME-01").first()
        assert vendor is not None

        # Existing invoice has number INV-2026-1001
        dup_inv = Invoice(
            invoice_number="INV-2026-1001",
            vendor_id=vendor.id,
            invoice_date=date.today(),
            total_amount=Decimal("12500.00"),
            subtotal=Decimal("10593.22"),
            total_tax_amount=Decimal("1906.78"),
            currency="USD",
            status="Draft"
        )
        db.add(dup_inv)
        db.commit()

        passed, exceptions = validation_engine.validate_invoice(db, dup_inv)
        assert passed is False
        rule_codes = [e["rule_code"] for e in exceptions]
        assert "DUPLICATE_INVOICE_EXACT" in rule_codes
    finally:
        db.close()
