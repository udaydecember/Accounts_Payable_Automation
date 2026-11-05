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
  Receipt,
  X,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen = false,
  onClose
}) => {
  const { user } = useAuth();
  const userRoles = user?.roles?.map((r) => r.name) || [];
  const isVendor = userRoles.includes('vendor') && !userRoles.includes('admin');
  const isAdmin = userRoles.includes('admin');

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hidden: isVendor },
      ]
    },
    {
      title: 'INVOICE LIFECYCLE',
      items: [
        { id: 'invoices', label: 'Invoices Repository', icon: FileText },
        { id: 'ocr-review', label: 'OCR AI Workbench', icon: ScanEye, hidden: isVendor },
        { id: 'exceptions', label: 'Exception Validation', icon: AlertTriangle, hidden: isVendor },
        { id: 'matching', label: '3-Way PO Matching', icon: GitCompare, hidden: isVendor },
      ]
    },
    {
      title: 'APPROVALS & TREASURY',
      items: [
        { id: 'approvals', label: 'Approval Inbox', icon: CheckSquare, hidden: isVendor },
        { id: 'payments', label: 'Payment Processing', icon: CreditCard, hidden: isVendor },
      ]
    },
    {
      title: 'MASTER DATA & AUDIT',
      items: [
        { id: 'vendors', label: 'Vendor Directory', icon: Users, hidden: isVendor },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, hidden: isVendor },
        { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, hidden: isVendor },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'matrix', label: 'Approval Matrix', icon: Sliders, hidden: isVendor || !isAdmin },
        { id: 'integrations', label: 'ERP & Bank Integrations', icon: Cpu, hidden: isVendor || !isAdmin },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 via-white to-purple-50/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-teal-500/20 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight block truncate">
              AP Automation
            </span>
            <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block truncate">
              Enterprise OCR & AI
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => !item.hidden);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {section.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-50/90 via-blue-50/70 to-purple-50/80 text-teal-900 font-bold border-l-4 border-teal-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-teal-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer System & DB Status */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-xs">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              Database
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pipeline Status</span>
            <span className="text-teal-700 font-semibold">Active & Live</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
