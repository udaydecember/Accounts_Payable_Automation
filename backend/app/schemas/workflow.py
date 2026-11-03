from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

class ApprovalActionRequest(BaseModel):
    action: str  # Approve, Reject, Request_Changes, Reassign
    comments: Optional[str] = None

class ApprovalStepResponse(BaseModel):
    id: str
    step_order: int
    step_name: str
    assigned_role: str
    assigned_user_id: Optional[str] = None
    status: str
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ApprovalInstanceResponse(BaseModel):
    id: str
    invoice_id: str
    workflow_id: Optional[str] = None
    status: str
    current_step_order: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[ApprovalStepResponse] = []
    class Config:
        from_attributes = True

class ApprovalRuleBase(BaseModel):
    rule_name: str
    min_amount: Decimal = Decimal('0.00')
    max_amount: Optional[Decimal] = None
    department: Optional[str] = None
    step_order: int = 1
    required_role: str = 'approver'
    approver_id: Optional[str] = None
    is_parallel: bool = False

class ApprovalRuleResponse(ApprovalRuleBase):
    id: str
    workflow_id: str
    class Config:
        from_attributes = True

class ApprovalWorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    rules: List[ApprovalRuleResponse] = []
    class Config:
        from_attributes = True
