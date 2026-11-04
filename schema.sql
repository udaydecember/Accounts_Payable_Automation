-- ============================================================================
-- DATABASE SCHEMA: Accounts Payable (AP) Automation with OCR & AI Matching
-- Target RDBMS : PostgreSQL 13+
-- Backend Framework Compatibility: Django 4.x / 5.x ORM
-- Recommended Database Name: shout_ap_recruitment_db
-- ============================================================================

-- Create Database (Run separately if executing manually)
-- CREATE DATABASE shout_ap_recruitment_db WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Finance',
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    date_joined TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ============================================================================
-- 2. VENDOR MASTER & BANKING DETAILS
-- ============================================================================

CREATE TABLE vendors (
    id BIGSERIAL PRIMARY KEY,
    vendor_code VARCHAR(50) NOT NULL UNIQUE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL DEFAULT 'Standard' 
        CHECK (vendor_type IN ('Standard', 'Critical', 'Sole_Source', 'Service', 'Contractor')),
    contact_person VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    gstin VARCHAR(15) UNIQUE,
    pan VARCHAR(10) UNIQUE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_terms VARCHAR(50) NOT NULL DEFAULT 'Net 30' 
        CHECK (payment_terms IN ('Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due within 14 days')),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' 
        CHECK (status IN ('Active', 'Inactive', 'Blocked', 'Pending_Approval')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    account_number_masked VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_gstin ON vendors(gstin);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendor_banks_vendor ON vendor_bank_accounts(vendor_id);

-- ============================================================================
-- 3. PURCHASE ORDERS & GOODS RECEIPT NOTES (GRN)
-- ============================================================================

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_terms VARCHAR(50) NOT NULL DEFAULT 'Net 30',
    status VARCHAR(50) NOT NULL DEFAULT 'Open' 
        CHECK (status IN ('Draft', 'Open', 'Partially_Received', 'Fully_Received', 'Closed', 'Cancelled')),
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_lines (
    id BIGSERIAL PRIMARY KEY,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    material_code VARCHAR(100),
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (received_quantity >= 0),
    invoiced_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (invoiced_quantity >= 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
    CONSTRAINT uq_po_line UNIQUE (po_id, line_number)
);

CREATE TABLE goods_receipts (
    id BIGSERIAL PRIMARY KEY,
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Verified' 
        CHECK (status IN ('Pending_Inspection', 'Verified', 'Partially_Accepted', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goods_receipt_lines (
    id BIGSERIAL PRIMARY KEY,
    grn_id BIGINT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_line_id BIGINT REFERENCES purchase_order_lines(id) ON DELETE SET NULL,
    item_description VARCHAR(255) NOT NULL,
    material_code VARCHAR(100),
    received_quantity NUMERIC(15, 4) NOT NULL CHECK (received_quantity >= 0),
    accepted_quantity NUMERIC(15, 4) NOT NULL CHECK (accepted_quantity >= 0),
    rejected_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000 CHECK (rejected_quantity >= 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'EA'
);

CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_lines_po ON purchase_order_lines(po_id);
CREATE INDEX idx_grn_number ON goods_receipts(grn_number);
CREATE INDEX idx_grn_po ON goods_receipts(po_id);
CREATE INDEX idx_grn_lines_grn ON goods_receipt_lines(grn_id);

-- ============================================================================
-- 4. INVOICES, LINE ITEMS & ATTACHMENTS
-- ============================================================================

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name_raw VARCHAR(200),
    vendor_gstin VARCHAR(20),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    po_number VARCHAR(100),
    payment_terms VARCHAR(50) NOT NULL DEFAULT 'Net 30',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    billing_address TEXT,
    shipping_address TEXT,
    
    -- Financial Totals (Numeric precision for Indian & Global currency)
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cgst_amount >= 0),
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sgst_amount >= 0),
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (igst_amount >= 0),
    total_tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_tax_amount >= 0),
    round_off_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_payable NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_payable >= 0),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),

    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(50),
    bank_name VARCHAR(100),

    -- AP Lifecycle Status
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN (
            'Draft', 'Awaiting_OCR', 'OCR_Completed', 'Validation_Passed', 'Validation_Failed',
            'Matching_Passed', 'Matching_Failed', 'Approval_Pending', 'Approved', 'Rejected',
            'Payment_Pending', 'Partially_Paid', 'Paid', 'Cancelled'
        )),
    source VARCHAR(50) NOT NULL DEFAULT 'Manual_Upload' 
        CHECK (source IN ('Manual_Upload', 'Bulk_Upload', 'Email_Connector', 'Vendor_Portal', 'API')),
    
    uploader_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Finance',
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_vendor_invoice_number UNIQUE (vendor_id, invoice_number)
);

