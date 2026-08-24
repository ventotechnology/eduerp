'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function SuperAdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
    if (search) query.set('search', search);

    try {
      const res = await fetch(`/api/super-admin/inquiries?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/super-admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchInquiries();
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(data.data);
        }
      }
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Sales Leads & Institutional Inquiries
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review prospect inquiries submitted via the public contact form and schedule institutional demos.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by inquiry reference (e.g. INQ-2026-000001), institution, or name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Inquiry Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="SCHEDULE_DEMO">Demo Scheduled</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No inquiries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3 font-semibold">Ref #</th>
                    <th className="pb-3 font-semibold">Institution</th>
                    <th className="pb-3 font-semibold">Contact Person</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`cursor-pointer transition ${
                        selectedInquiry?.id === inq.id ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        {inq.inquiryNumber}
                      </td>
                      <td className="py-3 text-white font-semibold">
                        {inq.institutionName}
                      </td>
                      <td className="py-3 text-slate-300">
                        <span>{inq.fullName}</span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {inq.category}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[11px]">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Inquiry Detail Inspector */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Inquiry Inspector</h3>

          {selectedInquiry ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="font-mono text-emerald-400 font-bold block">{selectedInquiry.inquiryNumber}</span>
                <h4 className="text-sm font-bold text-white mt-1">{selectedInquiry.institutionName}</h4>
                <p className="text-[11px] text-slate-400">{selectedInquiry.institutionType} • {selectedInquiry.district}, {selectedInquiry.country}</p>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <a href={`mailto:${selectedInquiry.email}`} className="hover:underline">{selectedInquiry.email}</a>
                </div>
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedInquiry.phone}</span>
                  </div>
                )}
                {selectedInquiry.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <a
                      href={`https://wa.me/${selectedInquiry.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      WhatsApp ({selectedInquiry.whatsapp})
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 font-bold text-[10px] uppercase block">Requirements</span>
                <p className="text-slate-200 whitespace-pre-wrap">{selectedInquiry.requirements || 'None provided'}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Update Lead Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['CONTACTED', 'QUALIFIED', 'SCHEDULE_DEMO', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition ${
                        selectedInquiry.status === st
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Select an inquiry row to inspect details and take action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
