import React, { useState, useEffect } from 'react';
import { GitCompare, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Layers, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { POMatch } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const MatchingPage: React.FC = () => {
  const [matches, setMatches] = useState<POMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<POMatch | null>(null);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getMatches();
      setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setOverriding(true);
    try {
      await ApiService.overrideMatch(selectedMatch.id, overrideNotes);
      setSelectedMatch(null);
      setOverrideNotes('');
      loadMatches();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-50/80 via-blue-50/60 to-purple-50/70 border border-teal-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 via-blue-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <GitCompare className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              2-Way & 3-Way PO / GRN Reconciliation Engine
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Line-by-line automated verification linking Vendor Invoices, Purchase Orders, and Goods Receipt Notes
            </p>
          </div>
        </div>

        <button
          onClick={loadMatches}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
          Refresh Matches
        </button>
      </div>

      {/* Tolerance Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price Tolerance</span>
            <span className="text-lg font-black text-slate-900 block">2.0% Variance</span>
            <span className="text-[10px] text-teal-700 font-semibold">Allowable threshold</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity Tolerance</span>
            <span className="text-lg font-black text-slate-900 block">0.0% Overage</span>
            <span className="text-[10px] text-purple-700 font-semibold">Strict GRN verification</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matching Policy</span>
            <span className="text-lg font-black text-slate-900 block">3-Way Enforced</span>
            <span className="text-[10px] text-blue-700 font-semibold">Invoice ↔ PO ↔ GRN</span>
          </div>
        </div>
      </div>

      {/* Matching Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Reconciliation Records ({matches.length})
          </h3>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Auto-Gate Check
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice ID / Match Type</th>
                <th className="px-5 py-3.5">PO Reference</th>
                <th className="px-5 py-3.5">GRN Reference</th>
                <th className="px-5 py-3.5">Price & Qty Variance</th>
                <th className="px-5 py-3.5">Match Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Calculating 3-way matching reconciliations...
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No matching records found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Upload invoices linked to PO numbers to execute automatic 3-way reconciliation.</p>
                  </td>
                </tr>
              ) : (
                matches.map((m) => {
                  let details: any = {};
                  try {
                    details = m.discrepancy_details ? JSON.parse(m.discrepancy_details) : {};
                  } catch {}

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {m.invoice_id.substring(0, 13)}...
                        <div className="text-[10px] text-teal-700 font-bold">
                          {m.match_type?.replace('_', ' ')} Match
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {details.po_number || m.po_id?.substring(0, 8) || <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {details.grn_number || m.grn_id?.substring(0, 8) || <span className="text-slate-400 italic">No GRN</span>}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-900 font-bold">
                          Price Var: {m.price_variance_pct ? m.price_variance_pct.toFixed(2) : '0.00'}%
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Qty Var: {m.quantity_variance || 0} units
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge status={m.match_status} />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {m.match_status === 'Mismatched' || m.match_status === 'Missing_PO' ? (
                          <button
                            onClick={() => {
                              setSelectedMatch(m);
                              setOverrideNotes('');
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                          >
                            Authorize Override
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      <Modal isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} title="Authorize Matching Discrepancy" maxWidth="md">
        <form onSubmit={handleOverride} className="space-y-4">
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold">Manager Override Authority:</span>
            <p className="text-amber-800 leading-relaxed">
              Authorizing this discrepancy clears the 3-way matching gate and transitions the invoice to the multi-tier approval matrix.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Discrepancy Justification & Change Order Ref *
            </label>
            <textarea
              required
              rows={3}
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              placeholder="e.g. Price variance of 4.2% within negotiated emergency freight amendment #8801-A."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={overriding || !overrideNotes.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {overriding ? 'Authorizing...' : 'Authorize Variance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