CREATE TABLE invoice_line_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    po_line_id BIGINT REFERENCES purchase_order_lines(id) ON DELETE SET NULL,
    line_number INT NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    material_code VARCHAR(100),
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'EA',
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
    po_line_reference INT,
    CONSTRAINT uq_inv_line UNIQUE (invoice_id, line_number)
);

CREATE TABLE invoice_documents (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash_sha256 VARCHAR(64) NOT NULL,
    page_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_po ON invoices(po_number);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created ON invoices(created_at);
CREATE INDEX idx_invoice_lines_inv ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_docs_inv ON invoice_documents(invoice_id);
CREATE INDEX idx_invoice_docs_hash ON invoice_documents(file_hash_sha256);

-- ============================================================================
-- 5. OCR & AI STRUCTURED DOCUMENT EXTRACTION
-- ============================================================================

CREATE TABLE invoice_extractions (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL DEFAULT 'Hybrid-OCR-Parser-v1',
    ocr_engine VARCHAR(50) NOT NULL DEFAULT 'Tesseract+Regex',
    extraction_status VARCHAR(50) NOT NULL DEFAULT 'Completed' 
        CHECK (extraction_status IN ('Pending', 'Processing', 'Completed', 'Failed')),
    raw_text TEXT,
    overall_confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.9500 CHECK (overall_confidence BETWEEN 0 AND 1),
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extraction_field_values (
    id BIGSERIAL PRIMARY KEY,
    extraction_id BIGINT NOT NULL REFERENCES invoice_extractions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    original_value TEXT,
    corrected_value TEXT,
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 1.0000 CHECK (confidence_score BETWEEN 0 AND 1),
    bounding_box VARCHAR(255),
    page_number INT NOT NULL DEFAULT 1,
    is_corrected BOOLEAN NOT NULL DEFAULT FALSE,
    corrected_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    corrected_at TIMESTAMPTZ,
    CONSTRAINT uq_extraction_field UNIQUE (extraction_id, field_name)
);

CREATE INDEX idx_extractions_inv ON invoice_extractions(invoice_id);
CREATE INDEX idx_extraction_fields_ext ON extraction_field_values(extraction_id);

-- ============================================================================
-- 6. INVOICE VALIDATION & EXCEPTION MANAGEMENT
-- ============================================================================

CREATE TABLE invoice_validations (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'Passed' 
        CHECK (validation_status IN ('Passed', 'Failed', 'Warnings')),
    passed_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    warning_count INT NOT NULL DEFAULT 0,
    validated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_exceptions (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    rule_code VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Critical' 
        CHECK (severity IN ('Warning', 'Critical', 'Fatal')),
    message TEXT NOT NULL,
    suggested_action TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_comments TEXT,
    resolved_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validations_inv ON invoice_validations(invoice_id);
CREATE INDEX idx_exceptions_inv ON invoice_exceptions(invoice_id);
CREATE INDEX idx_exceptions_resolved ON invoice_exceptions(is_resolved);

-- ============================================================================
-- 7. TWO-WAY & THREE-WAY PO & GRN MATCHING ENGINE
-- ============================================================================

CREATE TABLE invoice_po_matches (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    po_id BIGINT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    grn_id BIGINT REFERENCES goods_receipts(id) ON DELETE SET NULL,
    match_type VARCHAR(20) NOT NULL DEFAULT 'Three_Way' 
        CHECK (match_type IN ('Two_Way', 'Three_Way')),
    match_status VARCHAR(30) NOT NULL DEFAULT 'Mismatched' 
        CHECK (match_status IN ('Matched', 'Mismatched', 'Missing_PO', 'Price_Tolerance_Exceeded', 'Quantity_Tolerance_Exceeded')),
    header_variance_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    price_variance_pct NUMERIC(8, 4) NOT NULL DEFAULT 0.0000,
    quantity_variance NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    discrepancy_details JSONB,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_inv ON invoice_po_matches(invoice_id);
CREATE INDEX idx_matches_po ON invoice_po_matches(po_id);
CREATE INDEX idx_matches_status ON invoice_po_matches(match_status);

-- ============================================================================
-- 8. APPROVAL WORKFLOW MATRIX & MAKER-CHECKER HIERARCHY
-- ============================================================================

CREATE TABLE approval_matrices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL DEFAULT 'All',
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(15, 2) NOT NULL,
    required_role VARCHAR(50) NOT NULL,
    step_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_instances (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    current_step INT NOT NULL DEFAULT 1,
    total_steps INT NOT NULL DEFAULT 1,
    initiated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE approval_steps (
    id BIGSERIAL PRIMARY KEY,
    instance_id BIGINT NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    role_required VARCHAR(50) NOT NULL,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Skipped')),
    action_taken_at TIMESTAMPTZ,
    CONSTRAINT uq_instance_step UNIQUE (instance_id, step_number)
);

CREATE TABLE approval_actions (
    id BIGSERIAL PRIMARY KEY,
    step_id BIGINT NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
    approver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL CHECK (action IN ('Approved', 'Rejected', 'Reassigned', 'Delegated')),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appr_inst_inv ON approval_instances(invoice_id);
CREATE INDEX idx_appr_inst_status ON approval_instances(status);
CREATE INDEX idx_appr_steps_inst ON approval_steps(instance_id);
CREATE INDEX idx_appr_actions_step ON approval_actions(step_id);

-- ============================================================================
-- 9. PAYMENT BATCHES, SETTLEMENT & PAYMENT ADVICE
-- ============================================================================

CREATE TABLE payment_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    total_invoices INT NOT NULL DEFAULT 0 CHECK (total_invoices >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'NEFT_RTGS' 
        CHECK (payment_method IN ('NEFT_RTGS', 'ACH', 'Wire_Transfer', 'Virtual_Card', 'Corporate_Cheque')),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN ('Draft', 'Processing', 'Completed', 'Failed', 'Cancelled')),
    processed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE TABLE payment_requests (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    batch_id BIGINT REFERENCES payment_batches(id) ON DELETE SET NULL,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bank_account_id BIGINT REFERENCES vendor_bank_accounts(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'In_Batch', 'Processing', 'Paid', 'Failed')),
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMPTZ
);

CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    payment_request_id BIGINT NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    gateway_name VARCHAR(100) NOT NULL DEFAULT 'HDFC_Corporate_Banking',
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Success' 
        CHECK (status IN ('Initiated', 'Success', 'Failed', 'Reversed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_advices (
    id BIGSERIAL PRIMARY KEY,
    payment_request_id BIGINT NOT NULL UNIQUE REFERENCES payment_requests(id) ON DELETE CASCADE,
    advice_number VARCHAR(100) NOT NULL UNIQUE,
    pdf_path VARCHAR(500),
    sent_to_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_batches_num ON payment_batches(batch_number);
CREATE INDEX idx_payment_reqs_inv ON payment_requests(invoice_id);
CREATE INDEX idx_payment_reqs_batch ON payment_requests(batch_id);
CREATE INDEX idx_payment_reqs_status ON payment_requests(status);
CREATE INDEX idx_payment_txs_req ON payment_transactions(payment_request_id);

-- ============================================================================
-- 10. AUDIT LOG & COMPLIANCE GOVERNANCE
-- ============================================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- SAMPLE DATA (DUMMY INSERT STATEMENTS)
-- ============================================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access to settings and user roles'),
('ap_manager', 'Accounts Payable Manager with exception overrides and batch release'),
('ap_executive', 'AP Maker responsible for document capture, OCR correction, and validation'),
('approver', 'Department Head with invoice spending authorization'),
('finance', 'Treasury & Payment Specialist executing bank settlements'),
('auditor', 'Read-only financial and compliance compliance auditor');

-- Users
INSERT INTO users (email, password_hash, first_name, last_name, department, is_active, is_staff, is_superuser) VALUES
('admin@shout.internal', 'pbkdf2_sha256$600000$dummyhash$adminpassword123', 'Sarah', 'Connor', 'Executive', TRUE, TRUE, TRUE),
('manager@shout.internal', 'pbkdf2_sha256$600000$dummyhash$managerpassword123', 'Marcus', 'Vance', 'Finance', TRUE, TRUE, FALSE),
('maker@shout.internal', 'pbkdf2_sha256$600000$dummyhash$makerpassword123', 'Elena', 'Rostova', 'Accounts_Payable', TRUE, FALSE, FALSE),
('approver@shout.internal', 'pbkdf2_sha256$600000$dummyhash$approverpassword123', 'David', 'Sterling', 'Operations', TRUE, FALSE, FALSE);

-- User Role Assignments
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Vendors
INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, billing_address, gstin, pan, currency, payment_terms, status) VALUES
('VEND-ABC-01', 'ABC Furniture Suppliers', 'Standard', 'Rajesh Kumar', 'orders@abcfurniture.in', '+91 80 2345 6789', '12 Market Road, Bengaluru, Karnataka 560001', '29ABCDE1234F1Z5', 'ABCDE1234F', 'INR', 'Due within 14 days', 'Active'),
('VEND-ACME-02', 'Acme Global Industrial Supplies', 'Critical', 'Anita Desai', 'billing@acmeglobal.in', '+91 22 8765 4321', '100 Industrial Area, Mumbai, Maharashtra 400001', '27AABCT3518Q1ZV', 'AABCT3518Q', 'INR', 'Net 30', 'Active');

-- Vendor Bank Accounts
INSERT INTO vendor_bank_accounts (vendor_id, bank_name, account_number_encrypted, account_number_masked, ifsc_code, branch_name, is_primary, is_verified) VALUES
(1, 'State Bank of India', 'ENC_SBI_98765432101', 'XXXX-XXXX-1011', 'SBIN0001234', 'MG Road Bengaluru', TRUE, TRUE),
(2, 'HDFC Bank', 'ENC_HDFC_12345678902', 'XXXX-XXXX-9022', 'HDFC0000567', 'Nariman Point Mumbai', TRUE, TRUE);

-- Purchase Orders
INSERT INTO purchase_orders (po_number, vendor_id, po_date, delivery_date, currency, payment_terms, status, subtotal_amount, tax_amount, total_amount) VALUES
('PO-1001', 1, '2026-11-01', '2026-11-10', 'INR', 'Due within 14 days', 'Fully_Received', 10000.00, 1800.00, 11800.00),
('PO-2026-8801', 2, '2026-10-25', '2026-11-05', 'INR', 'Net 30', 'Partially_Received', 10593.22, 1906.78, 12500.00);

-- Purchase Order Lines
INSERT INTO purchase_order_lines (po_id, line_number, item_description, material_code, quantity, received_quantity, invoiced_quantity, uom, unit_price, tax_rate, tax_amount, line_total) VALUES
(1, 1, 'Office Furniture (sample item)', 'MAT-FURN-01', 1.0000, 1.0000, 1.0000, 'EA', 10000.00, 18.00, 1800.00, 10000.00),
(2, 1, 'Precision Industrial Valve Unit', 'MAT-VALVE-01', 10.0000, 10.0000, 0.0000, 'EA', 1059.32, 18.00, 1906.78, 10593.22);

-- Goods Receipts (GRN)
INSERT INTO goods_receipts (grn_number, po_id, receipt_date, received_by, status, notes) VALUES
('GRN-1001', 1, '2026-11-02', 'Warehouse Supervisor', 'Verified', 'All office furniture items inspected and verified with zero defects.'),
('GRN-2026-0042', 2, '2026-10-30', 'QA Inspector', 'Verified', '10 precision valve units received in good order.');

-- Goods Receipt Lines
INSERT INTO goods_receipt_lines (grn_id, po_line_id, item_description, material_code, received_quantity, accepted_quantity, rejected_quantity, uom) VALUES
(1, 1, 'Office Furniture (sample item)', 'MAT-FURN-01', 1.0000, 1.0000, 0.0000, 'EA'),
(2, 2, 'Precision Industrial Valve Unit', 'MAT-VALVE-01', 10.0000, 10.0000, 0.0000, 'EA');

-- Invoices
INSERT INTO invoices (
    invoice_number, vendor_id, vendor_name_raw, vendor_gstin, invoice_date, due_date, po_number,
    payment_terms, currency, subtotal, taxable_amount, cgst_amount, sgst_amount, igst_amount,
    total_tax_amount, total_amount, amount_payable, amount_paid, status, source, uploader_id, department
) VALUES (
    'ABC-2026-TEST-001', 1, 'ABC Furniture Suppliers', '29ABCDE1234F1Z5', '2026-11-03', '2026-11-17', 'PO-1001',
    'Due within 14 days', 'INR', 10000.00, 10000.00, 900.00, 900.00, 0.00,
    1800.00, 11800.00, 11800.00, 0.00, 'Matching_Passed', 'Manual_Upload', 3, 'Finance'
);

-- Invoice Line Items
INSERT INTO invoice_line_items (
    invoice_id, po_line_id, line_number, item_description, material_code, quantity, uom,
    unit_price, tax_rate, tax_amount, line_total, po_line_reference
) VALUES (
    1, 1, 1, 'Office Furniture (sample item)', 'MAT-FURN-01', 1.0000, 'EA',
    10000.00, 18.00, 1800.00, 10000.00, 1
);

-- Invoice Document Attachment
INSERT INTO invoice_documents (
    invoice_id, file_name, original_file_name, file_path, file_size, mime_type, file_hash_sha256, page_count
) VALUES (
    1, 'sample_invoice_for_matching.pdf', 'sample_invoice_for_matching.pdf',
    '/uploads/invoices/2026/11/sample_invoice_for_matching.pdf', 27940, 'application/pdf',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1
);

-- OCR Extraction Record
INSERT INTO invoice_extractions (
    invoice_id, model_name, ocr_engine, extraction_status, raw_text, overall_confidence
) VALUES (
    1, 'Hybrid-OCR-v1', 'Tesseract+Regex', 'Completed',
    'TAX INVOICE\nABC Furniture Suppliers\nGSTIN: 29ABCDE1234F1Z5\nInvoice Number: ABC-2026-TEST-001\nPO: PO-1001\nTotal: 11,800.00', 0.9850
);

-- Field Extractions
INSERT INTO extraction_field_values (extraction_id, field_name, original_value, corrected_value, confidence_score, is_corrected) VALUES
(1, 'invoice_number', 'ABC-2026-TEST-001', 'ABC-2026-TEST-001', 0.9900, FALSE),
(1, 'vendor_name', 'ABC Furniture Suppliers', 'ABC Furniture Suppliers', 0.9800, FALSE),
(1, 'vendor_gstin', '29ABCDE1234F1Z5', '29ABCDE1234F1Z5', 0.9900, FALSE),
(1, 'po_number', 'PO-1001', 'PO-1001', 0.9800, FALSE),
(1, 'taxable_amount', '10000.00', '10000.00', 0.9900, FALSE),
(1, 'total_tax_amount', '1800.00', '1800.00', 0.9900, FALSE),
(1, 'total_amount', '11800.00', '11800.00', 0.9900, FALSE);

-- Invoice Validation
INSERT INTO invoice_validations (invoice_id, validation_status, passed_count, failed_count, warning_count) VALUES
(1, 'Passed', 8, 0, 0);

-- Three-Way PO & GRN Match Record
INSERT INTO invoice_po_matches (
    invoice_id, po_id, grn_id, match_type, match_status, header_variance_amount,
    price_variance_pct, quantity_variance, discrepancy_details, is_resolved
) VALUES (
    1, 1, 1, 'Three_Way', 'Matched', 0.00,
    0.0000, 0.0000, '{"discrepancies": [], "lines": [{"item": "Office Furniture (sample item)", "status": "Matched"}]}', TRUE
);

-- Approval Matrix Setup
INSERT INTO approval_matrices (name, department, min_amount, max_amount, required_role, step_order) VALUES
('Tier 1 - Executive AP Review', 'All', 0.00, 50000.00, 'ap_manager', 1),
('Tier 2 - Department Head Authorization', 'All', 50000.01, 500000.00, 'approver', 2),
('Tier 3 - CFO & Director Final Sign-off', 'All', 500000.01, 100000000.00, 'admin', 3);

-- Audit Log Entry
INSERT INTO audit_logs (user_id, action, entity_name, entity_id, ip_address, details) VALUES
(3, 'INVOICE_UPLOAD', 'Invoice', '1', '127.0.0.1', '{"invoice_number": "ABC-2026-TEST-001", "total": 11800.00}'),
(3, 'THREE_WAY_MATCH_SUCCESS', 'Invoice', '1', '127.0.0.1', '{"status": "Matching_Passed", "po_number": "PO-1001"}');
