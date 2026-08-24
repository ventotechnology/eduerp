'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SuperAdminSlaPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchSla = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/support/sla');
      const data = await res.json();
      if (data.success) {
        setPolicies(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSla();
  }, []);

  const handleUpdate = async (policy: any) => {
    try {
      const res = await fetch('/api/super-admin/support/sla', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        await fetchSla();
      }
    } catch {
      alert('Failed to update policy');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Support SLA Policies
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Define First Response and Resolution time targets by priority tier for customer support tickets.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>SLA policy updated successfully.</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading SLA policies...</div>
        ) : (
          <div className="space-y-4">
            {policies.map((p) => (
              <div key={p.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {p.priority}
                    </span>
                    <span className="font-bold text-white text-sm">{p.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">First Response Target (minutes)</label>
                    <input
                      type="number"
                      value={p.firstResponseTargetMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPolicies(policies.map((x) => x.id === p.id ? { ...x, firstResponseTargetMinutes: val } : x));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Approx. {Math.round(p.firstResponseTargetMinutes / 60)} hours
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Resolution Target (minutes)</label>
                    <input
                      type="number"
                      value={p.resolutionTargetMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPolicies(policies.map((x) => x.id === p.id ? { ...x, resolutionTargetMinutes: val } : x));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Approx. {Math.round(p.resolutionTargetMinutes / 60)} hours ({Math.round(p.resolutionTargetMinutes / 1440)} days)
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(p)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                  >
                    Save Policy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
