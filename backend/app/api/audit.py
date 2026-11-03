from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.system import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/logs")
def list_audit_logs(
    entity_name: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "auditor"]))
):
    query = db.query(AuditLog)
    if entity_name:
        query = query.filter(AuditLog.entity_name == entity_name)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_name": l.entity_name,
            "entity_id": l.entity_id,
            "user_email": l.user.email if l.user else "System",
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": str(l.created_at)
        }
        for l in logs
    ]
