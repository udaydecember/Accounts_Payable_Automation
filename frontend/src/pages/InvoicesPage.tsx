import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  Mail,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

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
    const fd = new FormData();
    for (let i = 0; i < uploadFiles.length; i++) {
      fd.append('files', uploadFiles[i]);
    }
    fd.append('source', 'Manual_Upload');

    try {
      await ApiService.uploadInvoices(fd);
      setIsUploadOpen(false);
      setUploadFiles(null);
      setActionMessage('Invoices uploaded, OCR processed, and validated successfully!');
      loadInvoices();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEmailSimulation = async () => {
    setUploading(true);
    try {
      // Simulate email invoice attachment ingestion
      const sampleBlob = new Blob([
        `Acme Global Industrial Supplies\nINVOICE # INV-2026-EM01\nDate: 2026-11-01\nPO # PO-2026-8801\nGSTIN: 27AABCT3518Q1ZV\nItem: Precision Industrial Valve Unit\nQty: 10\nUnit Price: $1059.32\nTotal: $12500.00`
      ], { type: 'text/plain' });

      const file = new File([sampleBlob], 'sample_email_invoice_INV_EM01.txt', { type: 'text/plain' });
      const fd = new FormData();
      fd.append('files', file);
      fd.append('source', 'Email_Connector');

      await ApiService.uploadInvoices(fd);
      setIsUploadOpen(false);
      setActionMessage('Email attachment ingested and OCR parsed into pipeline!');
      loadInvoices();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Email ingestion failed: ${err.message}`);
    } finally {
      setUploading(false);
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

          <button
            onClick={() => setIsUploadOpen(true)}
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
                        {inv.currency} {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {Number(inv.amount_paid) > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Paid: {inv.currency} {Number(inv.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge status={inv.status} />
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
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Capture & Ingest Invoices" maxWidth="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
            <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Drag and drop invoice files or browse</p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, JPEG, TIFF (Single or Multi-page batch)</p>

            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
              onChange={(e) => setUploadFiles(e.target.files)}
              className="mt-4 block mx-auto text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
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
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              Simulate Ingest from Email Connector
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFiles || uploadFiles.length === 0}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {uploading ? 'Processing OCR & AI...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
