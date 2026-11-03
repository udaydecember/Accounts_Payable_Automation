from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

class PaymentRequestCreate(BaseModel):
    invoice_id: str
    requested_amount: Decimal
    payment_method: str = 'NEFT/RTGS'

class PaymentTransactionResponse(BaseModel):
    id: str
    transaction_reference: str
    bank_reference_number: Optional[str] = None
    amount_paid: Decimal
    currency: str
    payment_date: date
    status: str
    failure_reason: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class PaymentAdviceResponse(BaseModel):
    id: str
    advice_number: str
    vendor_id: str
    total_gross_amount: Decimal
    tax_deducted_tds: Decimal
    other_deductions: Decimal
    net_paid_amount: Decimal
    payment_date: date
    bank_ref_no: Optional[str] = None
    generated_at: datetime
    class Config:
        from_attributes = True

class PaymentRequestResponse(BaseModel):
    id: str
    request_number: str
    invoice_id: str
    batch_id: Optional[str] = None
    requested_amount: Decimal
    currency: str
    status: str
    payment_method: str
    requested_at: datetime
    transactions: List[PaymentTransactionResponse] = []
    advice: Optional[PaymentAdviceResponse] = None
    class Config:
        from_attributes = True

class PaymentBatchCreate(BaseModel):
    invoice_ids: List[str]

class PaymentBatchResponse(BaseModel):
    id: str
    batch_number: str
    total_amount: Decimal
    currency: str
    total_invoices: int
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    payment_requests: List[PaymentRequestResponse] = []
    class Config:
        from_attributes = True
