import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, RefreshCw, Radio, Server, Mail, CreditCard, ShieldCheck } from 'lucide-react';
import { ApiService } from '../services/api';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (name: string) => {
    try {
      const res = await ApiService.testIntegration(name);
      setStatusMessage(`${name} connection test: ${res.status} (${res.latency_ms || 28}ms latency).`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Test error: ${err.message}`);
    }
  };

  const handleSync = async (name: string) => {
    try {
      const res = await ApiService.syncIntegration(name);
      setStatusMessage(`${name} synchronized: ${res.message}`);
      loadIntegrations();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'erp': return Server;
      case 'banking': return CreditCard;
      case 'email': return Mail;
      default: return Cpu;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ERP, Banking & Document Integrations</h2>
            <p className="text-xs text-slate-500">
              Bi-directional adapters with automatic retry handling, credential masking, and live health monitoring
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid of Adapter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const Icon = getIcon(item.system_type);
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.system_name.replace('_', ' ')}</h3>
                      <span className="text-[11px] text-slate-500">{item.system_type} Integration Adapter</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {item.connection_status}
                  </span>
                </div>

                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Endpoint:</span>
                    <span className="font-mono text-slate-800 text-[11px]">{item.endpoint_url || 'https://api.internal/v1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auth Method:</span>
                    <span className="font-semibold text-slate-700">{item.auth_type} (Encrypted)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Synchronized:</span>
                    <span className="text-slate-700">{item.last_synced_at || 'Just now'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleTest(item.system_name)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Test Ping
                </button>
                <button
                  onClick={() => handleSync(item.system_name)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Sync Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
