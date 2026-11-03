import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ScanEye,
  AlertTriangle,
  GitCompare,
  CheckSquare,
  Sliders,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Cpu,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const userRoles = user?.roles?.map((r) => r.name) || [];
  const isVendor = userRoles.includes('vendor') && !userRoles.includes('admin');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hidden: isVendor },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'ocr-review', label: 'OCR Review & Edit', icon: ScanEye, hidden: isVendor },
    { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, hidden: isVendor },
    { id: 'matching', label: 'PO & GRN Matching', icon: GitCompare, hidden: isVendor },
    { id: 'approvals', label: 'Approval Inbox', icon: CheckSquare, hidden: isVendor },
    { id: 'vendors', label: 'Vendor Directory', icon: Users, hidden: isVendor },
    { id: 'payments', label: 'Payment Processing', icon: CreditCard, hidden: isVendor },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, hidden: isVendor },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, hidden: isVendor },
    { id: 'matrix', label: 'Workflow Matrix', icon: Sliders, hidden: isVendor || !userRoles.includes('admin') },
    { id: 'integrations', label: 'System Integrations', icon: Cpu, hidden: isVendor || !userRoles.includes('admin') },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30">
          <Receipt className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">Apex AP Platform</span>
          <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider block">Enterprise OCR & AI</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Accounts Payable
        </div>

        {navItems
          .filter((item) => !item.hidden)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>Engine Status</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-400">PostgreSQL • Hybrid OCR • Alembic</p>
      </div>
    </aside>
  );
};
