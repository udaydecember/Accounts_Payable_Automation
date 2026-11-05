import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  History,
  FileText,
  User,
  Clock,
  Eye,
  RefreshCw,
  Database,
  Lock,
  Layers
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Modal } from '../components/common/Modal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [activeLog, setActiveLog] = useState<any | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Distinct actions
  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action).filter(Boolean)))];

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
      (l.entity_name && l.entity_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.user_email && l.user_email.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Governance & Statutory Compliance
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Tamper-Evident System Audit Trail</h1>
            <p className="text-teal-100 text-xs md:text-sm max-w-2xl">
              Permanent, append-only immutable financial change log recording every user upload, OCR correction, 3-way match, manager override, multi-tier approval, and banking settlement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 bg-white/15 backdrop-blur-md text-white font-mono text-xs font-semibold rounded-xl flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-teal-200" />
              <span>APPEND_ONLY • RFC-5424</span>
            </div>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
              title="Refresh Audit Trail"
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Log Entries</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{logs.length} Events</span>
            <span className="text-[11px] text-teal-700 font-medium">100% Non-repudiation</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Action Categories</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{uniqueActions.length - 1} Types</span>
            <span className="text-[11px] text-blue-700 font-medium">Granular traceability</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Storage Engine</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">PostgreSQL</span>
            <span className="text-[11px] text-emerald-700 font-medium">audit_logs table</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Filtered Matches</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{filteredLogs.length}</span>
            <span className="text-[11px] text-purple-700 font-medium">Matching search query</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search action, user email, entity, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
          >
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor & IP Address</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Entity Reference</th>
                <th className="px-5 py-3.5">Audit Detail / Payload</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying immutable audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No matching audit trail events found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.created_at?.substring(0, 19).replace('T', ' ')}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.user_email || 'System Daemon'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        IP: {log.ip_address || '127.0.0.1'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-700 text-xs">
                      <span className="font-semibold">{log.entity_name}</span>
                      <span className="text-slate-400 ml-1">#{log.entity_id?.substring(0, 8)}</span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 max-w-xs md:max-w-md truncate">
                      {log.details || 'State transition recorded'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setActiveLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={!!activeLog}
        onClose={() => setActiveLog(null)}
        title="Audit Log Event Inspector"
        maxWidth="md"
      >
        {activeLog && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Action:</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded">
                  {activeLog.action}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="font-mono text-slate-900">{activeLog.created_at}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">User:</span>
                <span className="font-semibold text-slate-900">{activeLog.user_email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">IP Address:</span>
                <span className="font-mono text-slate-700">{activeLog.ip_address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Entity:</span>
                <span className="font-mono text-slate-900">{activeLog.entity_name} ({activeLog.entity_id})</span>
              </div>
            </div>

            <div>
              <span className="block font-bold text-slate-800 mb-1">Details & Payload:</span>
              <pre className="p-3 bg-slate-950 text-teal-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 whitespace-pre-wrap">
                {activeLog.details}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
