-- ============================================================================
-- ACCOUNTS PAYABLE (AP) AUTOMATION PLATFORM - POSTGRESQL DDL SCHEMA
-- Compatible with PostgreSQL 13, 14, 15, 16+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payment_advices CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS payment_batches CASCADE;
DROP TABLE IF EXISTS approval_actions CASCADE;
DROP TABLE IF EXISTS approval_steps CASCADE;
DROP TABLE IF EXISTS approval_instances CASCADE;
DROP TABLE IF EXISTS approval_rules CASCADE;
DROP TABLE IF EXISTS approval_workflows CASCADE;
DROP TABLE IF EXISTS invoice_po_matches CASCADE;
DROP TABLE IF EXISTS invoice_exceptions CASCADE;
DROP TABLE IF EXISTS invoice_validations CASCADE;
DROP TABLE IF EXISTS extraction_field_values CASCADE;
DROP TABLE IF EXISTS invoice_extractions CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoice_documents CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS grn_line_items CASCADE;
DROP TABLE IF EXISTS goods_receipts CASCADE;
DROP TABLE IF EXISTS po_line_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vendor_documents CASCADE;
DROP TABLE IF EXISTS vendor_bank_accounts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS integration_configurations CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- ----------------------------------------------------------------------------
-- 1. AUTHENTICATION & ACCESS CONTROL
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'Finance',
    approval_limit VARCHAR(50) DEFAULT '0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_users_email ON users(email);

CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_roles_name ON roles(name);

CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_permissions_name ON permissions(name);

CREATE TABLE user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(36) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- 2. VENDORS & BANKING
-- ----------------------------------------------------------------------------
CREATE TABLE vendors (
    id VARCHAR(36) PRIMARY KEY,
    vendor_code VARCHAR(50) NOT NULL UNIQUE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) DEFAULT 'Standard',
    contact_person VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    gstin VARCHAR(15) UNIQUE,
    pan VARCHAR(10) UNIQUE,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_vendors_code ON vendors(vendor_code);
CREATE INDEX ix_vendors_gstin ON vendors(gstin);

CREATE TABLE vendor_bank_accounts (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    account_number_masked VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    is_primary BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_documents (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    doc_number VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. PURCHASE ORDERS & GOODS RECEIPTS (GRN)
-- ----------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id),
    po_date DATE NOT NULL,
    delivery_date DATE,
    currency VARCHAR(10) DEFAULT 'INR',
    subtotal NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    status VARCHAR(30) DEFAULT 'Open',
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_purchase_orders_number ON purchase_orders(po_number);

CREATE TABLE po_line_items (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_description TEXT NOT NULL,
    material_code VARCHAR(50),
    hsn_sac_code VARCHAR(20),
    quantity NUMERIC(12, 4) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'PCS',
    unit_price NUMERIC(15, 4) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    line_total NUMERIC(15, 2) NOT NULL,
    received_quantity NUMERIC(12, 4) DEFAULT 0.0000,
    invoiced_quantity NUMERIC(12, 4) DEFAULT 0.0000
);

CREATE TABLE goods_receipts (
    id VARCHAR(36) PRIMARY KEY,
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id),
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id),
    receipt_date DATE NOT NULL,
    received_by VARCHAR(36) REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_goods_receipts_number ON goods_receipts(grn_number);

CREATE TABLE grn_line_items (
    id VARCHAR(36) PRIMARY KEY,
    grn_id VARCHAR(36) NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_line_item_id VARCHAR(36) NOT NULL REFERENCES po_line_items(id),
    received_quantity NUMERIC(12, 4) NOT NULL,
    accepted_quantity NUMERIC(12, 4) NOT NULL,
    rejected_quantity NUMERIC(12, 4) DEFAULT 0.0000,
    condition VARCHAR(50) DEFAULT 'Good'
);

-- ----------------------------------------------------------------------------
-- 4. INVOICES, EXTRACTIONS & VALIDATION
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(36) REFERENCES vendors(id),
    po_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    currency VARCHAR(10) DEFAULT 'INR',
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    round_off_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL,
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft',
    source VARCHAR(50) DEFAULT 'Manual_Upload',
    assigned_approver_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_invoices_number ON invoices(invoice_number);
