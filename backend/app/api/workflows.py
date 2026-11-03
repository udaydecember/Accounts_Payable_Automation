from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.models.workflow import ApprovalWorkflow, ApprovalRule, ApprovalInstance, ApprovalStep, ApprovalAction
from backend.app.schemas.workflow import ApprovalWorkflowResponse, ApprovalInstanceResponse, ApprovalActionRequest, ApprovalRuleBase
from backend.app.services.workflow_engine import workflow_engine
from backend.app.services.audit_service import log_audit

router = APIRouter(prefix="/workflows", tags=["Workflows & Approvals"])

class WorkflowRuleCreate(ApprovalRuleBase):
    pass

@router.get("/inbox", response_model=List[ApprovalInstanceResponse])
def get_approval_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "ap_manager", "approver", "finance_executive"]))
):
    user_roles = [r.name for r in current_user.roles]
    instances = db.query(ApprovalInstance).filter(ApprovalInstance.status == "Pending").all()

    # Filter to only instances where current user has permission for the active step
    eligible = []
    for inst in instances:
        active_step = db.query(ApprovalStep).filter(
            ApprovalStep.instance_id == inst.id,
            ApprovalStep.step_order == inst.current_step_order,
            ApprovalStep.status == "Pending"
        ).first()

        if active_step:
            is_authorized = (
                "admin" in user_roles or
                active_step.assigned_role in user_roles or
                active_step.assigned_user_id == current_user.id
            )
            if is_authorized:
                eligible.append(inst)
    return eligible

@router.post("/action/{invoice_id}", response_model=ApprovalInstanceResponse)
def execute_approval_action(
    invoice_id: str,
    req: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    instance = workflow_engine.process_action(
        db=db,
        invoice=invoice,
        user=current_user,
        action=req.action,
        comments=req.comments
    )
    log_audit(db, action=f"APPROVAL_{req.action.upper()}", entity_name="Invoice", entity_id=invoice.id, user_id=current_user.id, details={"comments": req.comments, "new_status": invoice.status})
    return instance

@router.get("/matrix", response_model=List[ApprovalWorkflowResponse])
def get_workflow_matrix(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ApprovalWorkflow).all()

@router.post("/matrix/rules", response_model=ApprovalWorkflowResponse)
def add_workflow_rule(
    rule_in: WorkflowRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    workflow = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.is_active == True).first()
    if not workflow:
        workflow = ApprovalWorkflow(name="Default Enterprise AP Workflow", description="Standard Multi-Tier Approval Matrix", is_active=True)
        db.add(workflow)
        db.flush()

    new_rule = ApprovalRule(
        workflow_id=workflow.id,
        rule_name=rule_in.rule_name,
        min_amount=rule_in.min_amount,
        max_amount=rule_in.max_amount,
        department=rule_in.department,
        step_order=rule_in.step_order,
        required_role=rule_in.required_role,
        approver_id=rule_in.approver_id,
        is_parallel=rule_in.is_parallel
    )
    db.add(new_rule)
    db.commit()
    db.refresh(workflow)
    log_audit(db, action="CREATE_WORKFLOW_RULE", entity_name="ApprovalRule", entity_id=new_rule.id, user_id=current_user.id, details={"rule_name": new_rule.rule_name})
    return workflow
