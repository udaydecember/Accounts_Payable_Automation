import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, FileText, ArrowRight, ShieldCheck, AlertCircle, Filter } from 'lucide-react';
import { ApiService } from '../services/api';
import { InvoiceException } from '../types';
import { Modal } from '../components/common/Modal';

interface ValidationPageProps {
  onSelectInvoice: (id: string) => void;
}

export const ValidationPage: React.FC<ValidationPageProps> = ({ onSelectInvoice }) => {
  const [exceptions, setExceptions] = useState<InvoiceException[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeException, setActiveException] = useState<InvoiceException | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolving, setResolving] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getExceptions();
      setExceptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeException) return;
    setResolving(true);
    try {
      await ApiService.resolveException(activeException.id, resolutionComment);
      setActiveException(null);
      setResolutionComment('');
      loadExceptions();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const criticalCount = exceptions.filter((e) => e.severity === 'Critical' && !e.is_resolved).length;
  const warningCount = exceptions.filter((e) => e.severity !== 'Critical' && !e.is_resolved).length;
  const resolvedCount = exceptions.filter((e) => e.is_resolved).length;

  const filtered = filterSeverity
    ? exceptions.filter((e) => e.severity?.toLowerCase() === filterSeverity.toLowerCase())
    : exceptions;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-purple-50/60 border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-slate-800 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Invoice Validation & Exception Governance Hub
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Automated business rules prevent statutory non-compliance, duplicate payment attempts, and unverified vendor disbursements. Authorized AP Managers can review and resolve exceptions with mandatory audit comments.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Critical Blockers</span>
          <span className="text-2xl font-black text-rose-600 block mt-1">{criticalCount}</span>
          <span className="text-[10px] font-semibold text-rose-700">Blocks payment until resolved</span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Warnings & Variances</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">{warningCount}</span>
          <span className="text-[10px] font-semibold text-amber-700">Requires manager review</span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Exceptions</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{resolvedCount}</span>
          <span className="text-[10px] font-semibold text-emerald-700">Audit trail logged</span>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Exceptions Repository ({filtered.length})
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Rule Code</th>
                <th className="px-5 py-3.5">Description & Error Detail</th>
                <th className="px-5 py-3.5">Suggested Action</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Querying validation exceptions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No active validation exceptions found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">All invoices passed statutory GST and 3-way matching rules.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          exc.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {exc.severity}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {exc.rule_code}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-md">
                      {exc.message}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 text-[11px] max-w-xs font-normal">
                      {exc.suggested_action || 'Review supporting records.'}
                    </td>

                    <td className="px-5 py-3.5">
                      {exc.is_resolved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Unresolved
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {!exc.is_resolved ? (
                        <button
                          onClick={() => {
                            setActiveException(exc);
                            setResolutionComment('');
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {exc.resolution_comments || 'Approved by Manager'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Exception Modal */}
      <Modal
        isOpen={!!activeException}
        onClose={() => setActiveException(null)}
        title="Resolve Validation Exception"
        maxWidth="md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">{activeException?.rule_code}</div>
            <p className="text-slate-600">{activeException?.message}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Resolution Justification & Audit Comments *
            </label>
            <textarea
              required
              rows={3}
              value={resolutionComment}
              onChange={(e) => setResolutionComment(e.target.value)}
              placeholder="e.g. Verified revised purchase order amendment; variance accepted by AP Manager."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveException(null)}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving || !resolutionComment.trim()}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {resolving ? 'Submitting...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
