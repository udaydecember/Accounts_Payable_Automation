import os
from typing import List, Optional
from datetime import datetime, timezone, date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.vendor import Vendor
from backend.app.models.invoice import (
    Invoice, InvoiceDocument, InvoiceLineItem,
    InvoiceExtraction, ExtractionFieldValue, InvoiceValidation, InvoiceException
)
from backend.app.schemas.invoice import InvoiceResponse, FieldCorrectionBatch
from backend.app.services.storage_service import storage_service
from backend.app.services.ocr_engine import ocr_engine
from backend.app.services.validation_engine import validation_engine
from backend.app.services.matching_engine import matching_engine
from backend.app.services.workflow_engine import workflow_engine
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/upload", response_model=List[InvoiceResponse])
def upload_invoices(
    files: List[UploadFile] = File(...),
    source: str = Form("Manual_Upload"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "ap_executive", "vendor"]))
):
    created_invoices = []

    for file in files:
        safe_filename, file_path, file_size, file_hash = storage_service.save_upload_file(file)

        # Duplicate file hash check
        existing_doc = db.query(InvoiceDocument).filter(InvoiceDocument.file_hash_sha256 == file_hash).first()
        if existing_doc:
            # We still record it or associate with invoice but flag duplicate alert
            pass

        # Perform OCR and AI structured field extraction
        extracted = ocr_engine.process_document(file_path, file.filename)

        # Match vendor in master by name or GSTIN
        vendor = None
        if extracted.get("vendor_gstin"):
            vendor = db.query(Vendor).filter(Vendor.gstin.ilike(extracted["vendor_gstin"].strip())).first()
        if not vendor and extracted.get("vendor_name"):
            vendor = db.query(Vendor).filter(Vendor.vendor_name.ilike(f'%{extracted["vendor_name"][:10]}%')).first()

        invoice_date_val = date.today()
        if extracted.get("invoice_date"):
            try:
                invoice_date_val = datetime.strptime(str(extracted["invoice_date"])[:10], "%Y-%m-%d").date()
            except Exception:
                invoice_date_val = date.today()

        due_date_val = None
        if extracted.get("due_date"):
            try:
                due_date_val = datetime.strptime(str(extracted["due_date"])[:10], "%Y-%m-%d").date()
            except Exception:
                due_date_val = None

        invoice = Invoice(
            invoice_number=extracted.get("invoice_number", f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            vendor_id=vendor.id if vendor else None,
            vendor_name_raw=extracted.get("vendor_name"),
            vendor_gstin=extracted.get("vendor_gstin"),
            invoice_date=invoice_date_val,
            due_date=due_date_val,
            po_number=extracted.get("po_number"),
            payment_terms=extracted.get("payment_terms", "Net 30"),
            currency=extracted.get("currency", "USD"),
            subtotal=Decimal(str(extracted.get("taxable_amount", 0.00))),
            discount_amount=Decimal(str(extracted.get("discount_amount", 0.00))),
            taxable_amount=Decimal(str(extracted.get("taxable_amount", 0.00))),
            cgst_amount=Decimal(str(extracted.get("cgst_amount", 0.00))),
            sgst_amount=Decimal(str(extracted.get("sgst_amount", 0.00))),
            igst_amount=Decimal(str(extracted.get("igst_amount", 0.00))),
            total_tax_amount=Decimal(str(extracted.get("total_tax_amount", 0.00))),
            round_off_amount=Decimal(str(extracted.get("round_off_amount", 0.00))),
            total_amount=Decimal(str(extracted.get("total_amount", 0.00))),
            amount_payable=Decimal(str(extracted.get("amount_payable", 0.00))),
            amount_paid=Decimal("0.00"),
            bank_account_number=extracted.get("bank_account_number"),
            bank_ifsc=extracted.get("bank_ifsc"),
            bank_name=extracted.get("bank_name"),
            status="OCR_Completed",
            source=source,
            uploader_id=current_user.id,
            department="Operations"
        )
        db.add(invoice)
        db.flush()

        # Add Document record
        doc = InvoiceDocument(
            invoice_id=invoice.id,
            file_name=safe_filename,
            original_file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or "application/pdf",
            file_hash_sha256=file_hash,
            uploaded_by_id=current_user.id
        )
        db.add(doc)

        # Add Line Items
        for item in extracted.get("line_items", []):
            line_item = InvoiceLineItem(
                invoice_id=invoice.id,
                line_number=item.get("line_number", 1),
                item_description=item.get("item_description", "Item"),
                material_code=item.get("material_code"),
                quantity=Decimal(str(item.get("quantity", 1))),
                uom=item.get("uom", "EA"),
                unit_price=Decimal(str(item.get("unit_price", 0))),
                discount_amount=Decimal(str(item.get("discount_amount", 0))),
                tax_rate=Decimal(str(item.get("tax_rate", 0))),
                tax_amount=Decimal(str(item.get("tax_amount", 0))),
                line_total=Decimal(str(item.get("line_total", 0))),
                po_line_reference=item.get("po_line_reference")
            )
            db.add(line_item)

        # Add Extraction & Confidence scores
        extraction = InvoiceExtraction(
            invoice_id=invoice.id,
            model_name="Document-Parser-v1",
            ocr_engine="Hybrid-OCR",
            extraction_status="Completed",
            raw_text=extracted.get("raw_text", ""),
            overall_confidence=extracted.get("overall_confidence", 0.94),
            extracted_at=datetime.now(timezone.utc)
        )
        db.add(extraction)
        db.flush()

        for fv in extracted.get("field_values", []):
            field_val = ExtractionFieldValue(
                extraction_id=extraction.id,
                field_name=fv["field_name"],
                original_value=str(fv["value"]),
                corrected_value=str(fv["value"]),
                confidence_score=fv["confidence"],
                bounding_box=fv.get("bbox"),
                page_number=fv.get("page", 1),
                is_corrected=False
            )
            db.add(field_val)

        db.commit()

        # Automatic initial validation run
        validation_engine.validate_invoice(db, invoice)
        
        # If PO is present, run matching engine
        if invoice.po_number:
            matching_engine.perform_matching(db, invoice)

        db.refresh(invoice)
        created_invoices.append(invoice)
        log_audit(db, action="INVOICE_UPLOAD", entity_name="Invoice", entity_id=invoice.id, user_id=current_user.id, details={"invoice_number": invoice.invoice_number, "filename": file.filename})

    return created_invoices

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[str] = Query(None),
    vendor_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice)
    
    # If Vendor role, only see their own vendor invoices
    user_roles = [r.name for r in current_user.roles]
    if "vendor" in user_roles and "admin" not in user_roles and "ap_manager" not in user_roles:
        # Vendor portal filter
        vendor = db.query(Vendor).filter(Vendor.email == current_user.email).first()
        if vendor:
            query = query.filter(Invoice.vendor_id == vendor.id)
        else:
            return []

    if status:
        query = query.filter(Invoice.status == status)
    if vendor_id:
        query = query.filter(Invoice.vendor_id == vendor_id)
    if search:
        query = query.filter(
            (Invoice.invoice_number.ilike(f"%{search}%")) |
            (Invoice.vendor_name_raw.ilike(f"%{search}%")) |
            (Invoice.po_number.ilike(f"%{search}%"))
        )
    return query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_detail(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/{invoice_id}/ocr-correct", response_model=InvoiceResponse)
def correct_ocr_fields(
    invoice_id: str,
    batch: FieldCorrectionBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "ap_executive"]))
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    latest_extraction = db.query(InvoiceExtraction).filter(InvoiceExtraction.invoice_id == invoice.id).order_by(InvoiceExtraction.extracted_at.desc()).first()
    if not latest_extraction:
        raise HTTPException(status_code=400, detail="No extraction record found for this invoice")

    changes = {}
    for item in batch.corrections:
        field_rec = db.query(ExtractionFieldValue).filter(
            ExtractionFieldValue.extraction_id == latest_extraction.id,
            ExtractionFieldValue.field_name == item.field_name
        ).first()

        if field_rec:
            changes[item.field_name] = {"old": field_rec.corrected_value, "new": item.corrected_value}
            field_rec.corrected_value = item.corrected_value
            field_rec.is_corrected = True
            field_rec.corrected_by_id = current_user.id
            field_rec.corrected_at = datetime.now(timezone.utc)
            field_rec.confidence_score = 1.0  # Human verified

        # Sync back to invoice master attributes
        if item.field_name == "invoice_number":
            invoice.invoice_number = item.corrected_value
        elif item.field_name == "po_number":
            invoice.po_number = item.corrected_value
        elif item.field_name == "vendor_name":
            invoice.vendor_name_raw = item.corrected_value
            # re-match vendor if possible
            v = db.query(Vendor).filter(Vendor.vendor_name.ilike(f"%{item.corrected_value[:8]}%")).first()
            if v:
                invoice.vendor_id = v.id
        elif item.field_name == "vendor_gstin":
            invoice.vendor_gstin = item.corrected_value
        elif item.field_name == "total_amount":
            try:
                invoice.total_amount = Decimal(item.corrected_value)
                invoice.amount_payable = invoice.total_amount
            except Exception:
                pass
        elif item.field_name == "taxable_amount":
            try:
                invoice.taxable_amount = Decimal(item.corrected_value)
                invoice.subtotal = invoice.taxable_amount
            except Exception:
                pass
        elif item.field_name == "total_tax_amount":
            try:
                invoice.total_tax_amount = Decimal(item.corrected_value)
            except Exception:
                pass

    invoice.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Re-run validation automatically after correction
    validation_engine.validate_invoice(db, invoice)
    if invoice.po_number:
        matching_engine.perform_matching(db, invoice)

    log_audit(db, action="OCR_FIELD_CORRECTION", entity_name="Invoice", entity_id=invoice.id, user_id=current_user.id, details=changes)
    db.refresh(invoice)
    return invoice

@router.post("/{invoice_id}/validate")
def trigger_validation(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    passed, exceptions = validation_engine.validate_invoice(db, invoice)
    return {"passed": passed, "exceptions_count": len(exceptions), "status": invoice.status}

@router.post("/{invoice_id}/match")
def trigger_matching(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    status, details = matching_engine.perform_matching(db, invoice)
    return {"status": status, "details": details}

@router.post("/{invoice_id}/submit-approval")
def submit_for_approval(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "ap_executive"]))
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    instance = workflow_engine.initiate_workflow(db, invoice)
    log_audit(db, action="SUBMIT_FOR_APPROVAL", entity_name="Invoice", entity_id=invoice.id, user_id=current_user.id, details={"status": invoice.status})
    return {"message": "Invoice successfully routed for approval", "workflow_instance_id": instance.id, "status": invoice.status}
