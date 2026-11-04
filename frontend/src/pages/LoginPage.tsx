import React, { useState } from 'react';
import { Receipt, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchRoleUser, loading } = useAuth();
  const [email, setEmail] = useState('admin@enterprise.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'System Admin', email: 'admin@enterprise.com', name: 'Sarah Connor', desc: 'Full administration & matrices' },
    { role: 'AP Manager', email: 'manager@enterprise.com', name: 'Marcus Vance', desc: 'Exceptions & payment approvals' },
    { role: 'AP Executive / Maker', email: 'maker@enterprise.com', name: 'Elena Rostova', desc: 'Invoice capture & OCR correction' },
    { role: 'Approver', email: 'approver@enterprise.com', name: 'David Sterling', desc: 'Department invoice approvals' },
    { role: 'Payment Exec', email: 'finance@enterprise.com', name: 'Rachel Zane', desc: 'Bank batches & payment advice' },
    { role: 'Vendor Portal', email: 'vendor@acme.com', name: 'Thomas Thorne', desc: 'Vendor invoice status view' },
    { role: 'Auditor', email: 'auditor@enterprise.com', name: 'Arthur Dent', desc: 'Audit logs & financial history' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Password@123');
    setError(null);
    try {
      await switchRoleUser(accEmail);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Main Brand Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 mb-2">
              <Receipt className="w-8 h-8 text-teal-400" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                Shout AP Automation
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Shout Accounts Payable Automation
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Automated invoice capture, intelligent OCR extraction, 3-way PO matching, and multi-tier approval workflows.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@enterprise.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? 'Authenticating...' : 'Sign In to Shout AP Automation'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Simulation Roles */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
              Quick Role Demonstration (One-Click Sign In)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 rounded-lg text-left transition-colors flex items-start justify-between cursor-pointer group"
                >
                  <div>
                    <span className="font-semibold text-white group-hover:text-teal-300 transition-colors block text-xs">
                      {acc.role}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{acc.name}</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>Shout Accounts Payable Automation • Enterprise Financial Security</span>
        </div>
      </div>
    </div>
  );
};
