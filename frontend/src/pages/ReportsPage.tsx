import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { ApiService } from '../services/api';
import { formatINR } from '../utils/currency';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'aging' | 'tax' | 'exceptions'>('aging');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [activeReport]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'aging') {
        const res = await ApiService.getAgingReport();
        setData(res);
      } else if (activeReport === 'tax') {
        const res = await ApiService.getTaxReport();
        setData(res);
      } else {
        const res = await ApiService.getExceptionsReport();
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    ApiService.exportReport(activeReport, format);
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveReport('aging')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'aging' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AP Aging Report
          </button>
          <button
            onClick={() => setActiveReport('tax')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'tax' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GST & Tax Summary
          </button>
          <button
            onClick={() => setActiveReport('exceptions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'exceptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exception Audit
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              {activeReport === 'aging' ? (
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Days Overdue</th>
                  <th className="px-5 py-3">Aging Bucket</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                </tr>
              ) : activeReport === 'tax' ? (
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">GSTIN</th>
                  <th className="px-5 py-3">Taxable Value</th>
                  <th className="px-5 py-3">CGST / SGST</th>
                  <th className="px-5 py-3">IGST</th>
                  <th className="px-5 py-3 text-right">Total Invoice</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Rule Code</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Discrepancy Detail</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3">Timestamp</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Generating financial report data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No data records found for this report.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {activeReport === 'aging' ? (
                      <>
                        <td className="px-5 py-3 font-bold text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{row.vendor_name}</td>
                        <td className="px-5 py-3 text-slate-500">{row.invoice_date}</td>
                        <td className="px-5 py-3 text-slate-500">{row.due_date}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{row.days_overdue} days</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px] text-slate-800">
                            {row.bucket}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          {formatINR(row.balance_due)}
                        </td>
                      </>
                    ) : activeReport === 'tax' ? (
                      <>
                        <td className="px-5 py-3 font-bold text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{row.vendor_name}</td>
                        <td className="px-5 py-3 font-mono text-slate-600">{row.gstin}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{formatINR(row.taxable_amount)}</td>
                        <td className="px-5 py-3 text-slate-600">{formatINR(Number(row.cgst) + Number(row.sgst))}</td>
                        <td className="px-5 py-3 text-slate-600">{formatINR(row.igst)}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          {formatINR(row.total_amount)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 font-bold text-slate-900">{row.invoice_number}</td>
                        <td className="px-5 py-3 font-mono text-slate-700">{row.rule_code}</td>
                        <td className="px-5 py-3 font-semibold text-rose-700">{row.severity}</td>
                        <td className="px-5 py-3 text-slate-800 max-w-md">{row.message}</td>
                        <td className="px-5 py-3 text-slate-600">{row.is_resolved ? 'Yes' : 'No'}</td>
                        <td className="px-5 py-3 text-slate-400 font-mono text-[11px]">{row.created_at?.substring(0, 19)}</td>
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