CREATE INDEX ix_invoices_status ON invoices(status);
CREATE INDEX ix_invoices_po ON invoices(po_number);

CREATE TABLE invoice_documents (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    page_count INTEGER DEFAULT 1,
    checksum_sha256 VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_line_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_description TEXT NOT NULL,
    material_code VARCHAR(50),
    hsn_sac_code VARCHAR(20),
    quantity NUMERIC(12, 4) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'PCS',
    unit_price NUMERIC(15, 4) NOT NULL,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    line_total NUMERIC(15, 2) NOT NULL
);

CREATE TABLE invoice_extractions (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    ocr_engine VARCHAR(50) DEFAULT 'Local PyPDF/Tesseract',
    overall_confidence NUMERIC(5, 4) DEFAULT 0.9500,
    raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extraction_field_values (
    id VARCHAR(36) PRIMARY KEY,
    extraction_id VARCHAR(36) NOT NULL REFERENCES invoice_extractions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    confidence NUMERIC(5, 4) DEFAULT 0.9500,
    page_number INTEGER DEFAULT 1,
    bounding_box VARCHAR(100),
    is_corrected BOOLEAN DEFAULT FALSE,
    corrected_value TEXT
);

CREATE TABLE invoice_validations (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    validation_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    details TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_exceptions (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    exception_type VARCHAR(100) NOT NULL,
    severity VARCHAR(30) DEFAULT 'Medium',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(36) REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. THREE-WAY MATCHING
-- ----------------------------------------------------------------------------
CREATE TABLE invoice_po_matches (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id),
    match_type VARCHAR(30) DEFAULT 'Three_Way',
    match_status VARCHAR(30) NOT NULL,
    price_variance NUMERIC(15, 2) DEFAULT 0.00,
    quantity_variance NUMERIC(12, 4) DEFAULT 0.0000,
    discrepancy_details TEXT,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. APPROVAL WORKFLOWS (MAKER-CHECKER)
-- ----------------------------------------------------------------------------
CREATE TABLE approval_workflows (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_rules (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(15, 2),
    department VARCHAR(100),
    required_role VARCHAR(50) NOT NULL,
    step_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE approval_instances (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    workflow_id VARCHAR(36) NOT NULL REFERENCES approval_workflows(id),
    status VARCHAR(30) DEFAULT 'Pending',
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_steps (
    id VARCHAR(36) PRIMARY KEY,
    instance_id VARCHAR(36) NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    assigned_role VARCHAR(50) NOT NULL,
    assigned_user_id VARCHAR(36) REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'Pending',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_actions (
    id VARCHAR(36) PRIMARY KEY,
    step_id VARCHAR(36) NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    action VARCHAR(30) NOT NULL,
    comments TEXT,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. PAYMENTS & ADVICE
-- ----------------------------------------------------------------------------
CREATE TABLE payment_batches (
    id VARCHAR(36) PRIMARY KEY,
    batch_reference VARCHAR(100) NOT NULL UNIQUE,
    total_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) DEFAULT 'NEFT',
    status VARCHAR(30) DEFAULT 'Initiated',
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payment_requests (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    batch_id VARCHAR(36) REFERENCES payment_batches(id),
    vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_mode VARCHAR(50) DEFAULT 'NEFT',
    requested_by VARCHAR(36) REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'Payment_Requested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    payment_request_id VARCHAR(36) NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    bank_reference_number VARCHAR(100) NOT NULL UNIQUE,
    utr_number VARCHAR(100),
    amount_paid NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_advices (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    advice_number VARCHAR(100) NOT NULL UNIQUE,
    pdf_path VARCHAR(500),
    sent_to_email VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOGS & INTEGRATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id),
    user_email VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_audit_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX ix_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE integration_configurations (
    id VARCHAR(36) PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL UNIQUE,
    system_type VARCHAR(50) NOT NULL,
    endpoint_url VARCHAR(255),
    auth_type VARCHAR(50),
    api_key_masked VARCHAR(100),
    is_enabled BOOLEAN DEFAULT FALSE,
    connection_status VARCHAR(50) DEFAULT 'Standby',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Completed PostgreSQL Schema Setup
