import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey, Text, Integer, Numeric
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PaymentBatch(Base):
    __tablename__ = 'payment_batches'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_number = Column(String(100), unique=True, nullable=False, index=True)
    total_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    currency = Column(String(10), default='USD')
    total_invoices = Column(Integer, default=0)
    status = Column(String(50), default='Draft', index=True)  # Draft, Processing, Completed, Failed
    created_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)

    created_by = relationship('User')
    payment_requests = relationship('PaymentRequest', back_populates='batch')

class PaymentRequest(Base):
    __tablename__ = 'payment_requests'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_number = Column(String(100), unique=True, nullable=False, index=True)
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='RESTRICT'), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey('payment_batches.id', ondelete='SET NULL'), nullable=True, index=True)
    requested_amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    status = Column(String(50), default='Payment_Requested', index=True)  # Ready_For_Payment, Payment_Requested, Payment_Processing, Partially_Paid, Paid, Failed, Cancelled
    payment_method = Column(String(50), default='NEFT/RTGS')  # ACH, NEFT/RTGS, Wire, Cheque
    requested_by_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship('Invoice', back_populates='payment_requests')
    batch = relationship('PaymentBatch', back_populates='payment_requests')
    requested_by = relationship('User')
    transactions = relationship('PaymentTransaction', back_populates='payment_request', cascade='all, delete-orphan')
    advice = relationship('PaymentAdvice', back_populates='payment_request', uselist=False, cascade='all, delete-orphan')

class PaymentTransaction(Base):
    __tablename__ = 'payment_transactions'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_request_id = Column(String(36), ForeignKey('payment_requests.id', ondelete='CASCADE'), nullable=False, index=True)
    transaction_reference = Column(String(100), unique=True, nullable=False, index=True)
    bank_reference_number = Column(String(100), index=True)  # UTR / Bank trace
    amount_paid = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    payment_date = Column(Date, default=date.today, nullable=False)
    status = Column(String(50), default='Success', index=True)  # Success, Pending, Failed
    failure_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    payment_request = relationship('PaymentRequest', back_populates='transactions')

class PaymentAdvice(Base):
    __tablename__ = 'payment_advice'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    advice_number = Column(String(100), unique=True, nullable=False, index=True)
    payment_request_id = Column(String(36), ForeignKey('payment_requests.id', ondelete='CASCADE'), nullable=False, index=True)
    vendor_id = Column(String(36), ForeignKey('vendors.id', ondelete='RESTRICT'), nullable=False, index=True)
    total_gross_amount = Column(Numeric(15, 2), nullable=False)
    tax_deducted_tds = Column(Numeric(15, 2), default=0.00)
    other_deductions = Column(Numeric(15, 2), default=0.00)
    net_paid_amount = Column(Numeric(15, 2), nullable=False)
    payment_date = Column(Date, default=date.today, nullable=False)
    bank_ref_no = Column(String(100))
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    payment_request = relationship('PaymentRequest', back_populates='advice')
    vendor = relationship('Vendor')
