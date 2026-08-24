'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { getTranslation } from '@/lib/i18n';
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
  const { branding, institutionType, institutionTypeConfig, language, activeRole } = useTenant();

  const isMadrasha = institutionType === 'MADRASHA';
  const isUniversity = institutionType === 'UNIVERSITY';

  // Navigation Items
  const navItems = [
    {
      label: getTranslation('dashboard', language),
      href: `/${branding.shortName.toLowerCase()}/dashboard`,
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'ACCOUNTANT', 'LIBRARIAN', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('admission', language),
      href: `/${branding.shortName.toLowerCase()}/admission`,
      icon: Compass,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    {
      label: getTranslation('students', language),
      href: `/${branding.shortName.toLowerCase()}/students`,
      icon: Users,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'ACCOUNTANT', 'PARENT']
    },
    {
      label: getTranslation('academics', language),
      href: `/${branding.shortName.toLowerCase()}/academics`,
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    // Madrasha-exclusive Engine: Hifzul Quran Manager
    ...(isMadrasha
      ? [
          {
            label: getTranslation('hifzTracker', language),
            href: `/${branding.shortName.toLowerCase()}/hifz`,
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
            href: `/${branding.shortName.toLowerCase()}/faculty-research`,
            icon: Microscope,
            badge: 'Higher-Ed',
            badgeColor: 'bg-indigo-700 text-indigo-100',
            roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT']
          }
        ]
      : []),
    {
      label: getTranslation('examination', language),
      href: `/${branding.shortName.toLowerCase()}/examination`,
      icon: Award,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('lms', language),
      href: `/${branding.shortName.toLowerCase()}/lms`,
      icon: Layers,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT']
    },
    {
      label: getTranslation('finance', language),
      href: `/${branding.shortName.toLowerCase()}/finance`,
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('hrPayroll', language),
      href: `/${branding.shortName.toLowerCase()}/hr`,
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ACCOUNTANT']
    },
    {
      label: getTranslation('facilities', language),
      href: `/${branding.shortName.toLowerCase()}/facilities`,
      icon: Building,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('communication', language),
      href: `/${branding.shortName.toLowerCase()}/communication`,
      icon: Radio,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER', 'STUDENT', 'PARENT']
    },
    {
      label: getTranslation('aiAssistant', language),
      href: `/${branding.shortName.toLowerCase()}/ai-assistant`,
      icon: Bot,
      badge: 'AI Copilot',
      badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'TEACHER']
    },
    {
      label: getTranslation('reports', language),
      href: `/${branding.shortName.toLowerCase()}/custom-reports`,
      icon: FileText,
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ACCOUNTANT']
    },
    {
      label: getTranslation('settings', language),
      href: `/${branding.shortName.toLowerCase()}/settings`,
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

      {/* Footer / Tenant Mode Indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>Engine:</span>
          <span className="text-emerald-400 font-semibold">{institutionType}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>Grading:</span>
          <span className="text-slate-200">{institutionTypeConfig.gradingType.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </aside>
  );
}
