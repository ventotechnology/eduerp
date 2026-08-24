'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Building2,
  DollarSign,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setOrders(data.recentOrders || []);
        setInvoices(data.recentInvoices || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span>SaaS Orders & Revenue Billing</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          History of subscription checkout orders, bKash transactions, and generated platform invoices.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-4">Subscription Checkout Orders</h2>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No subscription orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Institution / Lead</th>
                  <th className="pb-3 font-semibold">Package Tier</th>
                  <th className="pb-3 font-semibold">Billing Cycle</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Gateway</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-emerald-400">{ord.orderNumber}</td>
                    <td className="py-3 font-medium text-white">{ord.signup?.institutionName || ord.tenant?.slug || 'New Lead'}</td>
                    <td className="py-3">{ord.plan?.name}</td>
                    <td className="py-3 uppercase text-[11px]">{ord.billingCycle}</td>
                    <td className="py-3 font-extrabold text-white">BDT {ord.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 uppercase">{ord.gateway || 'BKASH'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        ord.status === 'PAID' || ord.status === 'FULFILLED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(ord.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
