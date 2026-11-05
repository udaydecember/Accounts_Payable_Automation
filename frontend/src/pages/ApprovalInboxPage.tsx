import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, XCircle, AlertCircle, MessageSquare, ShieldAlert, FileText, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/api';
import { ApprovalInstance, Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/currency';

interface ApprovalInboxProps {
  onSelectInvoice: (id: string) => void;
}

export const ApprovalInboxPage: React.FC<ApprovalInboxProps> = ({ onSelectInvoice }) => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<ApprovalInstance[]>([]);
  const [invoicesMap, setInvoicesMap] = useState<Record<string, Invoice>>({});
  const [loading, setLoading] = useState(true);
  const [activeActionInstance, setActiveActionInstance] = useState<ApprovalInstance | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Request_Changes'>('Approve');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadInbox();
  }, [user]);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const [inboxData, invoicesList] = await Promise.all([
        ApiService.getApprovalInbox(),
        ApiService.getInvoices()
      ]);
      setInstances(inboxData);

      const map: Record<string, Invoice> = {};
      invoicesList.forEach((inv) => {
        map[inv.id] = inv;
      });
      setInvoicesMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionInstance) return;
    setSubmitting(true);
    try {
      await ApiService.executeApprovalAction(activeActionInstance.invoice_id, actionType, comments);
      setActiveActionInstance(null);
      setComments('');
      setFeedback(`Invoice decision recorded: ${actionType.replace('_', ' ')}.`);
      loadInbox();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maker-Checker Rule Notice */}
      <div className="bg-gradient-to-r from-blue-50/90 via-teal-50/60 to-purple-50/70 border border-blue-200/80 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-700 border border-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              Maker-Checker Segregation of Duties Enforced
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Under statutory internal control regulations, invoice uploaders/makers cannot approve their own invoices. Approvals must be executed independently by authorized reviewers.
            </p>
          </div>
        </div>
        <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs text-xs shrink-0">
          <span className="text-slate-400 font-bold block text-[10px] uppercase">Active Session Persona</span>
          <span className="text-teal-800 font-extrabold uppercase">{user?.roles?.[0]?.display_name || 'Admin'}</span>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{feedback}</span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center text-slate-400 shadow-xs">
            <div className="w-7 h-7 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Querying pending approval inbox from PostgreSQL...
          </div>
        ) : instances.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center text-slate-400 shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-black text-slate-900 text-base">Inbox Zero!</p>
            <p className="text-xs text-slate-500 mt-1">All invoices assigned to your reviewer role have been processed.</p>
          </div>
        ) : (
          instances.map((inst) => {
            const invoice = invoicesMap[inst.invoice_id];
            const isCreator = invoice && invoice.uploader_id === user?.id;
            const currentStep = inst.steps?.find((s) => s.step_order === inst.current_step_order);

            return (
              <div
                key={inst.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:border-teal-300"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-black text-slate-900 text-base">
                        {invoice?.invoice_number || inst.invoice_id.substring(0, 10)}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {currentStep?.step_name || 'Approval Step'}
                      </span>
                      {isCreator && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          Maker-Checker Guard: Creator cannot approve
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Vendor: <span className="font-bold text-slate-800">{invoice?.vendor?.vendor_name || invoice?.vendor_name_raw || 'Vendor'}</span> • PO: <span className="font-mono font-semibold text-slate-700">{invoice?.po_number || 'None'}</span> • Dept: {invoice?.department || 'Finance'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900">
                      {formatINR(invoice?.total_amount)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">
                      Due: {invoice?.due_date || invoice?.invoice_date || 'Net 30'}
                    </div>
                  </div>
                </div>

                {/* Step Hierarchy Progress */}
                <div className="py-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Multi-Level Approval Matrix Progress:
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {inst.steps?.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                              step.status === 'Approved'
                                ? 'bg-emerald-500 text-white'
                                : step.status === 'Pending'
                                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white ring-4 ring-blue-100'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {step.step_order}
                          </span>
                          <span className="font-semibold text-slate-800">{step.step_name}</span>
                        </div>
                        {idx < inst.steps.length - 1 && <span className="text-slate-300 font-bold">&rarr;</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectInvoice(inst.invoice_id)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Document & Validation Results &rarr;
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveActionInstance(inst);
                        setActionType('Request_Changes');
                        setComments('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Request Changes
                    </button>

                    <button
                      onClick={() => {
                        setActiveActionInstance(inst);
                        setActionType('Reject');
                        setComments('');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>

                    <button
                      disabled={isCreator}
                      onClick={() => {
                        setActiveActionInstance(inst);
                        setActionType('Approve');
                        setComments('');
                      }}
                      title={isCreator ? 'Maker-Checker Violation: You cannot approve your own invoice' : 'Approve invoice'}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Approve Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!activeActionInstance}
        onClose={() => setActiveActionInstance(null)}
        title={`Confirm Decision: ${actionType.replace('_', ' ')}`}
        maxWidth="md"
      >
        <form onSubmit={handleAction} className="space-y-4">
          <p className="text-xs text-slate-600">
            You are recording a formal governance decision for invoice ID{' '}
            <span className="font-bold text-slate-900">{activeActionInstance?.invoice_id}</span>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reviewer Audit Notes {actionType !== 'Approve' && '*'}
            </label>
            <textarea
              required={actionType !== 'Approve'}
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Invoiced quantity matches signed warehouse receipt. Approved for payment."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveActionInstance(null)}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 font-bold text-xs rounded-xl text-white shadow-xs transition-all cursor-pointer ${
                actionType === 'Approve'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  : actionType === 'Reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Executing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
