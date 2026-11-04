import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';

import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { OCRReviewPage } from './pages/OCRReviewPage';
import { ValidationPage } from './pages/ValidationPage';
import { MatchingPage } from './pages/MatchingPage';
import { ApprovalInboxPage } from './pages/ApprovalInboxPage';
import { WorkflowConfigPage } from './pages/WorkflowConfigPage';
import { VendorsPage } from './pages/VendorsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold tracking-wider uppercase text-teal-400">
          Loading Shout Accounts Payable Automation...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentTab('invoice-detail');
  };

  const handleNavigateToOCR = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentTab('ocr-review');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'invoices':
        return <InvoicesPage onSelectInvoice={handleSelectInvoice} onNavigateToOCR={handleNavigateToOCR} />;
      case 'invoice-detail':
        return (
          <InvoiceDetailPage
            invoiceId={selectedInvoiceId || ''}
            onBack={() => setCurrentTab('invoices')}
            onNavigateToOCR={handleNavigateToOCR}
          />
        );
      case 'ocr-review':
        return (
          <OCRReviewPage
            initialInvoiceId={selectedInvoiceId || undefined}
            onBack={() => setCurrentTab('invoices')}
          />
        );
      case 'exceptions':
        return <ValidationPage onSelectInvoice={handleSelectInvoice} />;
      case 'matching':
        return <MatchingPage />;
      case 'approvals':
        return <ApprovalInboxPage onSelectInvoice={handleSelectInvoice} />;
      case 'vendors':
        return <VendorsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'matrix':
        return <WorkflowConfigPage />;
      case 'integrations':
        return <IntegrationsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/60 overflow-hidden text-slate-800">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
