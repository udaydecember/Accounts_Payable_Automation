export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  approval_limit: string;
  is_active: boolean;
  roles: { id: string; name: string; display_name: string }[];
}

export interface Vendor {
  id: string;
  vendor_name: string;
  vendor_code: string;
  vendor_type: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  gstin?: string;
  pan?: string;
  currency: string;
  payment_terms: string;
  status: string;
  bank_accounts: {
    id: string;
    bank_name: string;
    account_number_masked: string;
    ifsc_code: string;
    branch_name?: string;
    is_primary: boolean;
  }[];
  documents: {
    id: string;
    document_type: string;
    document_name: string;
    file_path: string;
    is_verified: boolean;
    uploaded_at: string;
  }[];
}

export interface LineItem {
  id: string;
  line_number: number;
  item_description: string;
  material_code?: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  po_line_reference?: number;
}

export interface ExtractionFieldValue {
  id: string;
  field_name: string;
  original_value?: string;
  corrected_value?: string;
  confidence_score: number;
  bounding_box?: string;
  page_number: number;
  is_corrected: boolean;
}

export interface InvoiceException {
  id: string;
  rule_code: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  suggested_action?: string;
  is_resolved: boolean;
  resolution_comments?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_id?: string;
  vendor_name_raw?: string;
  vendor_name?: string;
  vendor?: Vendor;
  vendor_gstin?: string;
  invoice_date: string;
  due_date?: string;
  po_number?: string;
  payment_terms: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax_amount: number;
  round_off_amount: number;
  total_amount: number;
  amount_payable: number;
  amount_paid: number;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  status: string;
  source: string;
  uploader_id?: string;
  department: string;
  created_at: string;
  updated_at: string;
  line_items: LineItem[];
  documents: {
    id: string;
    file_name: string;
    original_file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }[];
  extractions: {
    id: string;
    overall_confidence: number;
    field_values: ExtractionFieldValue[];
  }[];
  exceptions: InvoiceException[];
}

export interface POMatch {
  id: string;
  invoice_id: string;
  po_id?: string;
  grn_id?: string;
  match_type: string;
  match_status: string;
  header_variance_amount: number;
  price_variance_pct: number;
  quantity_variance: number;
  discrepancy_details?: string;
  is_resolved: boolean;
  resolution_notes?: string;
  created_at: string;
}

export interface ApprovalStep {
  id: string;
  step_order: number;
  step_name: string;
  assigned_role: string;
  assigned_user_id?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
}

export interface ApprovalInstance {
  id: string;
  invoice_id: string;
  workflow_id?: string;
  status: string;
  current_step_order: number;
  started_at: string;
  completed_at?: string;
  steps: ApprovalStep[];
}

export interface PaymentRequest {
  id: string;
  request_number: string;
  invoice_id: string;
  batch_id?: string;
  requested_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  requested_at: string;
  advice?: {
    id: string;
    advice_number: string;
    total_gross_amount: number;
    tax_deducted_tds: number;
    net_paid_amount: number;
    payment_date: string;
    bank_ref_no?: string;
  };
}

export interface DashboardMetrics {
  summary: {
    total_invoices: number;
    awaiting_ocr: number;
    pending_validation: number;
    pending_approval: number;
    approved: number;
    pending_payment: number;
    paid_count: number;
    total_invoice_amount: number;
    total_paid_amount: number;
    total_outstanding_amount: number;
    ocr_accuracy_pct: number;
    average_processing_time_hours: number;
  };
  aging_buckets: {
    current_0_30: number;
    past_31_60: number;
    past_61_90: number;
    past_90_plus: number;
  };
  top_vendors: { vendor_name: string; total_spend: number; count: number }[];
  status_distribution: { status: string; count: number }[];
}
