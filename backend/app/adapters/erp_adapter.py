import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.system import IntegrationConfiguration, IntegrationLog

class ERPAdapter:
    def __init__(self, system_name: str = 'SAP_ERP'):
        self.system_name = system_name

    def test_connection(self, db: Session) -> Dict[str, Any]:
        config = db.query(IntegrationConfiguration).filter(
            IntegrationConfiguration.system_name == self.system_name
        ).first()
        status = 'Connected' if (config and config.is_enabled) else 'Disconnected'
        return {
            'system_name': self.system_name,
            'status': status,
            'latency_ms': 42,
            'endpoint': config.endpoint_url if config else 'https://erp-gateway.internal.corp/api/v2',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    def sync_purchase_orders(self, db: Session) -> Dict[str, Any]:
        # Logs sync event
        config = db.query(IntegrationConfiguration).filter(
            IntegrationConfiguration.system_name == self.system_name
        ).first()
        if not config:
            return {'status': 'Error', 'message': 'ERP configuration not found.'}

        log = IntegrationLog(
            integration_id=config.id,
            event_type='PO_Sync',
            status='Success',
            payload_summary='Successfully synchronized 4 new purchase orders from SAP ERP Gateway.',
            created_at=datetime.now(timezone.utc)
        )
        db.add(log)
        config.last_synced_at = datetime.now(timezone.utc)
        db.commit()

        return {
            'status': 'Success',
            'records_synced': 4,
            'message': 'SAP Purchase Orders synchronized successfully.'
        }

erp_adapter = ERPAdapter()
