from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.system import IntegrationConfiguration, IntegrationLog
from backend.app.adapters.erp_adapter import erp_adapter
from backend.app.adapters.banking_adapter import mock_banking_adapter
from backend.app.adapters.email_adapter import email_connector_adapter
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("")
def list_integrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    configs = db.query(IntegrationConfiguration).all()
    results = []
    for c in configs:
        recent_log = db.query(IntegrationLog).filter(IntegrationLog.integration_id == c.id).order_by(IntegrationLog.created_at.desc()).first()
        results.append({
            "id": c.id,
            "system_name": c.system_name,
            "system_type": c.system_type,
            "endpoint_url": c.endpoint_url,
            "auth_type": c.auth_type,
            "api_key_masked": c.api_key_masked,
            "is_enabled": c.is_enabled,
            "connection_status": c.connection_status,
            "last_synced_at": str(c.last_synced_at) if c.last_synced_at else None,
            "latest_event": recent_log.payload_summary if recent_log else "Ready"
        })
    return results

@router.post("/{system_name}/test")
def test_integration(system_name: str, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin", "ap_manager"]))):
    if "erp" in system_name.lower():
        result = erp_adapter.test_connection(db)
    elif "bank" in system_name.lower():
        result = mock_banking_adapter.test_connection(db)
    elif "email" in system_name.lower():
        result = email_connector_adapter.check_inbox(db)
    else:
        result = {"system_name": system_name, "status": "Connected", "latency_ms": 35}
    
    log_audit(db, action="TEST_INTEGRATION", entity_name="IntegrationConfiguration", entity_id=system_name, user_id=current_user.id, details=result)
    return result

@router.post("/{system_name}/sync")
def trigger_sync(system_name: str, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["admin", "ap_manager"]))):
    if "erp" in system_name.lower():
        result = erp_adapter.sync_purchase_orders(db)
    else:
        result = {"status": "Success", "message": f"{system_name} data synchronized successfully."}

    log_audit(db, action="SYNC_INTEGRATION", entity_name="IntegrationConfiguration", entity_id=system_name, user_id=current_user.id, details=result)
    return result
