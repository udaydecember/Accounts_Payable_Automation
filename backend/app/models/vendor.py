import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Vendor(Base):
    __tablename__ = 'vendors'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_name = Column(String(200), nullable=False, index=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    vendor_type = Column(String(50), default='Standard')  # Standard, Critical, Sole Source, Service
    contact_person = Column(String(150))
    email = Column(String(255), index=True)
    phone = Column(String(50))
    billing_address = Column(Text)
    shipping_address = Column(Text)
    gstin = Column(String(20), index=True)
    pan = Column(String(20), index=True)
    tin = Column(String(50))
    currency = Column(String(10), default='USD')
    payment_terms = Column(String(50), default='Net 30')  # Net 15, Net 30, Net 60, Immediate
    status = Column(String(30), default='Active', index=True)  # Active, Inactive, Pending Approval, Blocked
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    bank_accounts = relationship('VendorBankAccount', back_populates='vendor', cascade='all, delete-orphan')
    documents = relationship('VendorDocument', back_populates='vendor', cascade='all, delete-orphan')
    invoices = relationship('Invoice', back_populates='vendor')
    purchase_orders = relationship('PurchaseOrder', back_populates='vendor')

class VendorBankAccount(Base):
    __tablename__ = 'vendor_bank_accounts'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String(36), ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False, index=True)
    bank_name = Column(String(150), nullable=False)
    account_number_encrypted = Column(String(255), nullable=False)
    account_number_masked = Column(String(50), nullable=False)
    ifsc_code = Column(String(50), nullable=False)  # or routing code
    branch_name = Column(String(100))
    is_primary = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vendor = relationship('Vendor', back_populates='bank_accounts')

class VendorDocument(Base):
    __tablename__ = 'vendor_documents'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String(36), ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)  # GST Certificate, MSME, Cheque, PAN, Agreement
    document_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    is_verified = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vendor = relationship('Vendor', back_populates='documents')
