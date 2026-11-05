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
  CheckSquare,
  Zap,
  Activity,
  Layers,
  ArrowDownRight
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
    ocr_accuracy_pct: 98.4,
    average_processing_time_hours: 3.2
  };

  const aging = metrics?.aging_buckets || {
    current_0_30: 0,
    past_31_60: 0,
    past_61_90: 0,
    past_90_plus: 0
  };

  const agingData = [
    { label: 'Current (0-30d)', amount: aging.current_0_30, color: '#0d9488', bgClass: 'bg-teal-500' },
    { label: '31-60 Days', amount: aging.past_31_60, color: '#3b82f6', bgClass: 'bg-blue-500' },
    { label: '61-90 Days', amount: aging.past_61_90, color: '#f59e0b', bgClass: 'bg-amber-500' },
    { label: '90+ Days (Critical)', amount: aging.past_90_plus, color: '#f43f5e', bgClass: 'bg-rose-500' },
  ];

  const maxAgingAmount = Math.max(...agingData.map((d) => d.amount), 1);

  // Workflow pipeline stages
  const workflowStages = [
    {
      id: 'invoices',
      stepNum: '01',
      title: 'Invoice Capture',
      desc: 'PDF/PNG ingestion',
      count: summary.total_invoices,
      icon: UploadCloud,
      color: 'teal',
      tag: 'Capture'
    },
    {
      id: 'ocr-review',
      stepNum: '02',
      title: 'OCR Extraction',
      desc: 'Vision AI correction',
      count: summary.awaiting_ocr,
      icon: Scan,
      color: 'blue',
      tag: 'AI Vision'
    },
    {
      id: 'matching',
      stepNum: '03',
      title: '3-Way Match',
      desc: 'PO & GRN tolerances',
      count: summary.pending_validation,
      icon: GitCompare,
      color: 'purple',
      tag: 'Auto-Match'
    },
    {
      id: 'approvals',
      stepNum: '04',
      title: 'Approvals Matrix',
      desc: 'Maker-Checker gate',
      count: summary.pending_approval,
      icon: CheckSquare,
      color: 'amber',
      tag: 'SOX Gate'
    },
    {
      id: 'payments',
      stepNum: '05',
      title: 'Treasury Payout',
      desc: 'NEFT/RTGS settlement',
      count: summary.paid_count,
      icon: CreditCard,
      color: 'emerald',
      tag: 'Disbursed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Bento Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-blue-950 text-white p-6 sm:p-8 shadow-xl shadow-slate-950/10 border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-teal-300 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Autonomous Accounts Payable Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Accounts Payable Command Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time monitoring of invoice extraction, 3-way matching tolerances, multi-tier approvals, and treasury remittance powered by PostgreSQL.
            </p>
          </div>

          {/* Quick Action Bento Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('matching')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md border border-white/15 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <GitCompare className="w-4 h-4 text-teal-300" />
              <span>Reconcile POs</span>
            </button>
            <button
              onClick={() => onNavigate('approvals')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md border border-white/15 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <CheckSquare className="w-4 h-4 text-purple-300" />
              <span>Pending Approvals</span>
            </button>
          </div>
        </div>

        {/* Hero Micro-Stats Ribbon */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Average Cycle Time</span>
            <span className="font-extrabold text-white text-base">3.2 Hours</span>
            <span className="text-teal-400 text-[10px] block font-medium">85% faster vs manual</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">AI Extraction Precision</span>
            <span className="font-extrabold text-white text-base">{summary.ocr_accuracy_pct || 98.4}%</span>
            <span className="text-emerald-400 text-[10px] block font-medium">Multi-engine OCR</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">3-Way PO Match Rate</span>
            <span className="font-extrabold text-white text-base">92.8%</span>
            <span className="text-blue-400 text-[10px] block font-medium">Auto-reconciliation</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Statutory Compliance</span>
            <span className="font-extrabold text-white text-base">100% Valid</span>
            <span className="text-purple-400 text-[10px] block font-medium">GSTIN & 2% TDS auto-calc</span>
          </div>
        </div>
      </div>

      {/* 2. Bento AP Lifecycle Stepper */}
      <div className="bento-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              End-to-End Invoice Processing Pipeline
            </h2>
            <p className="text-[11px] text-slate-500">
              Interactive AP lifecycle: click any stage to navigate directly to its operations queue
            </p>
          </div>
          <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Real-time Status
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => onNavigate(stage.id)}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-teal-600 transition-colors">
                    {stage.stepNum}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                    {stage.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white text-slate-700 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center justify-center shadow-2xs border border-slate-200/60">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs group-hover:text-teal-700 transition-colors">
                      {stage.title}
                    </h3>
                    <p className="text-[10px] text-slate-500">{stage.desc}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Queue Items:</span>
                  <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-teal-700">
                    {stage.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bento KPI Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spend Invoiced */}
        <div className="bento-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoiced Spend
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatINR(summary.total_invoice_amount)}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-teal-700 font-semibold">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +12.4%
                </span>
                <span>vs previous cycle</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Invoices Processed:</span>
            <span className="font-bold text-slate-800">{summary.total_invoices} records</span>
          </div>
        </div>

        {/* Card 2: Settled & Disbursed */}
        <div className="bento-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Remitted / Paid
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatINR(summary.total_paid_amount)}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> 100% Settled
                </span>
                <span>via Corporate Gateway</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Settled Payments:</span>
            <span className="font-bold text-emerald-700">{summary.paid_count} vouchers</span>
          </div>
        </div>

        {/* Card 3: Outstanding AP Balance */}
        <div className="bento-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Outstanding Payables
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatINR(summary.total_outstanding_amount)}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 font-semibold">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                  <Clock className="w-3 h-3 mr-0.5" /> {summary.pending_payment} Ready
                </span>
                <span>for batch disbursement</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Overdue Amount:</span>
            <span className="font-bold text-rose-600">{formatINR(aging.past_90_plus || 0)}</span>
          </div>
        </div>

        {/* Card 4: AI OCR Precision */}
        <div className="bento-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                OCR Model Accuracy
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
                {summary.ocr_accuracy_pct || 98.4}%
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-700 font-semibold">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                  <Zap className="w-3 h-3 mr-0.5" /> High Confidence
                </span>
                <span>Auto-extracted</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
              <Scan className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Awaiting Review:</span>
            <span className="font-bold text-slate-800">{summary.awaiting_ocr} documents</span>
          </div>
        </div>
      </div>

      {/* 4. Analytics Bento Row (Aging Bar Chart + Monthly Spend Area Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: AP Aging Distribution */}
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Accounts Payable Aging Schedule
              </h3>
              <p className="text-[11px] text-slate-500">
                Outstanding liabilities segmented by due date buckets
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">
              Total: {formatINR(summary.total_outstanding_amount)}
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="space-y-3.5 pt-2">
            {agingData.map((bucket, bIdx) => {
              const pct = Math.max((bucket.amount / maxAgingAmount) * 100, 3);
              const isHovered = activeBucketHover === bucket.label;
              return (
                <div
                  key={bIdx}
                  onMouseEnter={() => setActiveBucketHover(bucket.label)}
                  onMouseLeave={() => setActiveBucketHover(null)}
                  className={`p-2.5 rounded-xl transition-all ${
                    isHovered ? 'bg-slate-50 ring-1 ring-slate-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      {bucket.label}
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatINR(bucket.amount)}
                    </span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bucket.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cash Velocity & Spend Trend Area Chart */}
        <div className="bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Monthly Spend Velocity
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cash disbursement projection and monthly invoiced trends
                </p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                INR (₹) Trend
              </span>
            </div>

            {/* Curved SVG Area Chart */}
            <div className="w-full h-48 mt-4 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                {/* Area under curve */}
                <path
                  d="M 10 120 Q 80 100 130 65 T 250 80 T 340 40 L 390 55 L 390 140 L 10 140 Z"
                  fill="url(#spendGradient)"
                />

                {/* Smooth Curve */}
                <path
                  d="M 10 120 Q 80 100 130 65 T 250 80 T 340 40 L 390 55"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Interactive Data Points */}
                <circle cx="10" cy="120" r="4" fill="#0d9488" className="hover:scale-150 transition-transform" />
                <circle cx="130" cy="65" r="4" fill="#0d9488" className="hover:scale-150 transition-transform" />
                <circle cx="250" cy="80" r="4" fill="#0d9488" className="hover:scale-150 transition-transform" />
                <circle cx="340" cy="40" r="5" fill="#2563eb" className="hover:scale-150 transition-transform" />
                <circle cx="390" cy="55" r="4" fill="#7c3aed" className="hover:scale-150 transition-transform" />
              </svg>

              {/* Month Labels */}
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-2 mt-2">
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Peak Disbursement Window:</span>
            <span className="font-bold text-slate-900">Nov 15 - Nov 28 (Net 30)</span>
          </div>
        </div>
      </div>

      {/* 5. Operational Bento Row (Top Strategic Vendors + Live Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Strategic Vendors */}
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Top Strategic Suppliers & Vendors
              </h3>
              <p className="text-[11px] text-slate-500">
                Expenditure breakdown and active transaction volume
              </p>
            </div>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Directory <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics?.top_vendors && metrics.top_vendors.length > 0 ? (
              metrics.top_vendors.map((vendor, vIdx) => {
                const maxSpend = Math.max(...(metrics.top_vendors?.map((v) => v.total_spend) || [1]));
                const pct = (vendor.total_spend / maxSpend) * 100;
                return (
                  <div key={vIdx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center justify-center">
                          {vendor.vendor_name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{vendor.vendor_name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(vendor.total_spend)}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No vendor expenditure records recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Processing Stream */}
        <div className="bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Live Invoice Pipeline Stream
                </h3>
                <p className="text-[11px] text-slate-500">
                  Recent invoices traversing the automated AP workflow
                </p>
              </div>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Invoices <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate('invoices')}
                    className="p-3 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-slate-200/90 shadow-2xs transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-xs text-slate-900 truncate">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {inv.vendor?.vendor_name || inv.vendor_name || inv.vendor_name_raw || 'Vendor'} • {inv.invoice_date || 'Today'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {formatINR(inv.total_amount)}
                      </div>
                      <Badge status={inv.status} className="scale-90 origin-right mt-0.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No invoices currently in processing.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated Processing:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 100% Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
