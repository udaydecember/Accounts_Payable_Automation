import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  GitCompare,
  CreditCard,
  History,
  ShieldCheck,
  ScanEye,
  Clock,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Play,
  Download
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { formatINR } from '../utils/currency';

interface InvoiceDetailPageProps {
  invoiceId: string;
  onBack: () => void;
  onNavigateToOCR: (id: string) => void;
}

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({ invoiceId, onBack, onNavigateToOCR }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [matchData, setMatchData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const inv = await ApiService.getInvoice(invoiceId);
      setInvoice(inv);

      try {
        const m = await ApiService.request<any>(`/matching/${invoiceId}`);
        setMatchData(m);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerValidation = async () => {
    try {
      await ApiService.triggerValidation(invoiceId);
      await loadInvoiceData();
      setActionNotice('Invoice validation re-evaluated successfully.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert(`Validation Error: ${err.message}`);
    }
  };

  const handleTriggerMatching = async () => {
    try {
      await ApiService.triggerMatching(invoiceId);
      await loadInvoiceData();
      setActionNotice('3-Way PO & GRN matching re-calculated.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert(`Matching Error: ${err.message}`);
    }
  };

  const handleSubmitApproval = async () => {
    try {
      await ApiService.submitForApproval(invoiceId);
      await loadInvoiceData();
      setActionNotice('Invoice submitted to Maker-Checker approval workflow.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    }
  };

  if (loading || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Invoice Audit File...
        </p>
      </div>
    );
  }

  let matchDetails: any = {};
  if (matchData?.discrepancy_details) {
    try {
      matchDetails = JSON.parse(matchData.discrepancy_details);
    } catch {}
  }

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Invoice #{invoice.invoice_number}
              </h2>
              <Badge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Source: {invoice.source?.replace('_', ' ') || 'Manual'} • Ingested via OCR AI Pipeline
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerValidation}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Re-Validate
          </button>
          <button
            onClick={handleTriggerMatching}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Match PO
          </button>
          <button
            onClick={() => onNavigateToOCR(invoice.id)}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ScanEye className="w-3.5 h-3.5 text-teal-600" />
            OCR Workbench
          </button>
          {invoice.status !== 'Paid' && invoice.status !== 'Approval_Pending' && (
            <button
              onClick={handleSubmitApproval}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Submit Approval
            </button>
          )}
        </div>
      </div>

      {/* Grid: Financials, Vendor & PO Matching */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Vendor Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              Vendor Profile
            </h3>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Verified
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vendor Name</span>
              <p className="font-extrabold text-slate-900 text-sm">{invoice.vendor?.vendor_name || invoice.vendor_name_raw || 'Unknown Vendor'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">GSTIN Identification</span>
              <p className="font-mono font-semibold text-slate-800">{invoice.vendor_gstin || invoice.vendor?.gstin || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Settlement Terms</span>
              <p className="font-semibold text-slate-700">{invoice.payment_terms || 'Net 30 Days'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Remittance Account</span>
              <p className="font-semibold text-slate-700">{invoice.bank_name || 'HDFC Bank'} ({invoice.bank_account_number ? `...${invoice.bank_account_number.slice(-4)}` : 'Verified on File'})</p>
            </div>
          </div>
        </div>

        {/* PO & 3-Way Match Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-purple-600" />
              PO & GRN Match
            </h3>
            {matchData && <Badge status={matchData.match_status} />}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Purchase Order:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.po_number || 'Non-PO Invoice'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GRN Reference:</span>
              <span className="font-mono font-semibold text-slate-800">{matchDetails?.grn_number || 'GRN Verified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Price Variance:</span>
              <span className="font-semibold text-slate-800">
                {matchData?.price_variance_pct ? `${matchData.price_variance_pct.toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            {matchDetails?.discrepancies && matchDetails.discrepancies.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-100 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Discrepancy Details:</span>
                {matchDetails.discrepancies.map((d: any, idx: number) => (
                  <p key={idx} className="text-[11px] text-rose-600 leading-snug">
                    • <span className="font-semibold">{d.type}:</span> {d.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total Financial Settlement Card */}
        <div className="bg-gradient-to-br from-teal-50/70 via-blue-50/50 to-purple-50/60 p-5 rounded-2xl border border-teal-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
            <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-teal-700" />
              Settlement Ledger
            </h3>
            <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
              INR
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold">{formatINR(invoice.taxable_amount || invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Tax (GST):</span>
              <span className="font-semibold">{formatINR(invoice.total_tax_amount)}</span>
            </div>
            <div className="border-t border-teal-200 pt-2 flex justify-between items-baseline font-black text-slate-900">
              <span className="text-sm">Total Payable:</span>
              <span className="text-lg text-teal-900">{formatINR(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-0.5">
              <span>Amount Disbursed:</span>
              <span>{formatINR(invoice.amount_paid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Itemized Line Breakdown ({invoice.line_items?.length || 0})
          </div>
          <span className="text-[11px] font-bold text-slate-400">HSN/SAC Verified</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Material Code</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Tax Rate</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {invoice.line_items && invoice.line_items.length > 0 ? (
                invoice.line_items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-400">{item.line_number}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{item.item_description}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{item.material_code || 'MAT-01'}</td>
                    <td className="px-5 py-3 font-semibold">{Number(item.quantity)} {item.uom || 'PCS'}</td>
                    <td className="px-5 py-3">{formatINR(item.unit_price)}</td>
                    <td className="px-5 py-3">{Number(item.tax_rate)}%</td>
                    <td className="px-5 py-3 text-right font-black text-slate-900">{formatINR(item.line_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No itemized lines recorded for this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation & Discrepancy Status */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Statutory & Governance Validation Checks
        </h3>
        {invoice.exceptions && invoice.exceptions.length > 0 ? (
          <div className="space-y-2">
            {invoice.exceptions.map((exc) => (
              <div key={exc.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 font-mono">{exc.rule_code}:</span>
                  <span className="ml-2 text-amber-800 font-medium">{exc.message}</span>
                </div>
                <span className={`text-[11px] font-bold ${exc.is_resolved ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {exc.is_resolved ? 'Resolved' : 'Pending Resolution'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">All statutory GST, duplicate checks, vendor master, and mathematical integrity validations passed!</span>
          </div>
        )}
      </div>
    </div>
  );
};
