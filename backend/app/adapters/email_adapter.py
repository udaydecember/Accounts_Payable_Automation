from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.system import IntegrationConfiguration, IntegrationLog

class EmailConnectorAdapter:
    def __init__(self):
        self.system_name = 'Email_Connector'

    def check_inbox(self, db: Session) -> Dict[str, Any]:
        config = db.query(IntegrationConfiguration).filter(
            IntegrationConfiguration.system_name == self.system_name
        ).first()
        return {
            'system_name': self.system_name,
            'status': 'Connected' if (config and config.is_enabled) else 'Disconnected',
            'inbox_address': 'invoices-ap@company.com',
            'unread_invoices_found': 2,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

email_connector_adapter = EmailConnectorAdapter()
