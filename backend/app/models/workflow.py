import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ApprovalWorkflow(Base):
    __tablename__ = 'approval_workflows'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rules = relationship('ApprovalRule', back_populates='workflow', cascade='all, delete-orphan')

class ApprovalRule(Base):
    __tablename__ = 'approval_rules'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('approval_workflows.id', ondelete='CASCADE'), nullable=False, index=True)
    rule_name = Column(String(100), nullable=False)
    min_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    max_amount = Column(Numeric(15, 2), nullable=True)  # Null means infinite / no upper cap
    department = Column(String(100), nullable=True)     # Null means any department
    step_order = Column(Integer, default=1, nullable=False)
    required_role = Column(String(50), nullable=False)  # approver, ap_manager, admin, finance_executive
    approver_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_parallel = Column(Boolean, default=False)

    workflow = relationship('ApprovalWorkflow', back_populates='rules')
    approver = relationship('User')

class ApprovalInstance(Base):
    __tablename__ = 'approval_instances'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey('invoices.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    workflow_id = Column(String(36), ForeignKey('approval_workflows.id', ondelete='SET NULL'), nullable=True)
    status = Column(String(50), default='Pending', index=True)  # Pending, Approved, Rejected, Changes_Requested
    current_step_order = Column(Integer, default=1)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    invoice = relationship('Invoice', back_populates='approval_instance')
    workflow = relationship('ApprovalWorkflow')
    steps = relationship('ApprovalStep', back_populates='instance', cascade='all, delete-orphan')

class ApprovalStep(Base):
    __tablename__ = 'approval_steps'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    instance_id = Column(String(36), ForeignKey('approval_instances.id', ondelete='CASCADE'), nullable=False, index=True)
    step_order = Column(Integer, default=1, nullable=False)
    step_name = Column(String(100), nullable=False)
    assigned_role = Column(String(50), nullable=False)
    assigned_user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    status = Column(String(50), default='Pending', index=True)  # Pending, Approved, Rejected, Changes_Requested, Skipped
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    instance = relationship('ApprovalInstance', back_populates='steps')
    assigned_user = relationship('User')
    actions = relationship('ApprovalAction', back_populates='step', cascade='all, delete-orphan')

class ApprovalAction(Base):
    __tablename__ = 'approval_actions'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    step_id = Column(String(36), ForeignKey('approval_steps.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=False)
    action = Column(String(50), nullable=False)  # Approve, Reject, Request_Changes, Reassign
    comments = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    step = relationship('ApprovalStep', back_populates='actions')
    user = relationship('User')
