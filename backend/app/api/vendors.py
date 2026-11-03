import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.vendor import Vendor, VendorBankAccount, VendorDocument
from backend.app.schemas.vendor import VendorResponse, VendorCreate, VendorUpdate, BankAccountBase
from backend.app.services.storage_service import storage_service
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.get("", response_model=List[VendorResponse])
def list_vendors(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vendor)
    if status:
        query = query.filter(Vendor.status == status)
    if search:
        query = query.filter(
            (Vendor.vendor_name.ilike(f"%{search}%")) |
            (Vendor.vendor_code.ilike(f"%{search}%")) |
            (Vendor.gstin.ilike(f"%{search}%"))
        )
    return query.order_by(Vendor.vendor_name.asc()).all()

@router.post("", response_model=VendorResponse)
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "vendor"]))
):
    existing = db.query(Vendor).filter(Vendor.vendor_code == vendor_in.vendor_code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor with this vendor code already exists")

    vendor = Vendor(
        vendor_name=vendor_in.vendor_name,
        vendor_code=vendor_in.vendor_code.strip().upper(),
        vendor_type=vendor_in.vendor_type,
        contact_person=vendor_in.contact_person,
        email=vendor_in.email,
        phone=vendor_in.phone,
        billing_address=vendor_in.billing_address,
        shipping_address=vendor_in.shipping_address,
        gstin=vendor_in.gstin,
        pan=vendor_in.pan,
        tin=vendor_in.tin,
        currency=vendor_in.currency,
        payment_terms=vendor_in.payment_terms,
        status="Active"
    )
    db.add(vendor)
    db.flush()

    for bank in (vendor_in.bank_accounts or []):
        masked = f"XXXX-XXXX-{bank.account_number[-4:]}" if len(bank.account_number) >= 4 else "XXXX-XXXX-0000"
        bank_acc = VendorBankAccount(
            vendor_id=vendor.id,
            bank_name=bank.bank_name,
            account_number_encrypted=f"ENC_{bank.account_number}",
            account_number_masked=masked,
            ifsc_code=bank.ifsc_code,
            branch_name=bank.branch_name,
            is_primary=bank.is_primary,
            is_verified=True
        )
        db.add(bank_acc)

    db.commit()
    db.refresh(vendor)
    log_audit(db, action="CREATE_VENDOR", entity_name="Vendor", entity_id=vendor.id, user_id=current_user.id, details={"name": vendor.vendor_name, "code": vendor.vendor_code})
    return vendor

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    update_in: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager"]))
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    update_dict = update_in.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(vendor, field, val)

    vendor.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(vendor)
    log_audit(db, action="UPDATE_VENDOR", entity_name="Vendor", entity_id=vendor.id, user_id=current_user.id, details=update_dict)
    return vendor

@router.post("/{vendor_id}/bank-accounts")
def add_bank_account(
    vendor_id: str,
    bank_in: BankAccountBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager"]))
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    masked = f"XXXX-XXXX-{bank_in.account_number[-4:]}" if len(bank_in.account_number) >= 4 else "XXXX-XXXX-0000"
    bank_acc = VendorBankAccount(
        vendor_id=vendor.id,
        bank_name=bank_in.bank_name,
        account_number_encrypted=f"ENC_{bank_in.account_number}",
        account_number_masked=masked,
        ifsc_code=bank_in.ifsc_code,
        branch_name=bank_in.branch_name,
        is_primary=bank_in.is_primary,
        is_verified=True
    )
    db.add(bank_acc)
    db.commit()
    log_audit(db, action="ADD_VENDOR_BANK_ACCOUNT", entity_name="Vendor", entity_id=vendor.id, user_id=current_user.id, details={"bank": bank_in.bank_name, "masked": masked})
    return {"message": "Bank account added successfully", "account_masked": masked}

@router.post("/{vendor_id}/documents")
def upload_vendor_document(
    vendor_id: str,
    document_type: str = Form("GST_Certificate"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    safe_filename, file_path, file_size, _ = storage_service.save_upload_file(file)
    v_doc = VendorDocument(
        vendor_id=vendor.id,
        document_type=document_type,
        document_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        is_verified=True
    )
    db.add(v_doc)
    db.commit()
    log_audit(db, action="UPLOAD_VENDOR_DOC", entity_name="Vendor", entity_id=vendor.id, user_id=current_user.id, details={"type": document_type, "file": file.filename})
    return {"message": "Vendor document uploaded successfully", "id": v_doc.id}
