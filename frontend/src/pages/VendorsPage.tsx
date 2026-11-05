import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Mail,
  Phone,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Vendor } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    vendor_code: '',
    vendor_type: 'Standard',
    contact_person: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    payment_terms: 'Net 30',
    currency: 'INR'
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getVendors(search);
      setVendors(data || []);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch vendor records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.createVendor(newVendor);
      setIsOpen(false);
      setNewVendor({
        vendor_name: '',
        vendor_code: '',
        vendor_type: 'Standard',
        contact_person: '',
        email: '',
        phone: '',
        gstin: '',
        pan: '',
        payment_terms: 'Net 30',
        currency: 'INR'
      });
      setFeedback({ type: 'success', message: 'Vendor successfully onboarded to master directory!' });
      await loadVendors();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Vendor onboarding failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // KPI stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === 'Active' || !v.status).length;
  const gstinCount = vendors.filter((v) => v.gstin && v.gstin.trim().length > 0).length;
  const bankVerifiedCount = vendors.filter((v) => v.bank_accounts && v.bank_accounts.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              Vendor Master Governance
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Vendor Master Directory</h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-2xl">
              Enterprise vendor database, GSTIN & PAN compliance records, verified disbursement bank accounts, and settlement payment terms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Onboard New Vendor</span>
            </button>
            <button
              onClick={loadVendors}
              disabled={loading}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Directory</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{totalVendors} Vendors</span>
            <span className="text-[11px] text-teal-700 font-medium">{activeVendors} Active status</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">GST Compliant</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{gstinCount}</span>
            <span className="text-[11px] text-blue-700 font-medium">Valid 15-digit GSTIN</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Bank Verified</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{bankVerifiedCount} Accounts</span>
            <span className="text-[11px] text-emerald-700 font-medium">Direct credit enabled</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Default Terms</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">Net 30 Days</span>
            <span className="text-[11px] text-purple-700 font-medium">Settlement in INR (₹)</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Control & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search vendor name, code, GSTIN, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadVendors()}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadVendors}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Filter / Search
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Vendor
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Vendor Identity</th>
                <th className="px-5 py-3.5">Tax Registration (GSTIN / PAN)</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Terms & Currency</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Bank Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading vendor master records...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No vendors found matching your query.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{v.vendor_name}</div>
                      <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[11px] font-semibold">
                        {v.vendor_code}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">
                        {v.gstin ? `GST: ${v.gstin}` : <span className="text-slate-400">No GSTIN</span>}
                      </div>
                      <div className="text-slate-500">
                        {v.pan ? `PAN: ${v.pan}` : <span className="text-slate-400">No PAN</span>}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-900 font-medium">{v.contact_person || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{v.email || 'No email registered'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{v.payment_terms || 'Net 30'}</div>
                      <div className="text-[11px] text-teal-700 font-semibold">{v.currency || 'INR'}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge status={v.status || 'Active'} />
                    </td>

                    <td className="px-5 py-3.5">
                      {v.bank_accounts && v.bank_accounts.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-mono text-[11px] font-semibold border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{v.bank_accounts[0].account_number_masked || 'Verified A/C'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-medium border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>No Bank Registered</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Vendor Master Onboarding Form"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Legal Vendor Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                value={newVendor.vendor_name}
                onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Vendor Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. VEND-ACME-01"
                value={newVendor.vendor_code}
                onChange={(e) => setNewVendor({ ...newVendor, vendor_code: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="15-character GSTIN (e.g. 29AABCS1429B1ZB)"
                value={newVendor.gstin}
                onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                placeholder="10-character PAN (e.g. AABCS1429B)"
                value={newVendor.pan}
                onChange={(e) => setNewVendor({ ...newVendor, pan: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={newVendor.contact_person}
                onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                required
                type="email"
                placeholder="billing@acme.com"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={newVendor.payment_terms}
                onChange={(e) => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days (Standard)</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Immediate">Immediate / Due on Receipt</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Settlement Currency</label>
              <select
                value={newVendor.currency}
                onChange={(e) => setNewVendor({ ...newVendor, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Save & Onboard
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
