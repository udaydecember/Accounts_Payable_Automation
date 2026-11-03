import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Text, Integer, Numeric, Float
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(100), nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True, index=True)
    vendor_name_raw = Column(String(200))
    vendor_gstin = Column(String(20))
    invoice_date = Column(Date, default=date.today, nullable=False, index=True)
    due_date = Column(Date, nullable=True)
    po_number = Column(String(100), index=True)
    payment_terms = Column(String(50), default='Net 30')
    currency = Column(String(10), default='USD')
    billing_address = Column(Text)
    shipping_address = Column(Text)
    
    # Financials (Exact Numeric Decimal)
    subtotal = Column(Numeric(15, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0.00)
    taxable_amount = Column(Numeric(15, 2), default=0.00)
    cgst_amount = Column(Numeric(15, 2), default=0.00)
    sgst_amount = Column(Numeric(15, 2), default=0.00)
    igst_amount = Column(Numeric(15, 2), default=0.00)
    total_tax_amount = Column(Numeric(15, 2), default=0.00)
    round_off_amount = Column(Numeric(15, 2), default=0.00)
    total_amount = Column(Numeric(15, 2), default=0.00, nullable=False, index=True)
    amount_payable = Column(Numeric(15, 2), default=0.00, nullable=False)
    amount_paid = Column(Numeric(15, 2), default=0.00, nullable=False)
    
    bank_account_number = Column(String(50))
    bank_ifsc = Column(String(50))
    bank_name = Column(String(100))

    # Lifecycle Status
    status = Column(String(50), default='Draft', nullable=False, index=True)
    source = Column(String(50), default='Manual_Upload')  # Manual_Upload, Bulk_Upload, Email_Connector, Vendor_Portal
    
    # Ownership & Maker-Checker
    uploader_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    department = Column(String(100), default='Finance')
    notes = Column(Text)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vendor = relationship('Vendor', back_populates='invoices')
    uploader = relationship('User', foreign_keys=[uploader_id])
    documents = relationship('InvoiceDocument', back_populates='invoice', cascade='all, delete-orphan')
    line_items = relationship('InvoiceLineItem', back_populates='invoice', cascade='all, delete-orphan')
    extractions = relationship('InvoiceExtraction', back_populates='invoice', cascade='all, delete-orphan')
    validations = relationship('InvoiceValidation', back_populates='invoice', cascade='all, delete-orphan')
    exceptions = relationship('InvoiceException', back_populates='invoice', cascade='all, delete-orphan')
    matches = relationship('InvoicePOMatch', back_populates='invoice', cascade='all, delete-orphan')
    approval_instance = relationship('ApprovalInstance', back_populates='invoice', uselist=False, cascade='all, delete-orphan')
    payment_requests = relationship('PaymentRequest', back_populates='invoice')

class InvoiceDocument(Base):
    __tablename__ = 'invoice_documents'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default='application/pdf')
    file_hash_sha256 = Column(String(64), index=True)
    page_count = Column(Integer, default=1)
    uploaded_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='documents')
    uploaded_by = relationship('User')

class InvoiceLineItem(Base):
    __tablename__ = 'invoice_line_items'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    line_number = Column(Integer, nullable=False)
    item_description = Column(String(255), nullable=False)
    material_code = Column(String(100), index=True)
    quantity = Column(Numeric(15, 4), nullable=False)
    uom = Column(String(20), default='EA')
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=0.00)
    tax_amount = Column(Numeric(15, 2), default=0.00)
    line_total = Column(Numeric(15, 2), nullable=False)
    po_line_reference = Column(Integer, nullable=True)

    invoice = relationship('Invoice', back_populates='line_items')

class InvoiceExtraction(Base):
    __tablename__ = 'invoice_extractions'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    model_name = Column(String(100), default='Document-Parser-v1')
    ocr_engine = Column(String(50), default='Hybrid-OCR')
    extraction_status = Column(String(50), default='Completed')  # In_Progress, Completed, Failed
    raw_text = Column(Text)
    overall_confidence = Column(Float, default=0.95)
    extracted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='extractions')
    field_values = relationship('ExtractionFieldValue', back_populates='extraction', cascade='all, delete-orphan')

class ExtractionFieldValue(Base):
    __tablename__ = 'extraction_field_values'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    extraction_id = Column(String(36), ForeignKey('invoice_extractions.id', ondelete='CASCADE'), nullable=False, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    original_value = Column(Text)
    corrected_value = Column(Text)
    confidence_score = Column(Float, default=1.0)
    bounding_box = Column(String(255))  # JSON string or coordinates: [ymin, xmin, ymax, xmax]
    page_number = Column(Integer, default=1)
    is_corrected = Column(Boolean, default=False)
    corrected_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    corrected_at = Column(DateTime, nullable=True)

    extraction = relationship('InvoiceExtraction', back_populates='field_values')
    corrected_by = relationship('User')

class InvoiceValidation(Base):
    __tablename__ = 'invoice_validations'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    validation_status = Column(String(50), default='Passed')  # Passed, Failed, Warnings
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    validated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='validations')

class InvoiceException(Base):
    __tablename__ = 'invoice_exceptions'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    rule_code = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default='Critical')  # Critical, Warning, Info
    message = Column(String(500), nullable=False)
    suggested_action = Column(String(500))
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    resolution_comments = Column(Text)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='exceptions')
    resolved_by = relationship('User')
