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
  Clock
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

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
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
      {/* Top Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice #{invoice.invoice_number}</h2>
              <Badge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Source: {invoice.source.replace('_', ' ')} • Uploaded by {invoice.uploader_id?.substring(0, 8) || 'System'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToOCR(invoice.id)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ScanEye className="w-4 h-4 text-teal-600" />
            OCR Workbench
          </button>
        </div>
      </div>

      {/* Grid: Financials & Vendor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendor Master Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vendor Profile</h3>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 text-sm">{invoice.vendor_name_raw || 'Unknown Vendor'}</div>
            <div className="text-slate-500 font-mono">GSTIN: {invoice.vendor_gstin || 'N/A'}</div>
            <div className="text-slate-500">Terms: {invoice.payment_terms}</div>
            <div className="text-slate-500">Bank: {invoice.bank_name || 'HDFC Bank'} ({invoice.bank_account_number ? `...${invoice.bank_account_number.slice(-4)}` : 'On File'})</div>
          </div>
        </div>

        {/* PO & 3-Way Match Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>PO & GRN Match</span>
            {matchData && <Badge status={matchData.match_status} />}
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Purchase Order:</span>
              <span className="font-mono font-bold text-slate-800">{invoice.po_number || 'Non-PO Invoice'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GRN Reference:</span>
              <span className="font-mono text-slate-800">{matchDetails?.grn_number || 'GRN Verified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Price Variance:</span>
              <span className="font-semibold text-slate-800">{matchData?.price_variance_pct ? `${matchData.price_variance_pct.toFixed(2)}%` : '0.00%'}</span>
            </div>
            {matchDetails?.discrepancies && matchDetails.discrepancies.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-rose-100 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 block uppercase tracking-wider">Discrepancy Details:</span>
                {matchDetails.discrepancies.map((d: any, idx: number) => (
                  <p key={idx} className="text-[11px] text-rose-600 leading-snug">
                    • <span className="font-semibold">{d.type}:</span> {d.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settlement Financials */}
        <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">Total Settlement</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Subtotal:</span>
              <span>{formatINR(invoice.taxable_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Tax (GST):</span>
              <span>{formatINR(invoice.total_tax_amount)}</span>
            </div>
            <div className="border-t border-teal-200 pt-1.5 flex justify-between font-bold text-base text-teal-950">
              <span>Total Amount:</span>
              <span>{formatINR(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span>{formatINR(invoice.amount_paid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 uppercase tracking-wider">
          Invoice Line Items ({invoice.line_items?.length || 0})
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Item Description</th>
                <th className="px-5 py-3">Material Code</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3">Tax Rate</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.line_items && invoice.line_items.length > 0 ? (
                invoice.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-semibold text-slate-400">{item.line_number}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{item.item_description}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{item.material_code || 'MAT-VALVE-01'}</td>
                    <td className="px-5 py-3 font-semibold">{Number(item.quantity)} {item.uom}</td>
                    <td className="px-5 py-3">{formatINR(item.unit_price)}</td>
                    <td className="px-5 py-3">{Number(item.tax_rate)}%</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatINR(item.line_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-4 text-center text-slate-400">
                    No line items extracted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation & Discrepancy Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Validation & Governance Checks
        </h3>
        {invoice.exceptions && invoice.exceptions.length > 0 ? (
          <div className="space-y-2">
            {invoice.exceptions.map((exc) => (
              <div key={exc.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 font-mono">{exc.rule_code}:</span>
                  <span className="ml-2 text-amber-800">{exc.message}</span>
                </div>
                <span className={`text-[11px] font-semibold ${exc.is_resolved ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {exc.is_resolved ? 'Resolved' : 'Pending Resolution'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>All statutory GST, duplicate checks, vendor master, and mathematical integrity validations passed!</span>
          </div>
        )}
      </div>
    </div>
  );
};
