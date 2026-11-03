const API_BASE = '/api/v1';

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Trigger token refresh or logout if expired
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'An error occurred during API request');
    }

    // Handle binary responses (e.g. CSV/Excel downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('text/csv') || contentType.includes('spreadsheetml'))) {
      return (await response.blob()) as unknown as T;
    }

    return response.json();
  }

  // Auth
  static login(formData: FormData) {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: formData
    });
  }

  static getMe() {
    return this.request<any>('/auth/me');
  }

  // Dashboard & Analytics
  static getDashboard() {
    return this.request<any>('/analytics/dashboard');
  }

  // Invoices
  static getInvoices(params?: { status?: string; vendor_id?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
    if (params?.search) qs.set('search', params.search);
    return this.request<any[]>(`/invoices?${qs.toString()}`);
  }

  static getInvoice(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }

  static uploadInvoices(formData: FormData) {
    return this.request<any[]>('/invoices/upload', {
      method: 'POST',
      body: formData
    });
  }

  static correctOCR(invoiceId: string, corrections: { field_name: string; corrected_value: string }[]) {
    return this.request<any>(`/invoices/${invoiceId}/ocr-correct`, {
      method: 'POST',
      body: JSON.stringify({ corrections })
    });
  }

  static triggerValidation(invoiceId: string) {
    return this.request<any>(`/invoices/${invoiceId}/validate`, { method: 'POST' });
  }

  static triggerMatching(invoiceId: string) {
    return this.request<any>(`/invoices/${invoiceId}/match`, { method: 'POST' });
  }

  static submitForApproval(invoiceId: string) {
    return this.request<any>(`/invoices/${invoiceId}/submit-approval`, { method: 'POST' });
  }

  // Exceptions
  static getExceptions() {
    return this.request<any[]>('/validations/exceptions');
  }

  static resolveException(exceptionId: string, resolution_comments: string) {
    return this.request<any>(`/validations/exceptions/${exceptionId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_comments })
    });
  }

  // Matching
  static getMatches() {
    return this.request<any[]>('/matching');
  }

  static overrideMatch(matchId: string, resolution_notes: string) {
    return this.request<any>(`/matching/${matchId}/override`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes })
    });
  }

  // Workflows
  static getApprovalInbox() {
    return this.request<any[]>('/workflows/inbox');
  }

  static executeApprovalAction(invoiceId: string, action: string, comments?: string) {
    return this.request<any>(`/workflows/action/${invoiceId}`, {
      method: 'POST',
      body: JSON.stringify({ action, comments })
    });
  }

  static getWorkflowMatrix() {
    return this.request<any[]>('/workflows/matrix');
  }

  static addWorkflowRule(rule: any) {
    return this.request<any>('/workflows/matrix/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  }

  // Vendors
  static getVendors(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/vendors${qs}`);
  }

  static getVendor(id: string) {
    return this.request<any>(`/vendors/${id}`);
  }

  static createVendor(vendor: any) {
    return this.request<any>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor)
    });
  }

  // Payments
  static getReadyPayments() {
    return this.request<any[]>('/payments/ready');
  }

  static getPaymentRequests() {
    return this.request<any[]>('/payments/requests');
  }

  static createPaymentRequest(invoiceId: string, requestedAmount: number, paymentMethod = 'NEFT/RTGS') {
    return this.request<any>('/payments/request', {
      method: 'POST',
      body: JSON.stringify({ invoice_id: invoiceId, requested_amount: requestedAmount, payment_method: paymentMethod })
    });
  }

  static createPaymentBatch(invoiceIds: string[]) {
    return this.request<any>('/payments/batch', {
      method: 'POST',
      body: JSON.stringify({ invoice_ids: invoiceIds })
    });
  }

  static executePayment(requestId: string, simulateFailure = false) {
    return this.request<any>(`/payments/execute/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ simulate_failure: simulateFailure })
    });
  }

  // Reports
  static getAgingReport() {
    return this.request<any[]>('/reports/aging');
  }

  static getTaxReport() {
    return this.request<any[]>('/reports/tax');
  }

  static getExceptionsReport() {
    return this.request<any[]>('/reports/exceptions');
  }

  static async exportReport(reportType: string, format = 'csv') {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/reports/export/${reportType}?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Audit Logs
  static getAuditLogs() {
    return this.request<any[]>('/audit/logs');
  }

  // Integrations
  static getIntegrations() {
    return this.request<any[]>('/integrations');
  }

  static testIntegration(name: string) {
    return this.request<any>(`/integrations/${name}/test`, { method: 'POST' });
  }

  static syncIntegration(name: string) {
    return this.request<any>(`/integrations/${name}/sync`, { method: 'POST' });
  }
}
