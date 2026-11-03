import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, FileText, Download, DollarSign, Layers } from 'lucide-react';
import { ApiService } from '../services/api';
import { PaymentRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const PaymentsPage: React.FC = () => {
  const [readyInvoices, setReadyInvoices] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAdvice, setActiveAdvice] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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
      setReadyInvoices(ready);
      setPaymentRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(readyInvoices.map((i) => i.id));
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
      setFeedback('Payment batch created! Payment requests dispatched to banking queue.');
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Batch creation error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExecutePayment = async (requestId: string, simulateFailure = false) => {
    setProcessing(true);
    try {
      const txn = await ApiService.executePayment(requestId, simulateFailure);
      if (txn.status === 'Success') {
        setFeedback(`Payment executed via Mock Banking Gateway! UTR: ${txn.bank_reference_number}`);
      } else {
        alert(`Simulated Failure Triggered: ${txn.failure_reason}`);
      }
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Payment execution failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Management & Banking Settlement</h2>
            <p className="text-xs text-slate-500">
              Approved, payment-ready invoices queued for payment requests, batching, and advice voucher generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateBatch}
            disabled={selectedIds.length === 0 || processing}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Create Payment Batch ({selectedIds.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Ready for Payment Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ready for Payment Queue ({readyInvoices.length})
          </span>
          <span className="text-xs text-slate-500">Select invoices to group into a payment run</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === readyInvoices.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Outstanding Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {readyInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    No approved invoices currently waiting for payment. Invoices enter here only after full approval.
                  </td>
                </tr>
              ) : (
                readyInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{inv.vendor_name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.due_date}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={async () => {
                          const req = await ApiService.createPaymentRequest(inv.id, inv.outstanding_amount);
                          handleExecutePayment(req.id, false);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
                      >
                        Direct Pay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatched Payment Requests & Advice */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dispatched Payment Requests & Settlements ({paymentRequests.length})
          </span>
          <span className="text-xs text-slate-500">Corporate banking integration simulation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Request Number</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Dispatched Date</th>
                <th className="px-5 py-3">Settlement Status</th>
                <th className="px-5 py-3 text-right">Bank Execution / Advice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                    No payment requests dispatched yet.
                  </td>
                </tr>
              ) : (
                paymentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{req.request_number}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {req.currency} {Number(req.requested_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.payment_method}</td>
                    <td className="px-5 py-3.5 text-slate-500">{req.requested_at?.substring(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {req.status === 'Paid' ? (
                        <button
                          onClick={() => setActiveAdvice(req.advice || req)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs rounded-md transition-colors cursor-pointer"
                        >
                          View Payment Advice
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleExecutePayment(req.id, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
                          >
                            Execute
                          </button>
                          <button
                            onClick={() => handleExecutePayment(req.id, true)}
                            title="Test failure rollback simulation"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-md transition-colors cursor-pointer"
                          >
                            Simulate Fail
                          </button>
                        </>
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
      <Modal isOpen={!!activeAdvice} onClose={() => setActiveAdvice(null)} title="Official Payment Advice Voucher" maxWidth="lg">
        <div className="space-y-4 font-mono text-xs text-slate-800">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">PAYMENT ADVICE VOUCHER</h4>
              <p className="text-slate-500 text-[11px]">Apex Enterprise Treasury Settlement Desk</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-teal-700">{activeAdvice?.advice_number || 'ADV-20261102-001'}</span>
              <p className="text-slate-400 text-[10px]">Date: {activeAdvice?.payment_date || '2026-11-02'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Bank Reference / UTR</span>
              <span className="font-bold text-slate-900">{activeAdvice?.bank_ref_no || 'UTR2026110298765432'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Settlement Channel</span>
              <span className="font-bold text-slate-900">NEFT / RTGS Corporate Gateway</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span>Gross Invoiced Amount:</span>
              <span className="font-bold">${Number(activeAdvice?.total_gross_amount || activeAdvice?.requested_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>Statutory TDS Deduction (2.0%):</span>
              <span>-${Number(activeAdvice?.tax_deducted_tds || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-teal-800">
              <span>Net Settled Amount:</span>
              <span>${Number(activeAdvice?.net_paid_amount || activeAdvice?.requested_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Print / Download Voucher
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
