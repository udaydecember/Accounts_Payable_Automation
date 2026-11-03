import React, { useState, useEffect } from 'react';
import { Sliders, Plus, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/api';
import { Modal } from '../components/common/Modal';

export const WorkflowConfigPage: React.FC = () => {
  const [matrices, setMatrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    min_amount: 0,
    max_amount: 10000,
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
      setMatrices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.addWorkflowRule(newRule);
      setIsOpen(false);
      loadMatrix();
    } catch (err: any) {
      alert(`Failed to add rule: ${err.message}`);
    }
  };

  const activeRules = matrices?.[0]?.rules || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Approval Workflow Matrix Configuration</h2>
            <p className="text-xs text-slate-500">
              Configure amount-based thresholds, role requirements, sequential and parallel approval tiers
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Approval Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Multi-Tier Rules Hierarchy
          </span>
          <span className="text-xs text-slate-500">Maker-Checker segregation automatically enforced on all tiers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Step Order</th>
                <th className="px-5 py-3">Rule Name</th>
                <th className="px-5 py-3">Amount Range</th>
                <th className="px-5 py-3">Department Target</th>
                <th className="px-5 py-3">Required Governance Role</th>
                <th className="px-5 py-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No custom rules found. Default 3-tier matrix active.
                  </td>
                </tr>
              ) : (
                activeRules.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {rule.step_order}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{rule.rule_name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-800">
                      ${Number(rule.min_amount).toLocaleString()} - {rule.max_amount ? `$${Number(rule.max_amount).toLocaleString()}` : 'Unlimited Cap'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{rule.department || 'All Departments'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {rule.required_role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {rule.is_parallel ? 'Parallel' : 'Sequential'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Workflow Matrix Rule" maxWidth="md">
        <form onSubmit={handleAddRule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rule Description *</label>
            <input
              required
              type="text"
              placeholder="e.g. Tier 4 Board / Executive Approval"
              value={newRule.rule_name}
              onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Invoiced Amount ($) *</label>
              <input
                required
                type="number"
                value={newRule.min_amount}
                onChange={(e) => setNewRule({ ...newRule, min_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Invoiced Amount ($)</label>
              <input
                type="number"
                value={newRule.max_amount}
                onChange={(e) => setNewRule({ ...newRule, max_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Step Order</label>
              <input
                type="number"
                value={newRule.step_order}
                onChange={(e) => setNewRule({ ...newRule, step_order: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required Approver Role *</label>
              <select
                value={newRule.required_role}
                onChange={(e) => setNewRule({ ...newRule, required_role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
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
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Add Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
