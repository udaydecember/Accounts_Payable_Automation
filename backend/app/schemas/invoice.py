from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

class LineItemBase(BaseModel):
    line_number: int
    item_description: str
    material_code: Optional[str] = None
    quantity: Decimal
    uom: str = 'EA'
    unit_price: Decimal
    discount_amount: Decimal = Decimal('0.00')
    tax_rate: Decimal = Decimal('0.00')
    tax_amount: Decimal = Decimal('0.00')
    line_total: Decimal
    po_line_reference: Optional[int] = None

class LineItemResponse(LineItemBase):
    id: str
    invoice_id: str
    class Config:
        from_attributes = True

class ExtractionFieldResponse(BaseModel):
    id: str
    field_name: str
    original_value: Optional[str] = None
    corrected_value: Optional[str] = None
    confidence_score: float = 1.0
    bounding_box: Optional[str] = None
    page_number: int = 1
    is_corrected: bool = False
    corrected_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class InvoiceExtractionResponse(BaseModel):
    id: str
    model_name: str
    ocr_engine: str
    extraction_status: str
    raw_text: Optional[str] = None
    overall_confidence: float
    extracted_at: datetime
    field_values: List[ExtractionFieldResponse] = []
    class Config:
        from_attributes = True

class InvoiceExceptionResponse(BaseModel):
    id: str
    rule_code: str
    severity: str
    message: str
    suggested_action: Optional[str] = None
    is_resolved: bool
    resolution_comments: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class InvoiceValidationResponse(BaseModel):
    id: str
    validation_status: str
    passed_count: int
    failed_count: int
    warning_count: int
    validated_at: datetime
    class Config:
        from_attributes = True

class InvoiceDocumentResponse(BaseModel):
    id: str
    file_name: str
    original_file_name: str
    file_path: str
    file_size: int
    mime_type: str
    file_hash_sha256: Optional[str] = None
    page_count: int = 1
    created_at: datetime
    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    vendor_id: Optional[str] = None
    vendor_name_raw: Optional[str] = None
    vendor_gstin: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    po_number: Optional[str] = None
    payment_terms: str
    currency: str
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    subtotal: Decimal
    discount_amount: Decimal
    taxable_amount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    total_tax_amount: Decimal
    round_off_amount: Decimal
    total_amount: Decimal
    amount_payable: Decimal
    amount_paid: Decimal
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    status: str
    source: str
    uploader_id: Optional[str] = None
    department: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    line_items: List[LineItemResponse] = []
    documents: List[InvoiceDocumentResponse] = []
    extractions: List[InvoiceExtractionResponse] = []
    exceptions: List[InvoiceExceptionResponse] = []
    class Config:
        from_attributes = True

class FieldCorrectionItem(BaseModel):
    field_name: str
    corrected_value: str

class FieldCorrectionBatch(BaseModel):
    corrections: List[FieldCorrectionItem]
