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
  FileCheck,
  Download,
  Building2,
  Calendar,
  Layers
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

  const handleQuickSampleUpload = async (sampleName: string, vendor: string, po: string, amount: string) => {
    setUploading(true);
    setErrorMessage(null);
    try {
      const sampleBlob = new Blob([
        `${vendor}\nINVOICE # ${sampleName.replace('.pdf', '')}\nDate: 2026-11-01\nPO # ${po}\nGSTIN: 29ABCDE1234F1Z5\nItem: Industrial Equipment Unit\nQty: 1\nUnit Price: ${amount}\nTotal: ${amount}`
      ], { type: 'text/plain' });

      const file = new File([sampleBlob], sampleName, { type: 'text/plain' });
      const fd = new FormData();
      fd.append('files', file);
      fd.append('source', 'Sample_Invoices');

      const result = await ApiService.uploadInvoices(fd);
      setIsUploadOpen(false);
      setExtractedInvoices(result);
      setShowExtractedModal(true);
      setActionMessage(`Ingested sample invoice ${sampleName} into processing pipeline!`);
      loadInvoices();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sample ingestion failed.');
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold text-sm cursor-pointer">&times;</button>
        </div>
      )}

      {/* Control Bar: Search, Filters, Capture Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by invoice #, vendor, PO number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 text-slate-900 placeholder-slate-400 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-transparent border-0 font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="OCR_Completed">OCR Completed</option>
              <option value="Validation_Pending">Validation Pending</option>
              <option value="Validation_Failed">Validation Failed</option>
              <option value="Validation_Passed">Validation Passed</option>
              <option value="Matching_Passed">Matching Passed</option>
              <option value="Matching_Failed">Matching Failed</option>
              <option value="Approval_Pending">Approval Pending</option>
              <option value="Ready_For_Payment">Ready For Payment</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Capture Invoices
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Vendor / GSTIN</th>
                <th className="px-5 py-3.5">PO Ref</th>
                <th className="px-5 py-3.5">Amount (INR)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Retrieving invoices from PostgreSQL repository...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No invoices match your query.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Capture Invoices" to upload a digital or scanned invoice.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        {inv.invoice_number}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Date: {inv.invoice_date || 'N/A'} • {inv.source?.replace('_', ' ') || 'Manual'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{inv.vendor?.vendor_name || inv.vendor_name_raw || 'Unknown Vendor'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.vendor_gstin || inv.vendor?.gstin || 'No GSTIN'}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {inv.po_number ? (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 text-[11px] font-semibold">
                          {inv.po_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Non-PO</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-black text-slate-900">
                        {formatINR(inv.total_amount)}
                      </div>
                      {Number(inv.amount_paid) > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Paid: {formatINR(inv.amount_paid)}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge status={inv.status} />
                      {inv.status === 'Matching_Failed' && inv.exceptions && inv.exceptions.length > 0 && (
                        <div className="text-[10px] text-rose-600 mt-1 max-w-[200px] leading-tight font-medium" title={inv.exceptions[0].message}>
                          {inv.exceptions[0].message}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToOCR(inv.id)}
                          title="OCR Review & Edit"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          OCR
                        </button>

                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          title="View Full Invoice Details"
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-bold text-[11px] border border-teal-200 transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        {inv.status !== 'Paid' && inv.status !== 'Approval_Pending' && (
                          <button
                            onClick={() => submitApproval(inv.id)}
                            title="Submit to Multi-Tier Approval Matrix"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-200 transition-colors cursor-pointer"
                          >
                            Submit
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
        title="Capture & Ingest Invoices into Pipeline"
        maxWidth="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs flex items-start justify-between shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-900 block">Ingestion Notice</span>
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

          {/* Quick Sample Invoices Pills */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50/70 via-blue-50/50 to-purple-50/70 border border-teal-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              Quick One-Click Test Invoices (Ready in Repository)
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                disabled={uploading}
                onClick={() => handleQuickSampleUpload('invoice_ABC-2026-TEST-001.pdf', 'ABC Furniture Suppliers', 'PO-1001', '₹11800.00')}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-800 font-semibold rounded-lg border border-teal-200 text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                ABC-2026-TEST-001 (PO-1001 • ₹11,800)
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => handleQuickSampleUpload('invoice_acme_valve_po8801.pdf', 'Acme Global Supplies', 'PO-2026-8801', '₹12500.00')}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-800 font-semibold rounded-lg border border-teal-200 text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Acme Valve (PO-8801 • ₹12,500)
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => handleQuickSampleUpload('invoice_apex_cloud_po9905.pdf', 'Apex Cloud Solutions', 'PO-2026-9905', '₹85000.00')}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-800 font-semibold rounded-lg border border-teal-200 text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Apex Cloud (PO-9905 • ₹85,000)
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-2xl p-7 text-center bg-teal-50/20 hover:bg-teal-50/40 transition-colors">
            <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Drag & drop invoice files or select to browse</p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, JPEG, TIFF (Single or Batch Upload)</p>

            <input
              type="file"
              multiple
              disabled={uploading}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
              onChange={(e) => {
                setErrorMessage(null);
                setUploadFiles(e.target.files);
              }}
              className="mt-4 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer disabled:opacity-50 shadow-2xs"
            />
          </div>

          {uploadFiles && uploadFiles.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">{uploadFiles.length} file(s) selected:</span>
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
              className="text-xs text-teal-800 hover:text-teal-950 flex items-center gap-1.5 font-bold cursor-pointer disabled:opacity-50"
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
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFiles || uploadFiles.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
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
                This operation will delete all test invoice transactions, extractions, validation exceptions, approval logs, and payment batches from PostgreSQL.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-700">
            <span className="font-bold block text-slate-900">What will be purged:</span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>All invoice records and itemized line items</li>
              <li>All OCR extraction logs & field values</li>
              <li>All PO and GRN matching history</li>
              <li>All workflow approvals and actions</li>
              <li>All payment requests, bank advice, and batch receipts</li>
            </ul>
            <span className="font-bold block text-emerald-800 pt-1.5">What remains preserved:</span>
            <ul className="list-disc pl-5 space-y-1 text-emerald-700">
              <li>Users, roles, and permissions (Admin, AP Manager, Approver, etc.)</li>
              <li>Vendor master directory profiles, GSTINs, and bank accounts</li>
              <li>Purchase orders and Goods Receipt Notes (GRN)</li>
              <li>Approval matrix rules and system settings</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              disabled={resetting}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              disabled={resetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
          <div className="space-y-5 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">OCR & Document Extraction Completed</h4>
                <p className="text-emerald-700">
                  {extractedInvoices.length} invoice document(s) ingested, parsed, and validated.
                </p>
              </div>
            </div>

            {extractedInvoices.map((inv, idx) => (
              <div key={inv.id || idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Document #{idx + 1}</span>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      {inv.invoice_number}
                      <Badge status={inv.status} />
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Invoice Date</span>
                    <p className="text-xs font-bold text-slate-800">{inv.invoice_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier</span>
                    <span className="font-bold text-slate-900 truncate block">{inv.vendor_name_raw || 'Unknown Vendor'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor GSTIN</span>
                    <span className="font-mono text-slate-800 font-semibold">{inv.vendor_gstin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">PO Ref</span>
                    <span className="font-mono text-slate-800 font-semibold">{inv.po_number || 'Non-PO'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Terms</span>
                    <span className="text-slate-800 font-semibold">{inv.payment_terms || 'Net 30'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-teal-50/70 border border-teal-200/80 p-3.5 rounded-xl">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Taxable Subtotal</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatINR(inv.taxable_amount || inv.subtotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Tax</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatINR(inv.total_tax_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-teal-800 block text-[10px] uppercase font-extrabold">Total Amount</span>
                    <span className="font-black text-teal-900 text-base">
                      {formatINR(inv.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtractedModal(false);
                      onNavigateToOCR(inv.id);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Review in OCR Workbench
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtractedModal(false);
                      onSelectInvoice(inv.id);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExtractedModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Close & Return
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
