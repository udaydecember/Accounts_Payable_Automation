from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice, InvoiceException
from backend.app.schemas.invoice import InvoiceExceptionResponse
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/validations", tags=["Validation & Exceptions"])

class ExceptionResolveRequest(BaseModel):
    resolution_comments: str

@router.get("/exceptions", response_model=List[InvoiceExceptionResponse])
def list_exceptions(
    severity: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InvoiceException)
    if severity:
        query = query.filter(InvoiceException.severity == severity)
    if is_resolved is not None:
        query = query.filter(InvoiceException.is_resolved == is_resolved)
    return query.order_by(InvoiceException.created_at.desc()).all()

@router.post("/exceptions/{exception_id}/resolve", response_model=InvoiceExceptionResponse)
def resolve_exception(
    exception_id: str,
    req: ExceptionResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager"]))
):
    exc = db.query(InvoiceException).filter(InvoiceException.id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception record not found")

    exc.is_resolved = True
    exc.resolved_by_id = current_user.id
    exc.resolution_comments = req.resolution_comments
    exc.resolved_at = datetime.now(timezone.utc)

    # Check if this resolves all critical exceptions for the invoice
    remaining_critical = db.query(InvoiceException).filter(
        InvoiceException.invoice_id == exc.invoice_id,
        InvoiceException.severity == "Critical",
        InvoiceException.is_resolved == False
    ).count()

    if remaining_critical == 0:
        inv = db.query(Invoice).filter(Invoice.id == exc.invoice_id).first()
        if inv and inv.status == "Validation_Failed":
            inv.status = "Validation_Passed"

    db.commit()
    db.refresh(exc)
    log_audit(db, action="RESOLVE_EXCEPTION", entity_name="InvoiceException", entity_id=exc.id, user_id=current_user.id, details={"comments": req.resolution_comments})
    return exc
