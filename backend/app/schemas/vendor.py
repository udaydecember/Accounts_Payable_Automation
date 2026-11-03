from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class BankAccountBase(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    branch_name: Optional[str] = None
    is_primary: bool = True

class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_number_masked: str
    ifsc_code: str
    branch_name: Optional[str] = None
    is_primary: bool
    is_verified: bool
    created_at: datetime
    class Config:
        from_attributes = True

class VendorDocumentResponse(BaseModel):
    id: str
    document_type: str
    document_name: str
    file_path: str
    file_size: int
    is_verified: bool
    uploaded_at: datetime
    class Config:
        from_attributes = True

class VendorBase(BaseModel):
    vendor_name: str
    vendor_code: str
    vendor_type: str = 'Standard'
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    tin: Optional[str] = None
    currency: str = 'USD'
    payment_terms: str = 'Net 30'
    status: str = 'Active'

class VendorCreate(VendorBase):
    bank_accounts: Optional[List[BankAccountBase]] = []

class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    tin: Optional[str] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None

class VendorResponse(VendorBase):
    id: str
    created_at: datetime
    updated_at: datetime
    bank_accounts: List[BankAccountResponse] = []
    documents: List[VendorDocumentResponse] = []
    class Config:
        from_attributes = True
