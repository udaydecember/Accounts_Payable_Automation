import React from 'react';
import {
  UserCheck,
  LogOut,
  Menu,
  Sparkles,
  Search,
  Bell,
  Command,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onToggleMobileMenu }) => {
  const { user, switchRoleUser, logout } = useAuth();

  const roleAccounts = [
    { email: 'admin@enterprise.com', label: 'Admin (System Administrator)', role: 'admin' },
    { email: 'manager@enterprise.com', label: 'AP Manager (Marcus Vance)', role: 'ap_manager' },
    { email: 'maker@enterprise.com', label: 'Invoice Maker (Elena Rostova)', role: 'ap_executive' },
    { email: 'approver@enterprise.com', label: 'Approver (David Sterling)', role: 'approver' },
    { email: 'finance@enterprise.com', label: 'Payment Exec (Rachel Zane)', role: 'finance_executive' },
    { email: 'vendor@acme.com', label: 'Vendor Portal (Thomas Thorne)', role: 'vendor' },
    { email: 'auditor@enterprise.com', label: 'Auditor (Arthur Dent)', role: 'auditor' },
  ];

  const formatTitle = (t: string) => {
    switch (t) {
      case 'dashboard': return 'Executive Financial Overview';
      case 'invoices': return 'Invoices & OCR Processing';
      case 'ocr-review': return 'OCR AI Extraction Workbench';
      case 'exceptions': return 'Automated Compliance & Validation';
      case 'matching': return '3-Way PO / GRN Reconciliation Engine';
      case 'approvals': return 'Approval Inbox (Maker-Checker)';
      case 'vendors': return 'Vendor Master Directory & GSTIN';
      case 'payments': return 'Treasury & Corporate Banking';
      case 'reports': return 'Financial Intelligence & Aging';
      case 'audit': return 'Tamper-Evident System Audit Trail';
      case 'matrix': return 'Approval Matrix Rules';
      case 'integrations': return 'Enterprise Adapters & Banking APIs';
      default: return 'AP Automation Platform';
    }
  };

  return (
    <header className="m-3 md:m-4 mb-0 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 sticky top-3 md:top-4 z-20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          {/* Breadcrumb row */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>Templegate AP</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-teal-700 font-semibold capitalize">{currentTab.replace('-', ' ')}</span>
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {formatTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Center Search Input (hidden on small screens) */}
      <div className="hidden xl:flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5 w-72 text-xs text-slate-500">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 text-slate-400">Search invoices, vendors...</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Simulation Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-teal-50/70 to-blue-50/70 border border-teal-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="text-[11px] font-bold text-teal-900">Role:</span>
          <select
            value={user?.email || 'admin@enterprise.com'}
            onChange={(e) => switchRoleUser(e.target.value)}
            className="text-xs bg-white border border-slate-200/90 rounded-lg px-2 py-0.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            {roleAccounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.full_name || 'Sarah Connor'}
            </div>
            <div className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">
              {user?.roles?.[0]?.display_name || 'Admin'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
            {user?.full_name?.charAt(0) || 'S'}
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of AP Automation"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
