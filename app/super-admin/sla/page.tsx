'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function SuperAdminSlaPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [escalationRules, setEscalationRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchSla = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/support/sla');
      const data = await res.json();
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          setPolicies(data.data);
        } else {
          setPolicies(data.data.policies || []);
          setBusinessHours(data.data.businessHours || []);
          setHolidays(data.data.holidays || []);
          setEscalationRules(data.data.escalationRules || []);
        }
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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Support SLA Engine & Working Calendar
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure real business-hours SLA targets, weekly institutional calendar, public holidays, and auto-escalation triggers.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>SLA policy updated successfully.</span>
        </div>
      )}

      {/* SLA Policies Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Priority SLA Targets</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">Loading SLA policies...</div>
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
                    {p.businessHoursOnly && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        Business Hours Only
                      </span>
                    )}
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
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Save Policy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Hours & Working Calendar Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Business Working Week (Asia/Dhaka)</h2>
          </div>

          <div className="space-y-2 text-xs">
            {businessHours.length > 0 ? (
              businessHours.map((bh) => (
                <div key={bh.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-semibold text-slate-200">{bh.dayName}</span>
                  {bh.isWorkingDay ? (
                    <span className="font-mono text-emerald-400">{bh.openTime} - {bh.closeTime}</span>
                  ) : (
                    <span className="text-slate-500 font-semibold">Weekend / Off</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-slate-500 py-4 text-center">Sunday - Thursday: 09:00 - 18:00 BST (Standard)</div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Automated Escalation Rules</h2>
          </div>

          <div className="space-y-2 text-xs">
            {escalationRules.length > 0 ? (
              escalationRules.map((er) => (
                <div key={er.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{er.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {er.actionType}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {er.unassignedMinutes ? `Unassigned >= ${er.unassignedMinutes}m • ` : ''}
                    {er.firstResponseRemainingMinutes !== null && er.firstResponseRemainingMinutes !== undefined ? `First Response Overdue <= ${er.firstResponseRemainingMinutes}m • ` : ''}
                    Status: {er.isActive ? 'Active' : 'Disabled'}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-slate-500 py-4 text-center">Active auto-escalation engine running.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
