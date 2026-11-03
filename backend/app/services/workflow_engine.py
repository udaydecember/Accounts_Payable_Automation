from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.auth import User
from backend.app.models.invoice import Invoice
from backend.app.models.workflow import ApprovalWorkflow, ApprovalRule, ApprovalInstance, ApprovalStep, ApprovalAction
from backend.app.models.system import Notification

class WorkflowEngine:
    def __init__(self):
        pass

    def initiate_workflow(self, db: Session, invoice: Invoice) -> ApprovalInstance:
        # Pre-condition: Check if invoice has unresolved critical exceptions
        from backend.app.models.invoice import InvoiceException
        unresolved_critical = db.query(InvoiceException).filter(
            InvoiceException.invoice_id == invoice.id,
            InvoiceException.severity == 'Critical',
            InvoiceException.is_resolved == False
        ).count()
        if unresolved_critical > 0:
            raise HTTPException(
                status_code=400,
                detail=f'Cannot route invoice for approval: {unresolved_critical} unresolved critical exception(s) exist.'
            )

        # Clear existing workflow instance if restarting
        existing_inst = db.query(ApprovalInstance).filter(ApprovalInstance.invoice_id == invoice.id).first()
        if existing_inst:
            db.delete(existing_inst)
            db.commit()

        # Find active workflow
        workflow = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.is_active == True).first()
        if not workflow:
            # Default system fallback rule if no custom matrix configured
            rules = [
                ApprovalRule(rule_name='Tier 1 AP Manager Approval', min_amount=Decimal('0.00'), max_amount=Decimal('5000.00'), step_order=1, required_role='ap_manager'),
                ApprovalRule(rule_name='Tier 2 Department Head Approval', min_amount=Decimal('5000.01'), max_amount=Decimal('50000.00'), step_order=2, required_role='approver'),
                ApprovalRule(rule_name='Tier 3 Executive / CFO Approval', min_amount=Decimal('50000.01'), max_amount=None, step_order=3, required_role='admin')
            ]
        else:
            rules = db.query(ApprovalRule).filter(ApprovalRule.workflow_id == workflow.id).order_by(ApprovalRule.step_order.asc()).all()

        # Filter applicable rules based on invoice amount and department
        applicable_rules = []
        for rule in rules:
            min_amt = rule.min_amount or Decimal('0.00')
            max_amt = rule.max_amount or Decimal('999999999.00')
            dept_match = (not rule.department or rule.department.lower() == invoice.department.lower())
            if min_amt <= invoice.total_amount and dept_match:
                applicable_rules.append(rule)

        if not applicable_rules:
            # Fallback to AP Manager rule
            applicable_rules = [ApprovalRule(rule_name='Standard AP Manager Approval', step_order=1, required_role='ap_manager')]

        instance = ApprovalInstance(
            invoice_id=invoice.id,
            workflow_id=workflow.id if workflow else None,
            status='Pending',
            current_step_order=1,
            started_at=datetime.now(timezone.utc)
        )
        db.add(instance)
        db.flush()

        # Create approval steps
        for idx, rule in enumerate(applicable_rules, start=1):
            step = ApprovalStep(
                instance_id=instance.id,
                step_order=idx,
                step_name=rule.rule_name,
                assigned_role=rule.required_role,
                assigned_user_id=rule.approver_id,
                status='Pending' if idx == 1 else 'Waiting',
                due_date=datetime.now(timezone.utc) + timedelta(days=2)
            )
            db.add(step)

        invoice.status = 'Approval_Pending'
        db.commit()
        db.refresh(instance)

        # Notify assigned role users
        self._notify_pending_approvers(db, invoice, applicable_rules[0].required_role)
        return instance

    def process_action(
        self,
        db: Session,
        invoice: Invoice,
        user: User,
        action: str,  # Approve, Reject, Request_Changes, Reassign
        comments: Optional[str] = None
    ) -> ApprovalInstance:
        # 1. Maker-Checker Enforcement
        if invoice.uploader_id == user.id and action == 'Approve':
            raise HTTPException(
                status_code=403,
                detail='Maker-Checker Violation: You are the creator/uploader of this invoice and cannot approve it.'
            )

        instance = db.query(ApprovalInstance).filter(ApprovalInstance.invoice_id == invoice.id).first()
        if not instance or instance.status != 'Pending':
            raise HTTPException(status_code=400, detail='No active pending approval instance found for this invoice.')

        # Find current active step
        current_step = db.query(ApprovalStep).filter(
            ApprovalStep.instance_id == instance.id,
            ApprovalStep.step_order == instance.current_step_order,
            ApprovalStep.status == 'Pending'
        ).first()

        if not current_step:
            raise HTTPException(status_code=400, detail='No active approval step available to act upon.')

        # Verify user has required role or is explicitly assigned
        user_roles = [r.name for r in user.roles]
        has_permission = ('admin' in user_roles or current_step.assigned_role in user_roles or current_step.assigned_user_id == user.id)
        if not has_permission:
            raise HTTPException(
                status_code=403,
                detail=f'Permission denied: Step requires role \"{current_step.assigned_role}\".'
            )

        # Record action
        approval_action = ApprovalAction(
            step_id=current_step.id,
            user_id=user.id,
            action=action,
            comments=comments
        )
        db.add(approval_action)

        if action == 'Approve':
            current_step.status = 'Approved'
            current_step.completed_at = datetime.now(timezone.utc)

            # Check for next step
            next_step = db.query(ApprovalStep).filter(
                ApprovalStep.instance_id == instance.id,
                ApprovalStep.step_order == instance.current_step_order + 1
            ).first()

            if next_step:
                instance.current_step_order += 1
                next_step.status = 'Pending'
                self._notify_pending_approvers(db, invoice, next_step.assigned_role)
            else:
                # All steps approved!
                instance.status = 'Approved'
                instance.completed_at = datetime.now(timezone.utc)
                invoice.status = 'Ready_For_Payment'  # Unlocks invoice for payment!

        elif action == 'Reject':
            current_step.status = 'Rejected'
            current_step.completed_at = datetime.now(timezone.utc)
            instance.status = 'Rejected'
            instance.completed_at = datetime.now(timezone.utc)
            invoice.status = 'Rejected'

        elif action == 'Request_Changes':
            current_step.status = 'Changes_Requested'
            instance.status = 'Changes_Requested'
            invoice.status = 'Draft'  # Route back to Maker for review/correction

        db.commit()
        db.refresh(instance)
        return instance

    def _notify_pending_approvers(self, db: Session, invoice: Invoice, required_role: str):
        users_with_role = db.query(User).filter(User.roles.any(name=required_role), User.is_active == True).all()
        for u in users_with_role:
            if u.id != invoice.uploader_id:  # Do not notify maker
                notif = Notification(
                    user_id=u.id,
                    title=f'Approval Required: Invoice #{invoice.invoice_number}',
                    message=f'Invoice #{invoice.invoice_number} from {invoice.vendor_name_raw} for {invoice.currency} {invoice.total_amount} requires your approval.',
                    link_url=f'/invoices/{invoice.id}'
                )
                db.add(notif)
        db.commit()

workflow_engine = WorkflowEngine()
