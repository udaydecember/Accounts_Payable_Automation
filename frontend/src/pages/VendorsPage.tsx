import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Building2, ShieldCheck, CreditCard, FileCheck } from 'lucide-react';
import { ApiService } from '../services/api';
import { Vendor } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
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
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loadVendors();
    } catch (err: any) {
      alert(`Vendor creation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor name, code, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadVendors()}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Onboard New Vendor
        </button>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Vendor Name & Code</th>
                <th className="px-5 py-3">Tax Registration (GSTIN / PAN)</th>
                <th className="px-5 py-3">Contact & Email</th>
                <th className="px-5 py-3">Terms & Currency</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Bank Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading vendors directory...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{v.vendor_name}</div>
                      <div className="text-[11px] text-teal-600 font-mono font-medium">{v.vendor_code}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono">
                      <div>GST: {v.gstin || 'None'}</div>
                      <div className="text-[11px] text-slate-500">PAN: {v.pan || 'None'}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-900 font-medium">{v.contact_person || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{v.email || 'No email registered'}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{v.payment_terms}</div>
                      <div className="text-[11px] text-slate-500">{v.currency}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge status={v.status} />
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {v.bank_accounts && v.bank_accounts.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {v.bank_accounts[0].account_number_masked}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[11px]">No Bank on File</span>
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Vendor Onboarding Form" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Legal Vendor Name *</label>
              <input
                required
                type="text"
                value={newVendor.vendor_name}
                onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Vendor Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. VEND-CORP-99"
                value={newVendor.vendor_code}
                onChange={(e) => setNewVendor({ ...newVendor, vendor_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="15-character statutory format"
                value={newVendor.gstin}
                onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                required
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={newVendor.payment_terms}
                onChange={(e) => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Immediate">Immediate / Due on Receipt</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Settlement Currency</label>
              <select
                value={newVendor.currency}
                onChange={(e) => setNewVendor({ ...newVendor, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Save & Onboard
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
