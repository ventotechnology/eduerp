'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Shield,
  Download,
  RefreshCw,
  Copy,
  Check,
  Search,
  Filter,
  ExternalLink,
  Lock,
  Building2,
  CheckCircle2,
  X,
  Sparkles,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

const VERTICAL_TENANTS = [
  { slug: 'ALL', label: 'All Institutions & Roles (48 Accounts)' },
  { slug: 'platform', label: 'SaaS Platform Control (4 Accounts)' },
  { slug: 'demo-school', label: 'School Engine (16 Accounts)' },
  { slug: 'demo-college', label: 'College Engine (4 Accounts)' },
  { slug: 'demo-school-college', label: 'School & College Engine (3 Accounts)' },
  { slug: 'demo-madrasha', label: 'Madrasha & Hifz Engine (3 Accounts)' },
  { slug: 'demo-university', label: 'University Higher-Ed Engine (8 Accounts)' },
  { slug: 'demo-polytechnic', label: 'Polytechnic Diploma Engine (3 Accounts)' },
  { slug: 'demo-vocational', label: 'Vocational & Technical Engine (3 Accounts)' },
  { slug: 'demo-training', label: 'Professional Training Engine (3 Accounts)' },
];

export default function DemoCredentialsVaultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [selectedVertical, setSelectedVertical] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Temporary Password Reset Modal
  const [resettingAccount, setResettingAccount] = useState<any | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setDemoAccounts(data.demoAccounts || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleCopy = (text: string, email: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Launch Direct Impersonation Session
  const handleLaunchImpersonation = async (acc: any) => {
    if (acc.tenantSlug === 'platform') {
      router.push('/super-admin');
      return;
    }
    try {
      const res = await fetch(`/api/auth/demo-session?tenantSlug=${acc.tenantSlug}&role=${acc.role}`);
      const data = await res.json();
      if (data.success) {
        router.push(`/${acc.tenantSlug}/dashboard`);
      } else {
        alert(data.error || 'Failed to start session');
      }
    } catch (err: any) {
      alert(err.message || 'Session launch failed');
    }
  };

  // Reset & Generate Temporary Password
  const handleResetPassword = async (email: string) => {
    setIsResetting(true);
    setOneTimePassword(null);
    try {
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_DEMO_CREDENTIAL',
          email
        })
      });
      const data = await res.json();
      if (data.success) {
        setOneTimePassword(data.temporaryPassword);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsResetting(false);
    }
  };

  // Export Client Testing Pack (CSV / TXT)
  const handleExportClientPack = (format: 'csv' | 'txt') => {
    const listToExport = filteredAccounts;
    if (listToExport.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `eduerp-client-demo-pack-${selectedVertical.toLowerCase()}-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      mimeType = 'text/csv';
      filename += '.csv';
      content = 'Institution,Vertical,Role,Name,Email,Portal_URL,Modules_To_Test\n';
      listToExport.forEach(a => {
        content += `"${a.institution}","${a.institutionType}","${a.role}","${a.name}","${a.email}","https://eduerp.us${a.landingUrl}","${(a.modules || []).join('; ')}"\n`;
      });
    } else {
      filename += '.txt';
      content = `================================================================================\n`;
      content += `EDUERP CLIENT DEMO TESTING PACK — CONFIDENTIAL\n`;
      content += `Generated: ${new Date().toISOString()}\n`;
      content += `Scope: ${selectedVertical}\n`;
      content += `Login Portal: https://eduerp.us/login\n`;
      content += `================================================================================\n\n`;

      listToExport.forEach(a => {
        content += `--------------------------------------------------------------------------------\n`;
        content += `Institution : ${a.institution} (${a.institutionType})\n`;
        content += `Role        : ${a.role}\n`;
        content += `Name        : ${a.name}\n`;
        content += `Email       : ${a.email}\n`;
        content += `Landing URL : https://eduerp.us${a.landingUrl}\n`;
        content += `Modules     : ${(a.modules || []).join(', ')}\n`;
        content += `Notes       : ${a.notes || 'Full functional persona'}\n\n`;
      });
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAccounts = demoAccounts.filter(acc => {
    const matchesVertical = selectedVertical === 'ALL' || acc.tenantSlug === selectedVertical;
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.email.toLowerCase().includes(search.toLowerCase()) ||
      acc.role.toLowerCase().includes(search.toLowerCase()) ||
      acc.institution.toLowerCase().includes(search.toLowerCase());
    return matchesVertical && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <span>Client Demo Credential Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic credential management, one-time temporary password resets, and exportable client testing packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportClientPack('csv')}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExportClientPack('txt')}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Export TXT Pack</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by role, name, email, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedVertical}
            onChange={(e) => setSelectedVertical(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {VERTICAL_TENANTS.map(v => (
              <option key={v.slug} value={v.slug}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-semibold">Persona & Name</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Institution Engine</th>
                <th className="py-3.5 px-4 font-semibold">Login Username (Email)</th>
                <th className="py-3.5 px-4 font-semibold">Key Modules</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching demo personas found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{acc.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{acc.tenantSlug}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 block">{acc.institution}</span>
                      <span className="text-[10px] text-slate-400">{acc.institutionType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <span>{acc.email}</span>
                        <button
                          onClick={() => handleCopy(acc.email, acc.email)}
                          title="Copy Email"
                          className="p-1 hover:text-white text-slate-500 rounded"
                        >
                          {copiedEmail === acc.email ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-400">
                      {(acc.modules || []).slice(0, 3).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLaunchImpersonation(acc)}
                          title="Launch authenticated session"
                          className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Launch</span>
                        </button>

                        <button
                          onClick={() => {
                            setResettingAccount(acc);
                            setOneTimePassword(null);
                            handleResetPassword(acc.email);
                          }}
                          title="Reset temporary password"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resettingAccount && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Temporary Password Reset</span>
              </h3>
              <button onClick={() => setResettingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Account: <strong className="text-white">{resettingAccount.email}</strong> ({resettingAccount.role})
            </p>

            {isResetting ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                <p className="text-xs">Generating cryptographic secret & updating PBKDF2 hash...</p>
              </div>
            ) : oneTimePassword ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-2">
                  <span className="text-[11px] text-slate-400 block uppercase font-bold">One-Time Temporary Password</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-base font-black text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-800/80">
                      {oneTimePassword}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(oneTimePassword);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
                    >
                      {copiedPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  ⚠️ This password is displayed only once and hashed in the database. Give this password directly to the client evaluating this role.
                </p>

                <button
                  onClick={() => setResettingAccount(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
