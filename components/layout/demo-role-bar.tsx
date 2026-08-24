'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Shield } from 'lucide-react';

export function DemoRoleBar() {
  const {
    tenantSlug,
    activeRole,
    impersonator,
    exitImpersonation
  } = useTenant();

  // If NOT in active impersonation mode, render nothing across all public and standard pages
  if (!impersonator) {
    return null;
  }

  return (
    <aside aria-label="QA Impersonation Bar" className="w-full bg-amber-950 text-amber-200 text-xs border-b border-amber-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-50 sticky top-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] bg-amber-900/90 text-amber-300 px-2.5 py-1 rounded border border-amber-700/60">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>QA Impersonation Mode</span>
        </div>
        <span className="text-amber-100 font-medium">
          Acting as: <strong className="text-white font-semibold">{activeRole}</strong> ({tenantSlug})
        </span>
        <span className="text-amber-300/70 text-[11px]">
          Actor: <span className="font-mono text-amber-200">{impersonator.email}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-amber-400/80 hidden md:inline">
          Session expires in 60m • Audited
        </span>
        {exitImpersonation && (
          <button
            onClick={() => exitImpersonation()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded text-xs transition shadow-sm"
          >
            Exit Impersonation
          </button>
        )}
      </div>
    </aside>
  );
}
