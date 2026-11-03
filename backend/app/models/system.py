import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(String(255))
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship('User')

class IntegrationConfiguration(Base):
    __tablename__ = 'integration_configurations'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    system_name = Column(String(100), unique=True, nullable=False, index=True)  # SAP_ERP, QuickBooks, Mock_Banking, Email_Connector, GST_Verification, S3_Storage
    system_type = Column(String(50), nullable=False)  # ERP, Accounting, Banking, Email, Tax, Storage
    endpoint_url = Column(String(255))
    auth_type = Column(String(50), default='API_Key')  # API_Key, OAuth2, Basic, None
    api_key_masked = Column(String(100))
    is_enabled = Column(Boolean, default=True)
    connection_status = Column(String(50), default='Connected')  # Connected, Disconnected, Error
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    logs = relationship('IntegrationLog', back_populates='integration', cascade='all, delete-orphan')

class IntegrationLog(Base):
    __tablename__ = 'integration_logs'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    integration_id = Column(String(36), ForeignKey('integration_configurations.id', ondelete='CASCADE'), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # Vendor_Sync, PO_Import, Payment_Export, Invoice_Sync
    status = Column(String(50), default='Success', index=True)  # Success, Failed, Warning
    payload_summary = Column(Text)
    error_message = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    integration = relationship('IntegrationConfiguration', back_populates='logs')

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_name = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    details = Column(Text)  # JSON diff or action description
    ip_address = Column(String(50), default='127.0.0.1')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship('User')

class SystemSetting(Base):
    __tablename__ = 'system_settings'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=False)
    category = Column(String(50), default='General')  # General, OCR, Validation, Workflow, Payment
    description = Column(String(255))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
