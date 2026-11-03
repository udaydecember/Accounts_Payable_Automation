import React from 'react';
import { UserCheck, Bell, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
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
      case 'ocr-review': return 'OCR Extraction Review & Verification';
      case 'exceptions': return 'Invoice Exceptions & Validation Management';
      case 'matching': return '2-Way & 3-Way PO / GRN Matching Engine';
      case 'approvals': return 'Approval Inbox (Maker-Checker)';
      case 'vendors': return 'Vendor Master & Compliance';
      case 'payments': return 'Payment Execution & Advice Generation';
      case 'reports': return 'Financial Reports & Exports';
      case 'audit': return 'Tamper-Evident Audit Trail';
      case 'matrix': return 'Approval Workflow Matrix Configuration';
      case 'integrations': return 'Enterprise System Integrations';
      default: return 'AP Automation';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{formatTitle(currentTab)}</h1>
        <p className="text-xs text-slate-500">Automated invoice capture, extraction, matching, and settlement</p>
      </div>

      {/* Role Switcher & Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-2xs">
          <UserCheck className="w-4 h-4 text-teal-600 ml-1" />
          <span className="text-xs font-semibold text-slate-600">Simulate Role:</span>
          <select
            value={user?.email || 'admin@enterprise.com'}
            onChange={(e) => switchRoleUser(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            {roleAccounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{user?.full_name || 'Administrator'}</div>
            <div className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">
              {user?.roles?.[0]?.display_name || 'Admin'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs ring-2 ring-teal-500/20">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};
