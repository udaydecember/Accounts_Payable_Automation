from decimal import Decimal
from datetime import date
import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.invoice import Invoice, InvoiceLineItem
from backend.app.models.po_grn import PurchaseOrder
from backend.app.services.matching_engine import matching_engine

def test_po_matching_success():
    db = SessionLocal()
    try:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == "PO-2026-8801").first()
        assert po is not None

        # Invoice matching PO-2026-8801 exactly
        inv = Invoice(
            invoice_number="INV-TEST-MATCH-01",
            vendor_id=po.vendor_id,
            po_number="PO-2026-8801",
            invoice_date=date.today(),
            total_amount=po.total_amount,
            status="Draft"
        )
        db.add(inv)
        db.flush()

        item = InvoiceLineItem(
            invoice_id=inv.id,
            line_number=1,
            item_description="Precision Industrial Valve Unit",
            material_code="MAT-VALVE-01",
            quantity=Decimal("10.0000"),
            unit_price=Decimal("1059.32"),
            line_total=Decimal("12500.00")
        )
        db.add(item)
        db.commit()

        status, details = matching_engine.perform_matching(db, inv)
        assert status == "Matched"
        assert details["match_type"] == "Three_Way"
    finally:
        db.close()

def test_po_matching_price_mismatch():
    db = SessionLocal()
    try:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == "PO-2026-8801").first()
        assert po is not None

        # Invoice with unit price higher than PO by 20%
        inv = Invoice(
            invoice_number="INV-TEST-MISMATCH-02",
            vendor_id=po.vendor_id,
            po_number="PO-2026-8801",
            invoice_date=date.today(),
            total_amount=Decimal("15000.00"),
            status="Draft"
        )
        db.add(inv)
        db.flush()

        item = InvoiceLineItem(
            invoice_id=inv.id,
            line_number=1,
            item_description="Precision Industrial Valve Unit",
            material_code="MAT-VALVE-01",
            quantity=Decimal("10.0000"),
            unit_price=Decimal("1300.00"),  # Exceeds PO unit price (1059.32) by > 2%
            line_total=Decimal("15000.00")
        )
        db.add(item)
        db.commit()

        status, details = matching_engine.perform_matching(db, inv)
        assert status == "Mismatched"
        assert len(details["discrepancies"]) > 0
    finally:
        db.close()
