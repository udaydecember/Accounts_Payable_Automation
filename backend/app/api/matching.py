from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.models.matching import InvoicePOMatch
from backend.app.schemas.matching import InvoicePOMatchResponse
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/matching", tags=["PO and GRN Matching"])

class MatchOverrideRequest(BaseModel):
    resolution_notes: str

@router.get("", response_model=List[InvoicePOMatchResponse])
def list_matches(
    match_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InvoicePOMatch)
    if match_status:
        query = query.filter(InvoicePOMatch.match_status == match_status)
    return query.order_by(InvoicePOMatch.created_at.desc()).all()

@router.get("/{invoice_id}", response_model=Optional[InvoicePOMatchResponse])
def get_invoice_match(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    match = db.query(InvoicePOMatch).filter(InvoicePOMatch.invoice_id == invoice_id).first()
    return match

@router.post("/{match_id}/override", response_model=InvoicePOMatchResponse)
def override_match_discrepancy(
    match_id: str,
    req: MatchOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager"]))
):
    match_rec = db.query(InvoicePOMatch).filter(InvoicePOMatch.id == match_id).first()
    if not match_rec:
        raise HTTPException(status_code=404, detail="Match record not found")

    match_rec.match_status = "Manually_Approved"
    match_rec.is_resolved = True
    match_rec.resolution_notes = req.resolution_notes
    match_rec.resolved_by_id = current_user.id
    match_rec.resolved_at = datetime.now(timezone.utc)

    # Update invoice status
    inv = db.query(Invoice).filter(Invoice.id == match_rec.invoice_id).first()
    if inv:
        inv.status = "Matching_Passed"

    db.commit()
    db.refresh(match_rec)
    log_audit(db, action="OVERRIDE_MATCH_DISCREPANCY", entity_name="InvoicePOMatch", entity_id=match_rec.id, user_id=current_user.id, details={"notes": req.resolution_notes})
    return match_rec
