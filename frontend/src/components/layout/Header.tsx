import React from 'react';
import { UserCheck, LogOut, Menu, Sparkles } from 'lucide-react';
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
      case 'dashboard': return 'Accounts Payable Dashboard';
      case 'invoices': return 'Invoice Capture & Repository';
      case 'ocr-review': return 'OCR AI Review & Edit';
      case 'exceptions': return 'Invoice Exceptions & Validation';
      case 'matching': return '3-Way PO / GRN Matching Engine';
      case 'approvals': return 'Approval Inbox (Maker-Checker)';
      case 'vendors': return 'Vendor Master & Compliance';
      case 'payments': return 'Payment Processing & Advice';
      case 'reports': return 'Financial Reports & Exports';
      case 'audit': return 'Tamper-Evident Audit Trail';
      case 'matrix': return 'Approval Matrix Rules';
      case 'integrations': return 'Enterprise System Integrations';
      default: return 'AP Automation Platform';
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {formatTitle(currentTab)}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-teal-50 to-purple-50 text-teal-800 border border-teal-200">
              <Sparkles className="w-2.5 h-2.5 text-teal-600" />
              Automated
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-500 font-medium">
            OCR Extraction • 3-Way Matching • Multi-Tier Approvals • Bank Settlement
          </p>
        </div>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Simulation Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-teal-50/60 to-purple-50/60 border border-teal-200/70 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="text-xs font-bold text-teal-900">Role:</span>
          <select
            value={user?.email || 'admin@enterprise.com'}
            onChange={(e) => switchRoleUser(e.target.value)}
            className="text-xs bg-white border border-slate-200/90 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/40 shadow-2xs cursor-pointer"
          >
            {roleAccounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold text-slate-800">{user?.full_name || 'Administrator'}</div>
            <div className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
              {user?.roles?.[0]?.display_name || 'Admin'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 via-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of AP Automation"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
