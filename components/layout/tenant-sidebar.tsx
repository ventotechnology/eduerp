'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { getTenantRouteSlug } from '@/lib/tenant/tenant-aliases';
import { getTranslation } from '@/lib/i18n';
import { ContextualHelpDrawer } from '@/components/support/contextual-help-drawer';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  BookOpen,
  FileSpreadsheet,
  DollarSign,
  Briefcase,
  Layers,
  Building,
  Radio,
  Bot,
  FileText,
  Settings,
  Sparkles,
  Award,
  BookCheck,
  Microscope,
  Compass,
  Bus,
  ShieldCheck
} from 'lucide-react';

export function TenantSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { tenantSlug, branding, institutionType, institutionTypeConfig, language, activeRole } = useTenant();
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  const urlTenant = (params?.tenant as string) || '';
  const routeSlug = getTenantRouteSlug(urlTenant, tenantSlug);

  const isMadrasha = institutionType === 'MADRASHA';
  const isUniversity = institutionType === 'UNIVERSITY';

  const prefetchRoute = useCallback((href: string) => {
    if (!href || prefetchedRoutes.current.has(href)) return;
    prefetchedRoutes.current.add(href);
    router.prefetch(href);
  }, [router]);

  // Proactively prefetch primary high-traffic tenant modules on mount
  useEffect(() => {
    if (routeSlug) {
      const coreRoutes = [
        `/${routeSlug}/students`,
        `/${routeSlug}/academics`,
        `/${routeSlug}/admission`,
        `/${routeSlug}/hr`,
        `/${routeSlug}/finance`,
        `/${routeSlug}/facilities`,
        `/${routeSlug}/communication`,
        `/${routeSlug}/settings`
      ];
      // Stagger prefetching to maintain high responsiveness
      const timer = setTimeout(() => {
        coreRoutes.forEach((route) => prefetchRoute(route));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [routeSlug, prefetchRoute]);

  // Navigation Items
  const navItems = [
    {
      label: getTranslation('dashboard', language),
      href: `/${routeSlug}/dashboard`,
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'ACCOUNTANT', 'LIBRARIAN', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('admission', language),
      href: `/${routeSlug}/admission`,
      icon: Compass,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    {
      label: getTranslation('students', language),
      href: `/${routeSlug}/students`,
      icon: Users,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'ACCOUNTANT', 'PARENT']
    },
    {
      label: getTranslation('academics', language),
      href: `/${routeSlug}/academics`,
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    // Madrasha-exclusive Engine: Hifzul Quran Manager
    ...(isMadrasha
      ? [
          {
            label: getTranslation('hifzTracker', language),
            href: `/${routeSlug}/hifz`,
            icon: BookCheck,
            badge: 'Hifz Engine',
            badgeColor: 'bg-emerald-700 text-emerald-100',
            roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT', 'PARENT']
          }
        ]
      : []),
    // University-exclusive Engine: Faculty, Research & Thesis Defense
    ...(isUniversity
      ? [
          {
            label: getTranslation('higherEdFaculty', language),
            href: `/${routeSlug}/faculty-research`,
            icon: Microscope,
            badge: 'Higher-Ed',
            badgeColor: 'bg-indigo-700 text-indigo-100',
            roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT']
          }
        ]
      : []),
    {
      label: getTranslation('examination', language),
      href: `/${routeSlug}/examination`,
      icon: Award,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('lms', language),
      href: `/${routeSlug}/lms`,
      icon: Layers,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT']
    },
    {
      label: getTranslation('finance', language),
      href: `/${routeSlug}/finance`,
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('hrPayroll', language),
      href: `/${routeSlug}/hr`,
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ACCOUNTANT']
    },
    {
      label: getTranslation('facilities', language),
      href: `/${routeSlug}/facilities`,
      icon: Building,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('communication', language),
      href: `/${routeSlug}/communication`,
      icon: Radio,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('aiAssistant', language),
      href: `/${routeSlug}/ai-assistant`,
      icon: Bot,
      badge: 'AI Copilot',
      badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    {
      label: getTranslation('reports', language),
      href: `/${routeSlug}/custom-reports`,
      icon: FileText,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ACCOUNTANT']
    },
    {
      label: getTranslation('settings', language),
      href: `/${routeSlug}/settings`,
      icon: Settings,
      roles: ['SUPER_ADMIN', 'PRINCIPAL']
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-[calc(100vh-42px)] border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-lg">
      <div>
        {/* Institution Brand Badge */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.shortName.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-sm text-white truncate">{branding.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-blue-400 border border-slate-700">
                {institutionTypeConfig.academicUnitLabel} Core
              </span>
              {branding.eiin && (
                <span className="text-[10px] text-slate-400">EIIN: {branding.eiin}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Help & Support Button + Footer / Tenant Mode Indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs space-y-2">
        <button
          onClick={() => setHelpDrawerOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-semibold text-xs transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Help & Guides</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
            Support
          </span>
        </button>

        <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
          <span>Engine:</span>
          <span className="text-emerald-400 font-semibold">{institutionType}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>Grading:</span>
          <span className="text-slate-200">{institutionTypeConfig.gradingType.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <ContextualHelpDrawer
        isOpen={helpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
        currentModule={pathname.split('/')[2]?.toUpperCase() || 'DASHBOARD'}
      />
    </aside>
  );
}
