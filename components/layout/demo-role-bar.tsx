'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Shield, LogOut, Loader2 } from 'lucide-react';
import { clearAllTenantCache } from '@/lib/cache/tenant-cache';
import { safeFetchJson } from '@/lib/api/safe-response';

export function DemoRoleBar() {
  const {
    tenantSlug,
    activeRole,
    activeUser,
    branding,
    impersonator
  } = useTenant();

  const [exiting, setExiting] = useState(false);

  // If NOT in active impersonation mode, render nothing
  if (!impersonator) {
    return null;
  }

  const institutionDisplayName = branding?.name || tenantSlug;
  const userDisplayName = activeUser?.name || activeUser?.email || activeRole;

  const handleExit = async () => {
    try {
      setExiting(true);
      clearAllTenantCache();
      const res = await safeFetchJson<{ redirectUrl?: string }>('/api/auth/impersonation/exit', {
        method: 'POST'
      });
      if (res.ok && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        window.location.href = '/super-admin/institutions';
      }
    } catch {
      window.location.href = '/super-admin/institutions';
    }
  };

  return (
    <aside
      aria-label="Platform Super Admin Impersonation Bar"
      className="w-full bg-amber-950 text-amber-200 text-xs border-b border-amber-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-50 sticky top-0 shadow-lg font-sans"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-amber-900 text-amber-300 px-2.5 py-1 rounded border border-amber-700">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Super Admin Impersonation</span>
        </div>
        <span className="text-amber-100 font-medium text-xs">
          Impersonating <strong className="text-white font-semibold">{institutionDisplayName}</strong> as{' '}
          <strong className="text-amber-300 font-semibold">{userDisplayName}</strong> ({activeRole})
        </span>
        <span className="text-amber-400/80 text-[11px] hidden lg:inline">
          Actor: <span className="font-mono text-amber-200">{impersonator.email}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-amber-400/70 hidden sm:inline">
          Session expires in 60m • Audited
        </span>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          {exiting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exiting...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Impersonation</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
