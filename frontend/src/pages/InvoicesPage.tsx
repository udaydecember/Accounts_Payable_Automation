import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Play,
  ArrowRight,
  Mail,
  RefreshCw,
  Plus,
  Loader2,
  Sparkles,
  Check,
  Receipt,
  Trash2,
  FileCheck
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

interface InvoicesPageProps {
  onSelectInvoice: (id: string) => void;
  onNavigateToOCR: (id: string) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onSelectInvoice, onNavigateToOCR }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedInvoices, setExtractedInvoices] = useState<any[] | null>(null);
  const [showExtractedModal, setShowExtractedModal] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.name === 'admin');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getInvoices({
        status: statusFilter || undefined,
        search: search || undefined
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    const fd = new FormData();
    for (let i = 0; i < uploadFiles.length; i++) {
      fd.append('files', uploadFiles[i]);
    }
    fd.append('source', 'Manual_Upload');

    try {
      const result = await ApiService.uploadInvoices(fd);
      setIsUploadOpen(false);
      setUploadFiles(null);
      setExtractedInvoices(result);
      setShowExtractedModal(true);
      setActionMessage(`Successfully ingested, OCR extracted, and validated ${result.length} invoice(s)!`);
      loadInvoices();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during invoice upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleEmailSimulation = async () => {
    setUploading(true);
    setErrorMessage(null);
    try {
      const sampleBlob = new Blob([
        `Acme Global Industrial Supplies\nINVOICE # INV-2026-EM01\nDate: 2026-11-01\nPO # PO-2026-8801\nGSTIN: 27AABCT3518Q1ZV\nItem: Precision Industrial Valve Unit\nQty: 10\nUnit Price: ₹1059.32\nTotal: ₹12500.00`
      ], { type: 'text/plain' });

      const file = new File([sampleBlob], 'sample_email_invoice_INV_EM01.txt', { type: 'text/plain' });
      const fd = new FormData();
      fd.append('files', file);
      fd.append('source', 'Email_Connector');

      const result = await ApiService.uploadInvoices(fd);
      setIsUploadOpen(false);
      setExtractedInvoices(result);
      setShowExtractedModal(true);
      setActionMessage('Email attachment ingested and OCR parsed into pipeline!');
      loadInvoices();
    } catch (err: any) {
      setErrorMessage(err.message || 'Email ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      setResetting(true);
      const res = await ApiService.resetTransactionHistory(true);
      setIsResetModalOpen(false);
      setActionMessage(res.message || 'All invoice history successfully reset to zero.');
      loadInvoices();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const runValidation = async (id: string) => {
    try {
      await ApiService.triggerValidation(id);
      loadInvoices();
      setActionMessage(`Invoice validation re-evaluated.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const runMatching = async (id: string) => {
    try {
      await ApiService.triggerMatching(id);
      loadInvoices();
      setActionMessage(`PO and GRN matching re-calculated.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitApproval = async (id: string) => {
    try {
      await ApiService.submitForApproval(id);
      loadInvoices();
      setActionMessage(`Invoice successfully submitted for workflow approvals!`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Approval Submission Blocked: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 font-bold">&times;</button>
        </div>
      )}

      {/* Control Bar: Filters, Search, Upload Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, vendor, PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="OCR_Completed">OCR Completed</option>
              <option value="Validation_Pending">Validation Pending</option>
              <option value="Validation_Failed">Validation Failed</option>
              <option value="Validation_Passed">Validation Passed</option>
              <option value="Approval_Pending">Approval Pending</option>
              <option value="Ready_For_Payment">Ready For Payment</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all invoice transactions to start fresh"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Reset History
            </button>
          )}

          <button
            onClick={() => {
              setErrorMessage(null);
              setIsUploadOpen(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Capture Invoices
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Invoice Details</th>
                <th className="px-5 py-3">Vendor / Tax ID</th>
                <th className="px-5 py-3">PO Reference</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading invoice records...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No invoices match the specified query. Click "Capture Invoices" to upload.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{inv.invoice_number}</div>
                      <div className="text-[11px] text-slate-500">
                        Date: {inv.invoice_date} • Source: {inv.source.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{inv.vendor_name_raw || 'Unknown Vendor'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.vendor_gstin || 'No GSTIN'}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {inv.po_number || <span className="text-slate-400 italic">Non-PO</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">
                        {formatINR(inv.total_amount)}
                      </div>
                      {Number(inv.amount_paid) > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Paid: {formatINR(inv.amount_paid)}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge status={inv.status} />
                      {inv.status === 'Matching_Failed' && inv.exceptions && inv.exceptions.length > 0 && (
                        <div className="text-[10px] text-rose-600 mt-1 max-w-[220px] leading-tight font-medium" title={inv.exceptions.find(e => e.rule_code === 'PO_GRN_MATCH_DISCREPANCY')?.message || inv.exceptions[0].message}>
                          {inv.exceptions.find(e => e.rule_code === 'PO_GRN_MATCH_DISCREPANCY')?.message || inv.exceptions[0].message}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToOCR(inv.id)}
                          title="OCR Review & Data Correction"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          OCR Review
                        </button>

                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          title="View Full Invoice Details"
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        {inv.status !== 'Paid' && inv.status !== 'Approval_Pending' && (
                          <button
                            onClick={() => submitApproval(inv.id)}
                            title="Submit to Multi-tier Approval Matrix"
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Submit Approval
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Capture Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          if (!uploading) {
            setIsUploadOpen(false);
            setErrorMessage(null);
          }
        }}
        title="Capture & Ingest Invoices"
        maxWidth="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Meaningful Error Notification */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs flex items-start justify-between shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-900 block">Upload / OCR Failed</span>
                  <p className="text-red-700 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer text-sm"
              >
                &times;
              </button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
            <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Drag and drop invoice files or browse</p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, JPEG, TIFF (Single or Multi-page batch)</p>

            <input
              type="file"
              multiple
              disabled={uploading}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
              onChange={(e) => {
                setErrorMessage(null);
                setUploadFiles(e.target.files);
              }}
              className="mt-4 block mx-auto text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer disabled:opacity-50"
            />
          </div>

          {uploadFiles && uploadFiles.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">{uploadFiles.length} file(s) selected:</span>
              <ul className="list-disc pl-5 mt-1 text-slate-600">
                {Array.from(uploadFiles).map((f, i) => (
                  <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleEmailSimulation}
              disabled={uploading}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              Simulate Ingest from Email Connector
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(false);
                  setErrorMessage(null);
                }}
                disabled={uploading}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFiles || uploadFiles.length === 0}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {uploading ? 'Processing OCR & AI...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reset History Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          if (!resetting) setIsResetModalOpen(false);
        }}
        title="Confirm Reset: Start Fresh with Clean Invoice History"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-sm">Permanent History Removal</h4>
              <p className="text-amber-800 leading-relaxed">
                This operation will permanently delete all existing invoice records, OCR extractions, validation exceptions, approval history, and payment batches.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-slate-700">
            <span className="font-bold block text-slate-900">What will be removed:</span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>All invoice records and itemized line items</li>
              <li>All OCR extraction logs & confidence scores</li>
              <li>All PO and GRN matching history</li>
              <li>All multi-tier approval workflow steps & decisions</li>
              <li>All payment requests, bank advice & transaction entries</li>
              <li>All uploaded physical PDF/image files from storage</li>
            </ul>
            <span className="font-bold block text-emerald-800 pt-1.5">What will be safely preserved:</span>
            <ul className="list-disc pl-5 space-y-1 text-emerald-700">
              <li>User accounts and role permissions (Admin, AP Manager, Maker, Approver, etc.)</li>
              <li>Vendor master directory profiles, GSTINs, and bank accounts</li>
              <li>Purchase orders and Goods Receipt Notes (GRN)</li>
              <li>Approval matrix threshold configurations and system settings</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              disabled={resetting}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              disabled={resetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {resetting ? 'Resetting History...' : 'Confirm & Reset Invoice History'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Extracted Invoice Details & OCR Summary Modal */}
      {showExtractedModal && extractedInvoices && (
        <Modal
          isOpen={showExtractedModal}
          onClose={() => setShowExtractedModal(false)}
          title="Extracted Invoice Details & AI OCR Summary"
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">OCR & Document Extraction Completed Successfully</h4>
                <p className="text-xs text-emerald-700">
                  {extractedInvoices.length} invoice document(s) parsed, validated against vendor master, and matched against purchase orders.
                </p>
              </div>
            </div>

            {extractedInvoices.map((inv, idx) => (
              <div key={inv.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">Invoice Document #{idx + 1}</span>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {inv.invoice_number}
                      <Badge status={inv.status} />
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Invoice Date</span>
                    <p className="text-xs font-bold text-slate-800">{inv.invoice_date}</p>
                  </div>
                </div>

                {/* Key Extracted Header Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier / Vendor</span>
                    <span className="font-semibold text-slate-900 truncate block">{inv.vendor_name_raw || 'Unknown Vendor'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor GSTIN</span>
                    <span className="font-mono text-slate-800">{inv.vendor_gstin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">PO Reference</span>
                    <span className="font-mono text-slate-800">{inv.po_number || 'Non-PO'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Terms</span>
                    <span className="text-slate-800">{inv.payment_terms || 'Net 30'}</span>
                  </div>
                </div>

                {/* Extracted Financial Totals */}
                <div className="grid grid-cols-3 gap-3 bg-teal-50/60 border border-teal-100 p-3.5 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Taxable Subtotal</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatINR(inv.taxable_amount || inv.subtotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Tax (GST)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatINR(inv.total_tax_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-teal-700 block text-[10px] uppercase font-bold">Total Amount Payable</span>
                    <span className="font-black text-teal-900 text-base">
                      {formatINR(inv.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Extracted Line Items Table */}
                {inv.line_items && inv.line_items.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-teal-600" />
                      Extracted Line Items ({inv.line_items.length})
                    </span>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100/70 text-slate-500 text-[11px] font-semibold">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Item Description</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Unit Price</th>
                            <th className="px-3 py-2 text-right">Tax Rate</th>
                            <th className="px-3 py-2 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {inv.line_items.map((item: any, itemIdx: number) => (
                            <tr key={item.id || itemIdx}>
                              <td className="px-3 py-2 font-mono text-slate-500">{item.line_number || itemIdx + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-900">{item.item_description}</td>
                              <td className="px-3 py-2 text-right font-mono">{Number(item.quantity).toFixed(1)}</td>
                              <td className="px-3 py-2 text-right font-mono">
                                {formatINR(item.unit_price)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{Number(item.tax_rate).toFixed(1)}%</td>
                              <td className="px-3 py-2 text-right font-bold font-mono text-slate-900">
                                {formatINR(item.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Quick Actions for this invoice */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtractedModal(false);
                      onNavigateToOCR(inv.id);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Review in OCR Correction Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtractedModal(false);
                      onSelectInvoice(inv.id);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Invoice Record
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExtractedModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
