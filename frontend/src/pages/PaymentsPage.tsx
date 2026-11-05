import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Layers,
  ArrowRight,
  Send,
  Building,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Receipt,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../services/api';
import { PaymentRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/currency';

export const PaymentsPage: React.FC = () => {
  const [readyInvoices, setReadyInvoices] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchReady, setSearchReady] = useState('');
  const [activeAdvice, setActiveAdvice] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [directPayingId, setDirectPayingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ready, reqs] = await Promise.all([
        ApiService.getReadyPayments(),
        ApiService.getPaymentRequests()
      ]);
      setReadyInvoices(ready || []);
      setPaymentRequests(reqs || []);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load payment records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredReadyInvoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateBatch = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      await ApiService.createPaymentBatch(selectedIds);
      setSelectedIds([]);
      setFeedback({
        type: 'success',
        message: `Payment batch created successfully! ${selectedIds.length} invoice(s) dispatched to corporate banking queue.`
      });
      await loadData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Batch creation error: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const handleExecutePayment = async (requestId: string, simulateFailure = false) => {
    setProcessing(true);
    try {
      const txn = await ApiService.executePayment(requestId, simulateFailure);
      if (txn.status === 'Success') {
        setFeedback({
          type: 'success',
          message: `Payment settled via Banking Gateway! UTR: ${txn.bank_reference_number}`
        });
      } else {
        setFeedback({
          type: 'error',
          message: `Simulated Banking Failure Triggered: ${txn.failure_reason || 'Unknown error'}`
        });
      }
      await loadData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Payment execution failed: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectPay = async (invoice: any) => {
    setDirectPayingId(invoice.id);
    try {
      const req = await ApiService.createPaymentRequest(invoice.id, invoice.outstanding_amount);
      const txn = await ApiService.executePayment(req.id, false);
      setFeedback({
        type: 'success',
        message: `Direct disbursement completed for ${invoice.invoice_number}! UTR: ${txn.bank_reference_number}`
      });
      await loadData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Direct payment failed: ${err.message}` });
    } finally {
      setDirectPayingId(null);
    }
  };

  // Filter ready invoices
  const filteredReadyInvoices = readyInvoices.filter((inv) => {
    if (!searchReady) return true;
    const q = searchReady.toLowerCase();
    return (
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.vendor_name && inv.vendor_name.toLowerCase().includes(q))
    );
  });

  // KPI calculations
  const totalReadyAmount = readyInvoices.reduce((sum, inv) => sum + (Number(inv.outstanding_amount) || 0), 0);
  const totalPaidRequests = paymentRequests.filter((r) => r.status === 'Paid');
  const totalSettledAmount = totalPaidRequests.reduce((sum, r) => sum + (Number(r.requested_amount) || 0), 0);
  const totalSelectedAmount = readyInvoices
    .filter((inv) => selectedIds.includes(inv.id))
    .reduce((sum, inv) => sum + (Number(inv.outstanding_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              Treasury & Banking Settlement Desk
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Payment Operations & Remittance</h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-2xl">
              Process approved payment-ready vouchers, group invoices into corporate batches, execute bank transfers, and generate official payment advice.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBatch}
              disabled={selectedIds.length === 0 || processing}
              className="px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 disabled:opacity-50 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Create Payment Batch ({selectedIds.length})</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
              title="Refresh Payment Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ready for Payout</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{formatINR(totalReadyAmount)}</span>
            <span className="text-[11px] text-teal-700 font-medium">{readyInvoices.length} invoices approved</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Selected in Batch</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{formatINR(totalSelectedAmount)}</span>
            <span className="text-[11px] text-blue-700 font-medium">{selectedIds.length} items flagged</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Disbursed</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{formatINR(totalSettledAmount)}</span>
            <span className="text-[11px] text-emerald-700 font-medium">{totalPaidRequests.length} settled runs</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Settlement Channel</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">NEFT / RTGS Corporate</span>
            <span className="text-[11px] text-purple-700 font-medium">Auto-TDS 2.0% calculated</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Section 1: Ready for Payment Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">
              Ready for Payment Queue ({readyInvoices.length})
            </h2>
            <span className="text-xs text-slate-500">· Fully approved and pending remittance</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice or vendor..."
                value={searchReady}
                onChange={(e) => setSearchReady(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800 w-56"
              />
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={handleCreateBatch}
                disabled={processing}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Batch ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredReadyInvoices.length > 0 &&
                      selectedIds.length === filteredReadyInvoices.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3">Invoice Number</th>
                <th className="px-5 py-3">Vendor Name</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Outstanding Amount</th>
                <th className="px-5 py-3">Approval Status</th>
                <th className="px-5 py-3 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading ready-for-payment queue...
                  </td>
                </tr>
              ) : filteredReadyInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No approved invoices waiting for settlement. Invoices appear here once approved by all tiers.
                  </td>
                </tr>
              ) : (
                filteredReadyInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      selectedIds.includes(inv.id) ? 'bg-teal-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                      {inv.invoice_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {inv.vendor_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {inv.due_date || 'Due on Receipt'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatINR(inv.outstanding_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDirectPay(inv)}
                        disabled={directPayingId === inv.id || processing}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {directPayingId === inv.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Paying...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Direct Pay
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Dispatched Payment Requests & Settlements */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Dispatched Payment Requests & Settlements ({paymentRequests.length})
            </h2>
            <p className="text-xs text-slate-500">Corporate banking integration simulation & disbursement ledger</p>
          </div>
          <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-150">
            Automated Settlement Engine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Request Number</th>
                <th className="px-5 py-3">Disbursed Amount</th>
                <th className="px-5 py-3">Channel / Method</th>
                <th className="px-5 py-3">Dispatch Date</th>
                <th className="px-5 py-3">Settlement Status</th>
                <th className="px-5 py-3 text-right">Bank Execution / Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading dispatched payment records...
                  </td>
                </tr>
              ) : paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No payment requests dispatched yet. Group invoices into a batch or use Direct Pay above.
                  </td>
                </tr>
              ) : (
                paymentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      {req.request_number}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatINR(req.requested_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {req.payment_method || 'NEFT'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {req.requested_at?.substring(0, 10) || 'Today'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {req.status === 'Paid' ? (
                        <button
                          onClick={() => setActiveAdvice(req.advice || req)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Advice Voucher
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleExecutePayment(req.id, false)}
                            disabled={processing}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Execute Bank Pay
                          </button>
                          <button
                            onClick={() => handleExecutePayment(req.id, true)}
                            disabled={processing}
                            title="Test failure rollback simulation"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Simulate Fail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Advice Modal */}
      <Modal
        isOpen={!!activeAdvice}
        onClose={() => setActiveAdvice(null)}
        title="Official Payment Advice Voucher"
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs text-slate-800">
          {/* Voucher Header */}
          <div className="p-4 bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 border border-teal-100 rounded-xl flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  AP
                </div>
                <h4 className="font-bold text-slate-900 text-sm">CORPORATE PAYMENT ADVICE</h4>
              </div>
              <p className="text-slate-500 text-[11px]">Templegate Accounts Payable Automation • Treasury Remittance Desk</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-teal-800 text-xs block">
                {activeAdvice?.advice_number || 'ADV-20261105-001'}
              </span>
              <span className="text-slate-400 text-[10px]">
                Date: {activeAdvice?.payment_date || new Date().toISOString().substring(0, 10)}
              </span>
            </div>
          </div>

          {/* Reference Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Bank Reference / UTR Number</span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {activeAdvice?.bank_ref_no || activeAdvice?.bank_reference_number || 'UTR20261105889922'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Settlement Gateway</span>
              <span className="font-bold text-slate-900">HDFC Corporate NEFT / RTGS</span>
            </div>
          </div>

          {/* Ledger Breakdown */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
            <div className="flex justify-between items-center text-slate-700">
              <span>Gross Invoiced Amount:</span>
              <span className="font-bold text-slate-900">
                {formatINR(activeAdvice?.total_gross_amount || activeAdvice?.requested_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-amber-700">
              <span className="flex items-center gap-1">
                <span>Statutory TDS Deduction (Sec 194C @ 2.0%):</span>
              </span>
              <span className="font-semibold">
                -{formatINR(activeAdvice?.tax_deducted_tds || 0)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center font-bold text-sm text-teal-800">
              <span>Net Remitted / Settled Amount:</span>
              <span className="text-base text-teal-900">
                {formatINR(activeAdvice?.net_paid_amount || activeAdvice?.requested_amount)}
              </span>
            </div>
          </div>

          {/* Compliance Stamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified & digitally signed by AP Automated Treasury Desk
            </span>
            <span className="font-mono text-[10px] text-slate-400">Ref: SHA256-VOUCHER-STAMP</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveAdvice(null)}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Print / Download Voucher
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
