'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { PRESET_DEMO_TENANTS, DEMO_USER_PERSONAS } from '@/lib/constants';
import { UserRole, LanguageCode } from '@/lib/types';
import { Sparkles, Globe, Building2, Shield, QrCode, Search, ExternalLink } from 'lucide-react';

export function DemoRoleBar() {
  const {
    tenantSlug,
    activeRole,
    language,
    campuses,
    activeCampusId,
    switchTenant,
    switchRole,
    switchCampus,
    switchLanguage
  } = useTenant();

  return (
    <aside aria-label="Interactive Demo Switcher" className="w-full bg-slate-900 text-slate-100 text-xs border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-50 sticky top-0 shadow-sm">
      {/* Left: Quick Switchers */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Demo Switcher</span>
        </div>

        {/* Institution Type Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 hidden sm:inline">Institution:</span>
          <select
            value={tenantSlug}
            onChange={(e) => switchTenant(e.target.value)}
            className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
          >
            {PRESET_DEMO_TENANTS.map((t) => (
              <option key={t.slug} value={t.slug} className="bg-slate-900 text-white">
                [{t.type}] {t.shortName} - {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Persona / Role Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 hidden sm:inline">Role Persona:</span>
          <select
            value={activeRole}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
          >
            {DEMO_USER_PERSONAS.map((p) => (
              <option key={p.role} value={p.role} className="bg-slate-900 text-white">
                {p.avatar} {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Campus Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
          <span className="text-slate-400">Campus:</span>
          <select
            value={activeCampusId}
            onChange={(e) => switchCampus(e.target.value)}
            className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Language & Quick Destination Links */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
          <Globe className="w-3 h-3 text-cyan-400" />
          <button
            onClick={() => switchLanguage('en')}
            className={`px-1 rounded ${language === 'en' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
          >
            EN
          </button>
          <span>|</span>
          <button
            onClick={() => switchLanguage('bn')}
            className={`px-1 rounded ${language === 'bn' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
          >
            বাংলা
          </button>
          <span>|</span>
          <button
            onClick={() => switchLanguage('ar')}
            className={`px-1 rounded ${language === 'ar' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
          >
            عربي
          </button>
        </div>

        {/* Super Admin Quick Link */}
        <Link
          href="/super-admin"
          className="flex items-center gap-1 bg-purple-950/80 text-purple-300 border border-purple-800/80 hover:bg-purple-900 px-2 py-1 rounded font-medium transition"
        >
          <Shield className="w-3 h-3" />
          <span>SaaS Super Admin</span>
        </Link>

        {/* Public Certificate QR Verify Link */}
        <Link
          href="/verify/VRF-DIMS-9041-A1"
          className="hidden md:flex items-center gap-1 bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 px-2 py-1 rounded transition"
          title="Test Tamper-Proof Certificate Verification"
        >
          <QrCode className="w-3 h-3" />
          <span>Verify QR</span>
        </Link>

        {/* Public Results Link */}
        <Link
          href="/results"
          className="hidden md:flex items-center gap-1 bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 px-2 py-1 rounded transition"
        >
          <Search className="w-3 h-3" />
          <span>Public Results</span>
        </Link>

        {/* Public Website CMS Link */}
        <Link
          href={`/site/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-1 bg-blue-900/60 text-blue-300 border border-blue-800 hover:bg-blue-800 px-2 py-1 rounded transition"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Website CMS</span>
        </Link>
      </div>
    </aside>
  );
}
