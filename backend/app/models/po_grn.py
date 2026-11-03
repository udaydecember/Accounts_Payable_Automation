import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Text, Integer, Numeric
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PurchaseOrder(Base):
    __tablename__ = 'purchase_orders'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number = Column(String(100), unique=True, nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey('vendors.id', ondelete='RESTRICT'), nullable=False, index=True)
    po_date = Column(Date, default=date.today, nullable=False)
    delivery_date = Column(Date)
    currency = Column(String(10), default='USD')
    payment_terms = Column(String(50), default='Net 30')
    status = Column(String(50), default='Open', index=True)  # Open, Partially Received, Fully Received, Closed, Cancelled
    total_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vendor = relationship('Vendor', back_populates='purchase_orders')
    line_items = relationship('PurchaseOrderLineItem', back_populates='purchase_order', cascade='all, delete-orphan')
    goods_receipts = relationship('GoodsReceipt', back_populates='purchase_order')

class PurchaseOrderLineItem(Base):
    __tablename__ = 'purchase_order_line_items'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_id = Column(String(36), ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False, index=True)
    line_number = Column(Integer, nullable=False)
    item_description = Column(String(255), nullable=False)
    material_code = Column(String(100), index=True)
    quantity = Column(Numeric(15, 4), nullable=False)
    received_quantity = Column(Numeric(15, 4), default=0.0000)
    invoiced_quantity = Column(Numeric(15, 4), default=0.0000)
    uom = Column(String(20), default='EA')
    unit_price = Column(Numeric(15, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00)
    tax_amount = Column(Numeric(15, 2), default=0.00)
    line_total = Column(Numeric(15, 2), nullable=False)

    purchase_order = relationship('PurchaseOrder', back_populates='line_items')
    grn_line_items = relationship('GoodsReceiptLineItem', back_populates='po_line_item')

class GoodsReceipt(Base):
    __tablename__ = 'goods_receipts'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grn_number = Column(String(100), unique=True, nullable=False, index=True)
    po_id = Column(String(36), ForeignKey('purchase_orders.id', ondelete='RESTRICT'), nullable=False, index=True)
    receipt_date = Column(Date, default=date.today, nullable=False)
    received_by = Column(String(150))
    status = Column(String(50), default='Verified', index=True)  # Verified, Pending Inspection, Rejected
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    purchase_order = relationship('PurchaseOrder', back_populates='goods_receipts')
    line_items = relationship('GoodsReceiptLineItem', back_populates='goods_receipt', cascade='all, delete-orphan')

class GoodsReceiptLineItem(Base):
    __tablename__ = 'goods_receipt_line_items'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grn_id = Column(String(36), ForeignKey('goods_receipts.id', ondelete='CASCADE'), nullable=False, index=True)
    po_line_item_id = Column(String(36), ForeignKey('purchase_order_line_items.id', ondelete='SET NULL'), nullable=True, index=True)
    item_description = Column(String(255), nullable=False)
    material_code = Column(String(100))
    received_quantity = Column(Numeric(15, 4), nullable=False)
    accepted_quantity = Column(Numeric(15, 4), nullable=False)
    rejected_quantity = Column(Numeric(15, 4), default=0.0000)
    uom = Column(String(20), default='EA')

    goods_receipt = relationship('GoodsReceipt', back_populates='line_items')
    po_line_item = relationship('PurchaseOrderLineItem', back_populates='grn_line_items')
