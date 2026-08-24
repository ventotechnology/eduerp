'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
        setPlans(data.plans || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>SaaS Subscriptions Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor active subscriptions, trial expirations, manual payments, and contract renewals.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-semibold">Institution / Tenant</th>
                <th className="py-3.5 px-4 font-semibold">Active Plan</th>
                <th className="py-3.5 px-4 font-semibold">Billing Cycle</th>
                <th className="py-3.5 px-4 font-semibold">Classification</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">/{t.slug}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    {t.activePlan}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[11px]">
                    {t.billingCycle}
                  </td>
                  <td className="py-3.5 px-4">
                    {t.isDemoTenant ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        DEMO VERTICAL
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        COMMERCIAL CUSTOMER
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      t.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {t.subscriptionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(t.createdAt).toLocaleDateString()}
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
