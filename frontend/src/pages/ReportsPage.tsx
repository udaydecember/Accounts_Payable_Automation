import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Receipt,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../services/api';
import { formatINR } from '../utils/currency';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'aging' | 'tax' | 'exceptions'>('aging');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReportData();
  }, [activeReport]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'aging') {
        const res = await ApiService.getAgingReport();
        setData(res || []);
      } else if (activeReport === 'tax') {
        const res = await ApiService.getTaxReport();
        setData(res || []);
      } else {
        const res = await ApiService.getExceptionsReport();
        setData(res || []);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    ApiService.exportReport(activeReport, format);
  };

  // Filtered dataset
  const filteredData = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (activeReport === 'aging') {
      return (
        (row.invoice_number && row.invoice_number.toLowerCase().includes(q)) ||
        (row.vendor_name && row.vendor_name.toLowerCase().includes(q)) ||
        (row.bucket && row.bucket.toLowerCase().includes(q))
      );
    } else if (activeReport === 'tax') {
      return (
        (row.invoice_number && row.invoice_number.toLowerCase().includes(q)) ||
        (row.vendor_name && row.vendor_name.toLowerCase().includes(q)) ||
        (row.gstin && row.gstin.toLowerCase().includes(q))
      );
    } else {
      return (
        (row.invoice_number && row.invoice_number.toLowerCase().includes(q)) ||
        (row.rule_code && row.rule_code.toLowerCase().includes(q)) ||
        (row.message && row.message.toLowerCase().includes(q))
      );
    }
  });

  // Dynamic KPI calculations based on active tab
  const totalBalanceDue = activeReport === 'aging'
    ? data.reduce((sum, r) => sum + (Number(r.balance_due) || 0), 0)
    : 0;
  const totalTaxable = activeReport === 'tax'
    ? data.reduce((sum, r) => sum + (Number(r.taxable_amount) || 0), 0)
    : 0;
  const totalTax = activeReport === 'tax'
    ? data.reduce((sum, r) => sum + (Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0)), 0)
    : 0;
  const openExceptionsCount = activeReport === 'exceptions'
    ? data.filter((r) => !r.is_resolved).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Financial Intelligence & Compliance Reporting
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Executive Reports & Audits</h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-2xl">
              Exportable AP aging distribution, statutory GST & TDS tax liability schedules, and exception audit reports with one-click Excel and CSV exports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-700" />
              Export Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveReport('aging')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeReport === 'aging'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>AP Aging Schedule</span>
          </button>
          <button
            onClick={() => setActiveReport('tax')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeReport === 'tax'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>GST & Tax Summary</span>
          </button>
          <button
            onClick={() => setActiveReport('exceptions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeReport === 'exceptions'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exception Audit Log</span>
          </button>
        </div>

        {/* Search inside report */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
            />
          </div>
          <button
            onClick={loadReportData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Banner for Active Tab */}
      <div className="bg-gradient-to-r from-teal-50/60 via-slate-50 to-blue-50/60 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {activeReport === 'aging' ? (
          <>
            <div>
              <span className="text-slate-500">Total Outstanding AP Aging Balance: </span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(totalBalanceDue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Invoices: </span>
              <span className="font-semibold text-slate-800">{data.length} records</span>
            </div>
          </>
        ) : activeReport === 'tax' ? (
          <>
            <div>
              <span className="text-slate-500">Total Taxable Value: </span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(totalTaxable)}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Input Tax Credit (ITC): </span>
              <span className="font-bold text-teal-800 text-sm">{formatINR(totalTax)}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-slate-500">Unresolved Rule Exceptions: </span>
              <span className="font-bold text-rose-700 text-sm">{openExceptionsCount} open</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Recorded Flags: </span>
              <span className="font-semibold text-slate-800">{data.length} events</span>
            </div>
          </>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              {activeReport === 'aging' ? (
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Vendor Name</th>
                  <th className="px-5 py-3.5">Invoice Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Days Overdue</th>
                  <th className="px-5 py-3.5">Aging Bucket</th>
                  <th className="px-5 py-3.5 text-right">Balance Due</th>
                </tr>
              ) : activeReport === 'tax' ? (
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Vendor Name</th>
                  <th className="px-5 py-3.5">GSTIN</th>
                  <th className="px-5 py-3.5">Taxable Value</th>
                  <th className="px-5 py-3.5">CGST / SGST</th>
                  <th className="px-5 py-3.5">IGST</th>
                  <th className="px-5 py-3.5 text-right">Total Invoice</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Rule Code</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Discrepancy Detail</th>
                  <th className="px-5 py-3.5">Resolution Status</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Generating financial report calculations...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No data records found for this report criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {activeReport === 'aging' ? (
                      <>
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{row.vendor_name}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">{row.invoice_date}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">{row.due_date}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700">
                          {row.days_overdue > 0 ? (
                            <span className="text-amber-700 font-bold">{row.days_overdue} days</span>
                          ) : (
                            <span className="text-emerald-700">Current</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-[11px] text-slate-800">
                            {row.bucket}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                          {formatINR(row.balance_due)}
                        </td>
                      </>
                    ) : activeReport === 'tax' ? (
                      <>
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{row.vendor_name}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">{row.gstin}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{formatINR(row.taxable_amount)}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">
                          {formatINR(Number(row.cgst || 0) + Number(row.sgst || 0))}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{formatINR(row.igst || 0)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                          {formatINR(row.total_amount)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-700 font-semibold">{row.rule_code}</td>
                        <td className="px-5 py-3.5">
                          <Badge status={row.severity} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 max-w-md">{row.message}</td>
                        <td className="px-5 py-3.5">
                          {row.is_resolved ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              Action Required
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                          {row.created_at?.substring(0, 19).replace('T', ' ')}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
