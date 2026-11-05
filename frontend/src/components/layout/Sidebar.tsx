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
  Database,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tag: 'Bento', hidden: isVendor },
      ]
    },
    {
      title: 'INVOICE WORKFLOW',
      items: [
        { id: 'invoices', label: 'Invoices & OCR', icon: FileText, tag: 'Capture' },
        { id: 'ocr-review', label: 'OCR Workbench', icon: ScanEye, tag: 'AI Vision', hidden: isVendor },
        { id: 'exceptions', label: 'Validation Rules', icon: AlertTriangle, tag: 'Rules', hidden: isVendor },
        { id: 'matching', label: '3-Way PO Match', icon: GitCompare, tag: 'PO/GRN', hidden: isVendor },
      ]
    },
    {
      title: 'TREASURY & PAYOUT',
      items: [
        { id: 'approvals', label: 'Approval Matrix', icon: CheckSquare, tag: 'Sign-off', hidden: isVendor },
        { id: 'payments', label: 'Banking Settlement', icon: CreditCard, tag: 'NEFT', hidden: isVendor },
      ]
    },
    {
      title: 'GOVERNANCE & REPORTS',
      items: [
        { id: 'vendors', label: 'Vendor Master', icon: Users, tag: 'GSTIN', hidden: isVendor },
        { id: 'reports', label: 'Financial Analytics', icon: BarChart3, tag: 'Aging', hidden: isVendor },
        { id: 'audit', label: 'Immutable Audit Log', icon: ShieldCheck, tag: 'RFC-5424', hidden: isVendor },
      ]
    },
    {
      title: 'SYSTEM CONFIG',
      items: [
        { id: 'matrix', label: 'Workflow Rules', icon: Sliders, hidden: isVendor || !isAdmin },
        { id: 'integrations', label: 'ERP & Bank APIs', icon: Cpu, tag: 'Adapters', hidden: isVendor || !isAdmin },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-2px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-blue-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 shrink-0">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                Templegate
              </span>
              <span className="text-[9px] font-extrabold bg-teal-500 text-white px-1.5 py-0.2 rounded-full tracking-wider uppercase">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              AP Automation OS
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => !item.hidden);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-teal-400'
                              : 'text-slate-400 group-hover:text-teal-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.tag && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white/15 text-teal-200'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Database Card */}
      <div className="p-3 border-t border-slate-100/90 bg-slate-50/60">
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              PostgreSQL
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Maker-Checker</span>
            <span className="font-semibold text-teal-800">Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static floating island */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col p-3 md:p-4 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden p-3">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-3 left-3 w-72 max-w-[calc(100%-1.5rem)] z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
