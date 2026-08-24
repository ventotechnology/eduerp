'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Clock,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <span>Platform Security Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit log for super admin impersonation, tenant provisioning, credential rotation, and security events.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-semibold">Action Event</th>
                <th className="py-3.5 px-4 font-semibold">Resource</th>
                <th className="py-3.5 px-4 font-semibold">Actor Email</th>
                <th className="py-3.5 px-4 font-semibold">Tenant Context</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No platform audit events logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {log.resourceType || 'System'}: {log.resourceId?.slice(0, 8) || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {log.user?.email || log.actorEmail || 'platform-admin@eduerp.us'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.tenantId || 'global'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
