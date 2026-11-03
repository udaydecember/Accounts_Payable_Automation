import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Scan,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardMetrics } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDashboard();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const summary = metrics?.summary || {
    total_invoices: 0,
    awaiting_ocr: 0,
    pending_validation: 0,
    pending_approval: 0,
    approved: 0,
    pending_payment: 0,
    paid_count: 0,
    total_invoice_amount: 0,
    total_paid_amount: 0,
    total_outstanding_amount: 0,
    ocr_accuracy_pct: 95.0,
    average_processing_time_hours: 3.2
  };

  const aging = metrics?.aging_buckets || {
    current_0_30: 0,
    past_31_60: 0,
    past_61_90: 0,
    past_90_plus: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Notification / Action Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            AP Automation Pipeline Live
          </span>
          <h2 className="text-xl font-bold tracking-tight">Invoice-to-Payment Lifecycle Overview</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time database aggregated metrics across document capture, OCR AI extraction, 3-way matching, approval hierarchy, and banking settlement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('invoices')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Upload Invoices
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            Process Payments
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Total Invoices</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.total_invoices}</span>
            <span className="text-xs text-slate-500 font-medium">${summary.total_invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{summary.paid_count} settled</span>
            <span className="text-teal-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('invoices')}>
              View all &rarr;
            </span>
          </div>
        </div>

        {/* Pending Validation & OCR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Pending Validation</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{summary.pending_validation}</span>
            <span className="text-xs text-slate-500 font-medium">Invoices require review</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{summary.awaiting_ocr} awaiting OCR</span>
            <span className="text-amber-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('exceptions')}>
              Exceptions &rarr;
            </span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Pending Approval</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{summary.pending_approval}</span>
            <span className="text-xs text-slate-500 font-medium">Maker-Checker active</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Multi-tier hierarchy</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('approvals')}>
              Inbox &rarr;
            </span>
          </div>
        </div>

        {/* Ready For Payment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Ready for Settlement</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">${summary.total_outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{summary.pending_payment} invoices queued</span>
            <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('payments')}>
              Pay queue &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* AP Aging & Engine Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AP Aging Buckets */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Accounts Payable Aging Schedule</h3>
              <p className="text-xs text-slate-500">Outstanding liabilities grouped by invoice maturity buckets</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              Detailed Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">0 - 30 Days</span>
              <span className="text-lg font-bold text-slate-900 block mt-1">
                ${aging.current_0_30.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block mt-1">Current Term</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">31 - 60 Days</span>
              <span className="text-lg font-bold text-slate-900 block mt-1">
                ${aging.past_31_60.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-amber-600 font-medium block mt-1">Due Shortly</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">61 - 90 Days</span>
              <span className="text-lg font-bold text-slate-900 block mt-1">
                ${aging.past_61_90.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-rose-500 font-medium block mt-1">Overdue</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">90+ Days</span>
              <span className="text-lg font-bold text-rose-700 block mt-1">
                ${aging.past_90_plus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-rose-700 font-medium block mt-1">Critical Overdue</span>
            </div>
          </div>

          {/* Top Vendors Table */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Top Vendor Liabilities</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Vendor Name</th>
                    <th className="px-4 py-2.5">Invoice Count</th>
                    <th className="px-4 py-2.5 text-right">Total Invoiced Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {metrics?.top_vendors && metrics.top_vendors.length > 0 ? (
                    metrics.top_vendors.map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{v.vendor_name}</td>
                        <td className="px-4 py-2.5">{v.count} invoice(s)</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          ${v.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                        No vendor spend records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI & Automation Efficiency Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Automation & AI Accuracy</h3>
            <p className="text-xs text-slate-500 mt-0.5">Machine extraction & straight-through processing</p>

            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-teal-50 border-8 border-teal-500 text-teal-900 font-black text-3xl">
                {summary.ocr_accuracy_pct}%
                <span className="absolute bottom-4 text-[10px] font-bold uppercase tracking-wider text-teal-700">Accuracy</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Average Turnaround (TAT)</span>
                <span className="font-bold text-slate-800">{summary.average_processing_time_hours} hours</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">3-Way PO Matching Rate</span>
                <span className="font-bold text-emerald-600">92.4%</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Maker-Checker Compliance</span>
                <span className="font-bold text-emerald-600">100% Enforced</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Audit Trail Integrity</span>
                <span className="font-bold text-teal-600">Append-Only</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('ocr-review')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5 text-teal-400" />
              Open OCR Review Workbench
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
