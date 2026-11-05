import React, { useState } from 'react';
import {
  Receipt,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Building,
  KeyRound,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchRoleUser, loading } = useAuth();
  const [email, setEmail] = useState('admin@enterprise.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'System Admin', email: 'admin@enterprise.com', name: 'Sarah Connor', desc: 'Full administration & matrices', color: 'from-purple-500 to-indigo-600' },
    { role: 'AP Manager', email: 'manager@enterprise.com', name: 'Marcus Vance', desc: 'Exceptions & payment approvals', color: 'from-teal-500 to-teal-700' },
    { role: 'AP Executive / Maker', email: 'maker@enterprise.com', name: 'Elena Rostova', desc: 'Invoice capture & OCR correction', color: 'from-blue-500 to-blue-700' },
    { role: 'Approver', email: 'approver@enterprise.com', name: 'David Sterling', desc: 'Department invoice approvals', color: 'from-emerald-500 to-emerald-700' },
    { role: 'Payment Exec', email: 'finance@enterprise.com', name: 'Rachel Zane', desc: 'Bank batches & payment advice', color: 'from-amber-500 to-amber-700' },
    { role: 'Vendor Portal', email: 'vendor@acme.com', name: 'Thomas Thorne', desc: 'Vendor invoice status view', color: 'from-cyan-500 to-blue-600' },
    { role: 'Auditor', email: 'auditor@enterprise.com', name: 'Arthur Dent', desc: 'Audit logs & financial history', color: 'from-slate-600 to-slate-800' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-purple-50/40 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative blurred backdrop gradients */}
      <div className="absolute top-12 left-1/4 -translate-x-1/2 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 translate-x-1/2 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Main Glassmorphic Light Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-7 md:p-9 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white shadow-md shadow-teal-600/20 mb-1">
              <Receipt className="w-7 h-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Templegate AP Automation Platform
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Accounts Payable
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Automated invoice capture, intelligent OCR extraction, 3-way PO matching, and multi-tier approval workflows powered by PostgreSQL.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@enterprise.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-teal-700 font-medium">Default: Password@123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 hover:from-teal-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-700/20"
            >
              {loading ? 'Authenticating...' : 'Sign In to AP Automation'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Simulation Roles */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Role Simulator (One-Click Sign In)
              </span>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-150">
                7 Preconfigured Roles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className={`p-2.5 bg-slate-50/80 hover:bg-white border rounded-xl text-left transition-all flex items-start justify-between cursor-pointer group shadow-2xs hover:shadow-xs ${
                    email === acc.email
                      ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                      : 'border-slate-200/80 hover:border-teal-400'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-xs truncate">
                        {acc.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 block font-medium truncate">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{acc.desc}</span>
                  </div>
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                      email === acc.email
                        ? 'text-teal-600'
                        : 'text-slate-300 group-hover:text-teal-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>PostgreSQL Database Active</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Maker-Checker Segregation</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Tier Matrix Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
