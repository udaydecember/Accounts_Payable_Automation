import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  GitBranch,
  Layers,
  Scale,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/currency';

export const WorkflowConfigPage: React.FC = () => {
  const [matrices, setMatrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newRule, setNewRule] = useState({
    rule_name: '',
    min_amount: 0,
    max_amount: 50000,
    department: '',
    step_order: 1,
    required_role: 'approver',
    is_parallel: false
  });

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getWorkflowMatrix();
      setMatrices(data || []);
    } catch (err) {
      console.error(err);
      setMatrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.addWorkflowRule(newRule);
      setIsOpen(false);
      setFeedback('New governance rule appended to approval matrix!');
      await loadMatrix();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Failed to add rule: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRules = matrices?.[0]?.rules || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-1">
              <Sliders className="w-3.5 h-3.5" />
              Corporate Governance Matrix
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Approval Workflow Matrix Configuration</h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-2xl">
              Configure amount-based financial thresholds, role authorizations, sequential and parallel approval tiers with automated Maker-Checker validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Add Approval Rule</span>
            </button>
            <button
              onClick={loadMatrix}
              disabled={loading}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
              title="Refresh Matrix"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Configured Tiers</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{activeRules.length} Tiers</span>
            <span className="text-[11px] text-teal-700 font-medium">Sequential matrix active</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Maker-Checker</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">Strictly Enforced</span>
            <span className="text-[11px] text-emerald-700 font-medium">Uploader cannot approve</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Max Approval Cap</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">₹5,00,000+</span>
            <span className="text-[11px] text-blue-700 font-medium">Board / CFO Escalation</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Matrix Routing</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">Dynamic Auto-Route</span>
            <span className="text-[11px] text-purple-700 font-medium">By value & department</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Active Multi-Tier Rules Hierarchy ({activeRules.length})
            </h2>
            <p className="text-xs text-slate-500">
              Maker-Checker segregation of duties automatically verified on every stage transition
            </p>
          </div>
          <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-150">
            SOX & Statutory Governance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Step Order</th>
                <th className="px-5 py-3.5">Rule / Tier Name</th>
                <th className="px-5 py-3.5">Threshold Amount Range</th>
                <th className="px-5 py-3.5">Department Target</th>
                <th className="px-5 py-3.5">Required Role Authorization</th>
                <th className="px-5 py-3.5">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading approval workflow rules...
                  </td>
                </tr>
              ) : activeRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Sliders className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No custom rules found. Default 3-tier matrix active.
                  </td>
                </tr>
              ) : (
                activeRules.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="w-7 h-7 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {rule.step_order}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{rule.rule_name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-800">
                      {formatINR(rule.min_amount)} – {rule.max_amount ? formatINR(rule.max_amount) : 'Unlimited Cap'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {rule.department || 'All Departments'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                        {rule.required_role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {rule.is_parallel ? 'Parallel' : 'Sequential'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Workflow Matrix Rule"
        maxWidth="md"
      >
        <form onSubmit={handleAddRule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rule / Tier Description *</label>
            <input
              required
              type="text"
              placeholder="e.g. Tier 4 Executive / CFO Sign-off"
              value={newRule.rule_name}
              onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Invoiced Amount (₹) *</label>
              <input
                required
                type="number"
                value={newRule.min_amount}
                onChange={(e) => setNewRule({ ...newRule, min_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Invoiced Amount (₹)</label>
              <input
                type="number"
                value={newRule.max_amount}
                onChange={(e) => setNewRule({ ...newRule, max_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Step Order</label>
              <input
                type="number"
                value={newRule.step_order}
                onChange={(e) => setNewRule({ ...newRule, step_order: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required Approver Role *</label>
              <select
                value={newRule.required_role}
                onChange={(e) => setNewRule({ ...newRule, required_role: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              >
                <option value="ap_manager">AP Manager</option>
                <option value="approver">Department Approver</option>
                <option value="finance_executive">Finance Executive</option>
                <option value="admin">System Admin / CFO</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
