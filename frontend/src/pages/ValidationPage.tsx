import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 shadow-2xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold">Configurable Invoice Validation & Exception Engine</h3>
          <p className="text-xs text-amber-800 mt-1">
            Critical exceptions block invoice approval and prevent duplicate payment processing. Authorized AP Managers can review and resolve exceptions with justification notes.
          </p>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Rule Code</th>
                <th className="px-5 py-3">Description & Error Detail</th>
                <th className="px-5 py-3">Suggested Action</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading exceptions...
                  </td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No active validation exceptions found. All processed invoices passed validation checks.
                  </td>
                </tr>
              ) : (
                exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          exc.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {exc.severity}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                      {exc.rule_code}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-md">
                      {exc.message}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 text-[11px] max-w-xs">
                      {exc.suggested_action || 'Review supporting records.'}
                    </td>

                    <td className="px-5 py-3.5">
                      {exc.is_resolved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
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
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
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
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="font-bold text-slate-800">{activeException?.rule_code}</div>
            <p className="text-slate-600 mt-1">{activeException?.message}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Justification & Audit Comments *
            </label>
            <textarea
              required
              rows={3}
              value={resolutionComment}
              onChange={(e) => setResolutionComment(e.target.value)}
              placeholder="e.g. Verified revised purchase amendment with procurement lead; variance accepted."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveException(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving || !resolutionComment.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {resolving ? 'Submitting...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
