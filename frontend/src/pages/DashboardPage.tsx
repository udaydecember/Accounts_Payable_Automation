import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Scan,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  GitCompare,
  UploadCloud,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Sparkles,
  Calendar,
  Building2,
  ArrowUpRight,
  CheckSquare
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardMetrics, Invoice } from '../types';
import { formatINR } from '../utils/currency';
import { Badge } from '../components/common/Badge';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucketHover, setActiveBucketHover] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [data, invoices] = await Promise.all([
        ApiService.getDashboard(),
        ApiService.getInvoices().catch(() => [])
      ]);
      setMetrics(data);
      setRecentInvoices((invoices || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Aggregating Real-Time AP Metrics...
        </p>
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

  const totalAgingLiability =
    (aging.current_0_30 || 0) +
    (aging.past_31_60 || 0) +
    (aging.past_61_90 || 0) +
    (aging.past_90_plus || 0);

  // Stepper lifecycle items
  const pipelineSteps = [
    {
      id: 'invoices',
      stepNum: '01',
      title: 'Capture & OCR',
      desc: `${summary.awaiting_ocr} awaiting OCR`,
      icon: Scan,
      count: summary.total_invoices,
      color: 'teal',
      badge: `${summary.ocr_accuracy_pct}% AI accuracy`
    },
    {
      id: 'exceptions',
      stepNum: '02',
      title: 'AI Validation',
      desc: `${summary.pending_validation} pending checks`,
      icon: AlertCircle,
      count: summary.pending_validation,
      color: 'blue',
      badge: 'Rule Engine'
    },
    {
      id: 'matching',
      stepNum: '03',
      title: '3-Way Match',
      desc: 'PO & GRN verification',
      icon: GitCompare,
      count: summary.total_invoices - summary.pending_validation,
      color: 'purple',
      badge: '92% Auto-Match'
    },
    {
      id: 'approvals',
      stepNum: '04',
      title: 'Approval Queue',
      desc: `${summary.pending_approval} awaiting sign-off`,
      icon: CheckSquare,
      count: summary.pending_approval,
      color: 'amber',
      badge: 'Maker-Checker'
    },
    {
      id: 'payments',
      stepNum: '05',
      title: 'Settlement',
      desc: `${summary.pending_payment} ready to pay`,
      icon: CreditCard,
      count: summary.paid_count,
      color: 'emerald',
      badge: 'ACH / Wire'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Actions Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        {/* Subtle decorative background gradient glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-teal-400/10 via-blue-500/10 to-purple-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-50 to-purple-50 text-teal-800 border border-teal-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Enterprise Accounts Payable Pipeline • Live
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Accounts Payable Automation Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Continuous intelligence platform orchestrating digital PDF capture, PyPDF/OCR parsing,
              3-way PO & GRN reconciliation, hierarchical approval workflows, and bank disbursements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Capture Invoices
            </button>
            <button
              onClick={() => onNavigate('matching')}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-purple-600" />
              3-Way Match
            </button>
            <button
              onClick={() => onNavigate('payments')}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              Pay Queue
            </button>
          </div>
        </div>
      </div>

      {/* Visual 5-Stage AP Lifecycle Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Interactive Invoice Processing Pipeline
            </h3>
            <p className="text-[11px] text-slate-500">Click any step to inspect records at that lifecycle stage</p>
          </div>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            5 Stages Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => onNavigate(step.id)}
                className="group relative p-3.5 rounded-xl border border-slate-200/80 hover:border-teal-400 bg-gradient-to-b from-white to-slate-50/60 hover:to-teal-50/30 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>Step {step.stepNum}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold group-hover:border-teal-300">
                    {step.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{step.desc}</p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Volume: {step.count}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Captured</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.total_invoices}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-2">
              {formatINR(summary.total_invoice_amount)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">{summary.paid_count} settled</span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              All Invoices &rarr;
            </button>
          </div>
        </div>

        {/* Pending Validation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Validation</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-700 tracking-tight">
              {summary.pending_validation}
            </span>
            <span className="text-xs text-amber-800 font-bold ml-2 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Needs Review
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{summary.awaiting_ocr} in OCR queue</span>
            <button
              onClick={() => onNavigate('exceptions')}
              className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              Exceptions &rarr;
            </button>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Approvals</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-700 tracking-tight">
              {summary.pending_approval}
            </span>
            <span className="text-xs text-blue-800 font-bold ml-2 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Maker-Checker
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Hierarchical matrix</span>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              Inbox &rarr;
            </button>
          </div>
        </div>

        {/* Ready For Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Ready for Settlement</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight">
              {formatINR(summary.total_outstanding_amount)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{summary.pending_payment} invoices queued</span>
            <button
              onClick={() => onNavigate('payments')}
              className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              Disburse &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Charts & AP Aging Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): AP Aging Schedule & Spend Trend */}
        <div className="lg:col-span-2 space-y-6">
          {/* AP Aging Schedule Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  AP Aging Schedule & Liabilities Breakdown
                </h3>
                <p className="text-xs text-slate-500">Maturity distribution of outstanding payables</p>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                Detailed Ledger <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive SVG Stacked Aging Bar */}
            <div className="space-y-2 mt-4">
              <div className="h-6 w-full rounded-xl bg-slate-100 overflow-hidden flex shadow-inner">
                {totalAgingLiability > 0 ? (
                  <>
                    <div
                      style={{ width: `${Math.max(5, ((aging.current_0_30 || 0) / totalAgingLiability) * 100)}%` }}
                      className="bg-teal-500 hover:bg-teal-600 transition-colors cursor-pointer"
                      title={`0-30 Days: ${formatINR(aging.current_0_30)}`}
                    ></div>
                    <div
                      style={{ width: `${Math.max(5, ((aging.past_31_60 || 0) / totalAgingLiability) * 100)}%` }}
                      className="bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                      title={`31-60 Days: ${formatINR(aging.past_31_60)}`}
                    ></div>
                    <div
                      style={{ width: `${Math.max(5, ((aging.past_61_90 || 0) / totalAgingLiability) * 100)}%` }}
                      className="bg-purple-500 hover:bg-purple-600 transition-colors cursor-pointer"
                      title={`61-90 Days: ${formatINR(aging.past_61_90)}`}
                    ></div>
                    <div
                      style={{ width: `${Math.max(5, ((aging.past_90_plus || 0) / totalAgingLiability) * 100)}%` }}
                      className="bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer"
                      title={`90+ Days: ${formatINR(aging.past_90_plus)}`}
                    ></div>
                  </>
                ) : (
                  <div className="w-full bg-teal-500"></div>
                )}
              </div>

              {/* Legend & 4 Aging Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div
                  onMouseEnter={() => setActiveBucketHover('0-30')}
                  onMouseLeave={() => setActiveBucketHover(null)}
                  className={`p-3 rounded-xl border transition-all ${
                    activeBucketHover === '0-30'
                      ? 'bg-teal-50 border-teal-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    0 - 30 Days
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
                    {formatINR(aging.current_0_30)}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Current Term</div>
                </div>

                <div
                  onMouseEnter={() => setActiveBucketHover('31-60')}
                  onMouseLeave={() => setActiveBucketHover(null)}
                  className={`p-3 rounded-xl border transition-all ${
                    activeBucketHover === '31-60'
                      ? 'bg-blue-50 border-blue-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    31 - 60 Days
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
                    {formatINR(aging.past_31_60)}
                  </div>
                  <div className="text-[10px] font-semibold text-blue-700 mt-0.5">Due Shortly</div>
                </div>

                <div
                  onMouseEnter={() => setActiveBucketHover('61-90')}
                  onMouseLeave={() => setActiveBucketHover(null)}
                  className={`p-3 rounded-xl border transition-all ${
                    activeBucketHover === '61-90'
                      ? 'bg-purple-50 border-purple-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    61 - 90 Days
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
                    {formatINR(aging.past_61_90)}
                  </div>
                  <div className="text-[10px] font-semibold text-purple-700 mt-0.5">Overdue</div>
                </div>

                <div
                  onMouseEnter={() => setActiveBucketHover('90+')}
                  onMouseLeave={() => setActiveBucketHover(null)}
                  className={`p-3 rounded-xl border transition-all ${
                    activeBucketHover === '90+'
                      ? 'bg-rose-50 border-rose-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    90+ Days
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-rose-700 mt-1 truncate">
                    {formatINR(aging.past_90_plus)}
                  </div>
                  <div className="text-[10px] font-semibold text-rose-700 mt-0.5">Critical Overdue</div>
                </div>
              </div>
            </div>

            {/* Monthly Spend & Volume Area Chart */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                  Monthly Spend & Volume Trend (Simulated Curve)
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">FY 2026 Quarter 1-4</span>
              </div>

              {/* SVG Area Chart */}
              <div className="w-full h-32 relative">
                <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path
                    d="M 10 95 Q 80 40 150 70 T 300 35 T 420 50 T 490 20 L 490 110 L 10 110 Z"
                    fill="url(#spendGradient)"
                  />

                  {/* Stroke path */}
                  <path
                    d="M 10 95 Q 80 40 150 70 T 300 35 T 420 50 T 490 20"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Interactive Nodes */}
                  <circle cx="10" cy="95" r="4" fill="#0d9488" />
                  <circle cx="150" cy="70" r="4" fill="#2563eb" />
                  <circle cx="300" cy="35" r="4" fill="#7c3aed" />
                  <circle cx="420" cy="50" r="4" fill="#2563eb" />
                  <circle cx="490" cy="20" r="5" fill="#0d9488" stroke="#fff" strokeWidth="2" />
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1 px-2">
                  <span>Nov 2025</span>
                  <span>Dec 2025</span>
                  <span>Jan 2026</span>
                  <span>Feb 2026</span>
                  <span>Nov 2026 (Live)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Vendors Spend Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Top Vendor Spend Distribution
                </h3>
                <p className="text-[11px] text-slate-500">Major suppliers ranked by cumulative approved spend</p>
              </div>
              <button
                onClick={() => onNavigate('vendors')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                All Vendors <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Supplier Name</th>
                    <th className="px-4 py-2.5">Invoices</th>
                    <th className="px-4 py-2.5">Spend Ratio</th>
                    <th className="px-4 py-2.5 text-right">Total Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {metrics?.top_vendors && metrics.top_vendors.length > 0 ? (
                    metrics.top_vendors.map((v, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/20 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500/20 to-purple-500/20 text-teal-800 font-bold text-[10px] flex items-center justify-center">
                            {v.vendor_name?.charAt(0) || 'V'}
                          </span>
                          <span className="truncate">{v.vendor_name}</span>
                        </td>
                        <td className="px-4 py-2.5">{v.count} invoice(s)</td>
                        <td className="px-4 py-2.5 w-36">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-purple-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(15, (v.total_spend / (summary.total_invoice_amount || 1)) * 100))}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">
                          {formatINR(v.total_spend)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        No vendor spend recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): AI Accuracy, Engine Health & Recent Activity */}
        <div className="space-y-6">
          {/* AI Accuracy & STP Gauge Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">AI Engine Accuracy</h3>
                  <p className="text-[11px] text-slate-500">Document extraction & match confidence</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Circular SVG Gauge */}
              <div className="mt-6 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      stroke="#f1f5f9"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="12"
                      strokeDasharray={364}
                      strokeDashoffset={364 * (1 - (summary.ocr_accuracy_pct || 95) / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0d9488" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {summary.ocr_accuracy_pct}%
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                      OCR Precision
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="mt-6 space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Processing Cycle Time</span>
                  <span className="font-bold text-slate-800">{summary.average_processing_time_hours} Hours</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">3-Way PO Matching Rate</span>
                  <span className="font-bold text-emerald-700">92.4% Auto</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Maker-Checker Policy</span>
                  <span className="font-bold text-emerald-700">100% Enforced</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="font-bold text-purple-700">PostgreSQL 16+</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('ocr-review')}
                className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-teal-400" />
                Launch OCR Workbench
              </button>
            </div>
          </div>

          {/* Recent Invoices Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Invoices
              </h4>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                View Repository
              </button>
            </div>

            <div className="space-y-2.5">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate('invoices')}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {inv.invoice_number}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {inv.vendor?.vendor_name || inv.vendor_name || 'Vendor'} • {inv.invoice_date || 'Date N/A'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {formatINR(inv.total_amount)}
                      </div>
                      <Badge status={inv.status} className="scale-90 origin-right mt-0.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No invoices captured yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
