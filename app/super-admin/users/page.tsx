'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Mail,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

export default function PlatformUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setUsers(data.platformUsers || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Platform Administrators & Roles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage EduERP SaaS platform administrators, support engineers, and billing operators.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-semibold">User Name</th>
                <th className="py-3.5 px-4 font-semibold">Platform Role</th>
                <th className="py-3.5 px-4 font-semibold">Email</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
