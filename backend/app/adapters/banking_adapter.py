from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.system import IntegrationConfiguration, IntegrationLog

class MockBankingAdapter:
    def __init__(self):
        self.system_name = 'Mock_Banking'

    def test_connection(self, db: Session) -> Dict[str, Any]:
        config = db.query(IntegrationConfiguration).filter(
            IntegrationConfiguration.system_name == self.system_name
        ).first()
        return {
            'system_name': self.system_name,
            'status': 'Connected' if (config and config.is_enabled) else 'Disconnected',
            'gateway': 'Corporate Banking Open API Gateway v3.1',
            'supported_methods': ['ACH', 'NEFT', 'RTGS', 'Wire'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

mock_banking_adapter = MockBankingAdapter()
