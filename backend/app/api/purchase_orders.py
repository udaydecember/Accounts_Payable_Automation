from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.po_grn import PurchaseOrder, PurchaseOrderLineItem, GoodsReceipt, GoodsReceiptLineItem
from backend.app.schemas.matching import PurchaseOrderResponse, GoodsReceiptResponse
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

class POLineItemCreate(BaseModel):
    line_number: int
    item_description: str
    material_code: str
    quantity: Decimal
    unit_price: Decimal
    uom: str = "EA"
    tax_rate: Decimal = Decimal("18.0")

class POCreate(BaseModel):
    po_number: str
    vendor_id: str
    po_date: date = date.today()
    currency: str = "USD"
    payment_terms: str = "Net 30"
    line_items: List[POLineItemCreate]

@router.get("", response_model=List[PurchaseOrderResponse])
def list_pos(
    vendor_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder)
    if vendor_id:
        query = query.filter(PurchaseOrder.vendor_id == vendor_id)
    return query.order_by(PurchaseOrder.po_date.desc()).all()

@router.post("", response_model=PurchaseOrderResponse)
def create_po(
    po_in: POCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager"]))
):
    existing = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_in.po_number.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="PO number already exists")

    total_amt = Decimal("0.00")
    total_tax = Decimal("0.00")

    po = PurchaseOrder(
        po_number=po_in.po_number.strip().upper(),
        vendor_id=po_in.vendor_id,
        po_date=po_in.po_date,
        currency=po_in.currency,
        payment_terms=po_in.payment_terms,
        status="Open"
    )
    db.add(po)
    db.flush()

    for item in po_in.line_items:
        line_sub = item.quantity * item.unit_price
        tax = line_sub * (item.tax_rate / Decimal("100.0"))
        line_tot = line_sub + tax
        total_amt += line_tot
        total_tax += tax

        line = PurchaseOrderLineItem(
            po_id=po.id,
            line_number=item.line_number,
            item_description=item.item_description,
            material_code=item.material_code,
            quantity=item.quantity,
            received_quantity=Decimal("0.00"),
            invoiced_quantity=Decimal("0.00"),
            uom=item.uom,
            unit_price=item.unit_price,
            tax_rate=item.tax_rate,
            tax_amount=tax,
            line_total=line_tot
        )
        db.add(line)

    po.total_amount = total_amt
    po.tax_amount = total_tax
    db.commit()
    db.refresh(po)
    log_audit(db, action="CREATE_PO", entity_name="PurchaseOrder", entity_id=po.id, user_id=current_user.id, details={"po_number": po.po_number, "total": str(total_amt)})
    return po

@router.get("/goods-receipts", response_model=List[GoodsReceiptResponse])
def list_goods_receipts(
    po_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(GoodsReceipt)
    if po_id:
        query = query.filter(GoodsReceipt.po_id == po_id)
    return query.order_by(GoodsReceipt.receipt_date.desc()).all()
