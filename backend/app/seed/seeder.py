from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

from backend.app.core.security import get_password_hash
from backend.app.models.auth import User, Role, Permission
from backend.app.models.vendor import Vendor, VendorBankAccount, VendorDocument
from backend.app.models.po_grn import PurchaseOrder, PurchaseOrderLineItem, GoodsReceipt, GoodsReceiptLineItem
from backend.app.models.invoice import (
    Invoice, InvoiceDocument, InvoiceLineItem,
    InvoiceExtraction, ExtractionFieldValue, InvoiceValidation, InvoiceException
)
from backend.app.models.matching import InvoicePOMatch
from backend.app.models.workflow import ApprovalWorkflow, ApprovalRule, ApprovalInstance, ApprovalStep, ApprovalAction
from backend.app.models.payment import PaymentBatch, PaymentRequest, PaymentTransaction, PaymentAdvice
from backend.app.models.system import IntegrationConfiguration, SystemSetting

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding initial database records...")

    # 1. Roles
    roles_data = [
        {"name": "admin", "display_name": "System Administrator", "desc": "Full administrative permissions"},
        {"name": "ap_manager", "display_name": "AP Manager", "desc": "Oversees invoices, validations, approvals, and reports"},
        {"name": "ap_executive", "display_name": "AP Executive / Maker", "desc": "Uploads invoices, reviews OCR, corrects data"},
        {"name": "approver", "display_name": "Department Approver", "desc": "Approves, rejects, or requests changes on invoices"},
        {"name": "finance_executive", "display_name": "Finance / Payment Executive", "desc": "Processes payments and payment advice"},
        {"name": "vendor", "display_name": "Vendor Portal User", "desc": "External vendor submission and status view"},
        {"name": "auditor", "display_name": "Financial Auditor", "desc": "Read-only access to records, reports, and audit logs"}
    ]
    roles_dict = {}
    for r in roles_data:
        role = Role(name=r["name"], display_name=r["display_name"], description=r["desc"])
        db.add(role)
        db.flush()
        roles_dict[r["name"]] = role

    # 2. Users (Password: Password@123)
    default_pw = get_password_hash("Password@123")
    users_data = [
        {"email": "admin@enterprise.com", "name": "Sarah Connor (Admin)", "roles": ["admin"], "dept": "Executive"},
        {"email": "manager@enterprise.com", "name": "Marcus Vance (AP Manager)", "roles": ["ap_manager"], "dept": "Finance"},
        {"email": "maker@enterprise.com", "name": "Elena Rostova (Invoice Maker)", "roles": ["ap_executive"], "dept": "Accounts Payable"},
        {"email": "approver@enterprise.com", "name": "David Sterling (Approver)", "roles": ["approver"], "dept": "Operations"},
        {"email": "finance@enterprise.com", "name": "Rachel Zane (Payment Exec)", "roles": ["finance_executive"], "dept": "Treasury"},
        {"email": "vendor@acme.com", "name": "Thomas Thorne (Vendor)", "roles": ["vendor"], "dept": "External"},
        {"email": "auditor@enterprise.com", "name": "Arthur Dent (Auditor)", "roles": ["auditor"], "dept": "Compliance"}
    ]
    users_dict = {}
    for u in users_data:
        user = User(
            email=u["email"],
            full_name=u["name"],
            hashed_password=default_pw,
            department=u["dept"],
            is_active=True
        )
        for r_name in u["roles"]:
            user.roles.append(roles_dict[r_name])
        db.add(user)
        db.flush()
        users_dict[u["email"]] = user

    # 3. Vendors
    v1 = Vendor(
        vendor_name="Acme Global Industrial Supplies",
        vendor_code="VEND-ACME-01",
        vendor_type="Standard",
        contact_person="Thomas Thorne",
        email="vendor@acme.com",
        phone="+1 (555) 234-5678",
        billing_address="100 Industrial Parkway, Chicago, IL 60601",
        shipping_address="100 Industrial Parkway, Chicago, IL 60601",
        gstin="27AABCT3518Q1ZV",
        pan="AABCT3518Q",
        currency="USD",
        payment_terms="Net 30",
        status="Active"
    )
    db.add(v1)
    db.flush()

    b1 = VendorBankAccount(
        vendor_id=v1.id,
        bank_name="JPMorgan Chase Commercial",
        account_number_encrypted="ENC_987654321012",
        account_number_masked="XXXX-XXXX-1012",
        ifsc_code="CHASUS33XXX",
        is_primary=True,
        is_verified=True
    )
    db.add(b1)

    v2 = Vendor(
        vendor_name="Apex Technologies Inc",
        vendor_code="VEND-APEX-02",
        vendor_type="Critical",
        contact_person="Clara Oswald",
        email="billing@apextech.io",
        phone="+1 (555) 987-6543",
        billing_address="500 Tech Boulevard, Austin, TX 78701",
        shipping_address="500 Tech Boulevard, Austin, TX 78701",
        gstin="29AAACA2100P1ZT",
        pan="AAACA2100P",
        currency="USD",
        payment_terms="Net 15",
        status="Active"
    )
    db.add(v2)
    db.flush()

    v3 = Vendor(
        vendor_name="Delta Logistics & Freight Ltd",
        vendor_code="VEND-DELTA-03",
        vendor_type="Service",
        contact_person="Jack Harkness",
        email="support@deltalogistics.com",
        phone="+1 (555) 345-6789",
        billing_address="742 Evergreen Terrace, Seattle, WA 98101",
        shipping_address="742 Evergreen Terrace, Seattle, WA 98101",
        gstin="06AABCD1234M1Z2",
        pan="AABCD1234M",
        currency="USD",
        payment_terms="Net 30",
        status="Inactive"  # Test inactive vendor validation
    )
    db.add(v3)
    db.flush()

    # 4. Purchase Orders & Goods Receipts
    po1 = PurchaseOrder(
        po_number="PO-2026-8801",
        vendor_id=v1.id,
        po_date=date.today() - timedelta(days=20),
        currency="USD",
        payment_terms="Net 30",
        status="Partially Received",
        total_amount=Decimal("12500.00"),
        tax_amount=Decimal("1906.78")
    )
    db.add(po1)
    db.flush()

    po1_item = PurchaseOrderLineItem(
        po_id=po1.id,
        line_number=1,
        item_description="Precision Industrial Valve Unit",
        material_code="MAT-VALVE-01",
        quantity=Decimal("10.0000"),
        received_quantity=Decimal("10.0000"),
        invoiced_quantity=Decimal("10.0000"),
        uom="EA",
        unit_price=Decimal("1059.32"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("1906.78"),
        line_total=Decimal("12500.00")
    )
    db.add(po1_item)
    db.flush()

    grn1 = GoodsReceipt(
        grn_number="GRN-2026-0042",
        po_id=po1.id,
        receipt_date=date.today() - timedelta(days=15),
        received_by="Warehouse Team Leader",
        status="Verified",
        notes="All 10 valves inspected and accepted."
    )
    db.add(grn1)
    db.flush()

    grn1_item = GoodsReceiptLineItem(
        grn_id=grn1.id,
        po_line_item_id=po1_item.id,
        item_description="Precision Industrial Valve Unit",
        material_code="MAT-VALVE-01",
        received_quantity=Decimal("10.0000"),
        accepted_quantity=Decimal("10.0000"),
        rejected_quantity=Decimal("0.0000"),
        uom="EA"
    )
    db.add(grn1_item)

    po2 = PurchaseOrder(
        po_number="PO-2026-9905",
        vendor_id=v2.id,
        po_date=date.today() - timedelta(days=10),
        currency="USD",
        payment_terms="Net 15",
        status="Open",
        total_amount=Decimal("4800.00"),
        tax_amount=Decimal("732.20")
    )
    db.add(po2)
    db.flush()

    po2_item = PurchaseOrderLineItem(
        po_id=po2.id,
        line_number=1,
        item_description="Cloud Compute Rack Module",
        material_code="MOD-COMPUTE-99",
        quantity=Decimal("4.0000"),
        received_quantity=Decimal("4.0000"),
        invoiced_quantity=Decimal("0.0000"),
        uom="EA",
        unit_price=Decimal("1016.95"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("732.20"),
        line_total=Decimal("4800.00")
    )
    db.add(po2_item)

    # 5. Approval Workflow Matrix
    wf = ApprovalWorkflow(
        name="Enterprise Multi-Tier Approval Matrix",
        description="Standard rules for general procurement and expenses",
        is_active=True
    )
    db.add(wf)
    db.flush()

    rules = [
        ApprovalRule(workflow_id=wf.id, rule_name="Tier 1 AP Manager Review", min_amount=Decimal("0.00"), max_amount=Decimal("5000.00"), step_order=1, required_role="ap_manager"),
        ApprovalRule(workflow_id=wf.id, rule_name="Tier 2 Department Head Approval", min_amount=Decimal("5000.01"), max_amount=Decimal("50000.00"), step_order=2, required_role="approver"),
        ApprovalRule(workflow_id=wf.id, rule_name="Tier 3 Executive / CFO Approval", min_amount=Decimal("50000.01"), max_amount=None, step_order=3, required_role="admin")
    ]
    db.add_all(rules)

    # 6. Sample Invoices Covering Lifecycle & Test Criteria
    # Invoice 1: Matched, Approved & Ready for Payment
    inv1 = Invoice(
        invoice_number="INV-2026-1001",
        vendor_id=v1.id,
        vendor_name_raw=v1.vendor_name,
        vendor_gstin=v1.gstin,
        invoice_date=date.today() - timedelta(days=12),
        due_date=date.today() + timedelta(days=18),
        po_number="PO-2026-8801",
        payment_terms="Net 30",
        currency="USD",
        subtotal=Decimal("10593.22"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("10593.22"),
        cgst_amount=Decimal("953.39"),
        sgst_amount=Decimal("953.39"),
        igst_amount=Decimal("0.00"),
        total_tax_amount=Decimal("1906.78"),
        round_off_amount=Decimal("0.00"),
        total_amount=Decimal("12500.00"),
        amount_payable=Decimal("12500.00"),
        amount_paid=Decimal("0.00"),
        bank_account_number="987654321012",
        bank_ifsc="CHASUS33XXX",
        bank_name="JPMorgan Chase",
        status="Ready_For_Payment",
        source="Manual_Upload",
        uploader_id=users_dict["maker@enterprise.com"].id,
        department="Operations"
    )
    db.add(inv1)
    db.flush()

    inv1_line = InvoiceLineItem(
        invoice_id=inv1.id,
        line_number=1,
        item_description="Precision Industrial Valve Unit",
        material_code="MAT-VALVE-01",
        quantity=Decimal("10.0000"),
        uom="EA",
        unit_price=Decimal("1059.32"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("1906.78"),
        line_total=Decimal("12500.00"),
        po_line_reference=1
    )
    db.add(inv1_line)

    inv1_match = InvoicePOMatch(
        invoice_id=inv1.id,
        po_id=po1.id,
        grn_id=grn1.id,
        match_type="Three_Way",
        match_status="Matched",
        header_variance_amount=Decimal("0.00"),
        price_variance_pct=0.0,
        quantity_variance=0.0,
        is_resolved=True
    )
    db.add(inv1_match)

    # Invoice 2: Pending Approval
    inv2 = Invoice(
        invoice_number="INV-2026-2005",
        vendor_id=v2.id,
        vendor_name_raw=v2.vendor_name,
        vendor_gstin=v2.gstin,
        invoice_date=date.today() - timedelta(days=3),
        due_date=date.today() + timedelta(days=12),
        po_number="PO-2026-9905",
        payment_terms="Net 15",
        currency="USD",
        subtotal=Decimal("4067.80"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("4067.80"),
        cgst_amount=Decimal("366.10"),
        sgst_amount=Decimal("366.10"),
        igst_amount=Decimal("0.00"),
        total_tax_amount=Decimal("732.20"),
        round_off_amount=Decimal("0.00"),
        total_amount=Decimal("4800.00"),
        amount_payable=Decimal("4800.00"),
        amount_paid=Decimal("0.00"),
        bank_account_number="456789012345",
        bank_ifsc="HDFC0001234",
        status="Approval_Pending",
        source="Manual_Upload",
        uploader_id=users_dict["maker@enterprise.com"].id,
        department="Finance"
    )
    db.add(inv2)
    db.flush()

    inv2_inst = ApprovalInstance(
        invoice_id=inv2.id,
        workflow_id=wf.id,
        status="Pending",
        current_step_order=1,
        started_at=datetime.now(timezone.utc)
    )
    db.add(inv2_inst)
    db.flush()

    inv2_step = ApprovalStep(
        instance_id=inv2_inst.id,
        step_order=1,
        step_name="Tier 1 AP Manager Review",
        assigned_role="ap_manager",
        status="Pending",
        due_date=datetime.now(timezone.utc) + timedelta(days=2)
    )
    db.add(inv2_step)

    # Invoice 3: Paid with Payment Transaction and Advice
    inv3 = Invoice(
        invoice_number="INV-2026-3001",
        vendor_id=v1.id,
        vendor_name_raw=v1.vendor_name,
        vendor_gstin=v1.gstin,
        invoice_date=date.today() - timedelta(days=35),
        due_date=date.today() - timedelta(days=5),
        po_number="PO-2026-8801",
        payment_terms="Net 30",
        currency="USD",
        subtotal=Decimal("5000.00"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("5000.00"),
        cgst_amount=Decimal("450.00"),
        sgst_amount=Decimal("450.00"),
        igst_amount=Decimal("0.00"),
        total_tax_amount=Decimal("900.00"),
        round_off_amount=Decimal("0.00"),
        total_amount=Decimal("5900.00"),
        amount_payable=Decimal("5900.00"),
        amount_paid=Decimal("5900.00"),
        status="Paid",
        source="Manual_Upload",
        uploader_id=users_dict["maker@enterprise.com"].id,
        department="Operations"
    )
    db.add(inv3)
    db.flush()

    pay_req = PaymentRequest(
        request_number="PAY-20261025-001",
        invoice_id=inv3.id,
        requested_amount=Decimal("5900.00"),
        currency="USD",
        status="Paid",
        payment_method="NEFT/RTGS",
        requested_by_id=users_dict["finance@enterprise.com"].id,
        requested_at=datetime.now(timezone.utc) - timedelta(days=4)
    )
    db.add(pay_req)
    db.flush()

    txn = PaymentTransaction(
        payment_request_id=pay_req.id,
        transaction_reference="TXN-20261025-ABCD99",
        bank_reference_number="UTR20261025987654",
        amount_paid=Decimal("5900.00"),
        currency="USD",
        payment_date=date.today() - timedelta(days=4),
        status="Success"
    )
    db.add(txn)

    adv = PaymentAdvice(
        advice_number="ADV-20261025-001",
        payment_request_id=pay_req.id,
        vendor_id=v1.id,
        total_gross_amount=Decimal("5900.00"),
        tax_deducted_tds=Decimal("118.00"),
        other_deductions=Decimal("0.00"),
        net_paid_amount=Decimal("5782.00"),
        payment_date=date.today() - timedelta(days=4),
        bank_ref_no="UTR20261025987654"
    )
    db.add(adv)

    # 7. Integrations setup
    integrations = [
        IntegrationConfiguration(system_name="SAP_ERP", system_type="ERP", endpoint_url="https://sap-gateway.internal.corp/api/v2", is_enabled=True, connection_status="Connected"),
        IntegrationConfiguration(system_name="QuickBooks", system_type="Accounting", endpoint_url="https://quickbooks.api.intuit.com/v3", is_enabled=True, connection_status="Connected"),
        IntegrationConfiguration(system_name="Mock_Banking", system_type="Banking", endpoint_url="https://api.corporate-banking.net/payments/v1", is_enabled=True, connection_status="Connected"),
        IntegrationConfiguration(system_name="Email_Connector", system_type="Email", endpoint_url="imap://invoices.internal.corp:993", is_enabled=True, connection_status="Connected")
    ]
    db.add_all(integrations)

    db.commit()
    print("Seeding completed successfully!")
