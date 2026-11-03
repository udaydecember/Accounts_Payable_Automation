import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Float
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class InvoicePOMatch(Base):
    __tablename__ = 'invoice_po_matches'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    po_id = Column(String(36), ForeignKey('purchase_orders.id', ondelete='SET NULL'), nullable=True, index=True)
    grn_id = Column(String(36), ForeignKey('goods_receipts.id', ondelete='SET NULL'), nullable=True, index=True)
    match_type = Column(String(20), default='Two_Way')  # Two_Way, Three_Way
    match_status = Column(String(50), default='Matched', index=True)  # Matched, Mismatched, Missing_PO, Missing_GRN, Manually_Approved
    header_variance_amount = Column(Numeric(15, 2), default=0.00)
    price_variance_pct = Column(Float, default=0.0)
    quantity_variance = Column(Float, default=0.0)
    discrepancy_details = Column(Text)  # JSON formatted comparison records
    is_resolved = Column(Boolean, default=False)
    resolved_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='matches')
    purchase_order = relationship('PurchaseOrder')
    goods_receipt = relationship('GoodsReceipt')
    resolved_by = relationship('User')
