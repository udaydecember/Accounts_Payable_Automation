from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

class POLineItemResponse(BaseModel):
    id: str
    line_number: int
    item_description: str
    material_code: Optional[str] = None
    quantity: Decimal
    received_quantity: Decimal
    invoiced_quantity: Decimal
    uom: str
    unit_price: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    line_total: Decimal
    class Config:
        from_attributes = True

class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    vendor_id: str
    po_date: date
    delivery_date: Optional[date] = None
    currency: str
    payment_terms: str
    status: str
    total_amount: Decimal
    tax_amount: Decimal
    created_at: datetime
    line_items: List[POLineItemResponse] = []
    class Config:
        from_attributes = True

class GRNLineItemResponse(BaseModel):
    id: str
    item_description: str
    material_code: Optional[str] = None
    received_quantity: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal
    uom: str
    class Config:
        from_attributes = True

class GoodsReceiptResponse(BaseModel):
    id: str
    grn_number: str
    po_id: str
    receipt_date: date
    received_by: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    line_items: List[GRNLineItemResponse] = []
    class Config:
        from_attributes = True

class InvoicePOMatchResponse(BaseModel):
    id: str
    invoice_id: str
    po_id: Optional[str] = None
    grn_id: Optional[str] = None
    match_type: str
    match_status: str
    header_variance_amount: Decimal
    price_variance_pct: float
    quantity_variance: float
    discrepancy_details: Optional[str] = None
    is_resolved: bool
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True
