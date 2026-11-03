import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from backend.app.models.system import AuditLog

def log_audit(
    db: Session,
    action: str,
    entity_name: str,
    entity_id: str,
    user_id: Optional[str] = None,
    details: Optional[Any] = None,
    ip_address: str = '127.0.0.1'
) -> AuditLog:
    details_str = json.dumps(details) if isinstance(details, (dict, list)) else str(details or '')
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_name=entity_name,
        entity_id=str(entity_id),
        details=details_str,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
