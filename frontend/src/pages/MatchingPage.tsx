import React, { useState, useEffect } from 'react';
import { GitCompare, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
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
      alert(`Override failed: ₹{err.message}`);
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">2-Way & 3-Way Matching Engine</h2>
            <p className="text-xs text-slate-500">
              Automated reconciliation between Purchase Orders (PO), Goods Receipt Notes (GRN), and Supplier Invoices
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Tolerance Config: <span className="text-teal-600">2.0% Price Variance • 0% Qty Overage</span>
        </div>
      </div>

      {/* Matching Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Invoice ID / Match Type</th>
                <th className="px-5 py-3">PO Reference</th>
                <th className="px-5 py-3">GRN Reference</th>
                <th className="px-5 py-3">Price / Qty Variance</th>
                <th className="px-5 py-3">Match Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading matching results...
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No matching records found. Upload invoices linked to POs to trigger automatic matching.
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
                        <div className="text-[10px] text-teal-600 font-medium">
                          {m.match_type.replace('_', ' ')} Match
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-800">
                        {details.po_number || m.po_id?.substring(0, 8) || <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-800">
                        {details.grn_number || m.grn_id?.substring(0, 8) || <span className="text-slate-400 italic">No GRN</span>}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-900 font-semibold">
                          Price Var: {m.price_variance_pct.toFixed(2)}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Qty Var: {m.quantity_variance} units
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
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
                          >
                            Authorize Override
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center justify-end gap-1">
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
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
            <span className="font-bold">Manager Override Authority:</span>
            <p className="mt-1">
              Authorizing this variance will clear the matching gate and allow the invoice to proceed to the Approval Matrix.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discrepancy Justification & PO Change Order Ref *
            </label>
            <textarea
              required
              rows={3}
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              placeholder="e.g. Price variance of 4.2% within negotiated emergency freight amendment #8801-A."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={overriding || !overrideNotes.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {overriding ? 'Authorizing...' : 'Authorize Variance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
