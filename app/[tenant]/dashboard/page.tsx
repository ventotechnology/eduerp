'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { getTenantRouteSlug } from '@/lib/tenant/tenant-aliases';
import { getTranslation } from '@/lib/i18n';
import { evaluatePredictiveRisks } from '@/lib/ai-assistant';
import { TenantOnboardingWizard } from '@/components/onboarding/tenant-onboarding-wizard';
import {
  Users,
  GraduationCap,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  BookCheck,
  Microscope,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Bot
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const params = useParams();
  const { tenantSlug, branding, institutionType, institutionTypeConfig, language, campuses, activeCampusId } = useTenant();
  const urlTenant = (params?.tenant as string) || '';
  const routeSlug = getTenantRouteSlug(urlTenant, tenantSlug);
  const predictiveRisks = evaluatePredictiveRisks(tenantSlug);

  const activeCampus = campuses.find((c) => c.id === activeCampusId) || campuses[0];
  const isMadrasha = institutionType === 'MADRASHA';
  const isUniversity = institutionType === 'UNIVERSITY';
  const isCollege = institutionType === 'COLLEGE';

  // Sample Chart Data
  const attendanceData = [
    { day: 'Sun', students: 94.2, staff: 98.0 },
    { day: 'Mon', students: 95.8, staff: 97.5 },
    { day: 'Tue', students: 93.1, staff: 96.8 },
    { day: 'Wed', students: 94.5, staff: 98.5 },
    { day: 'Thu', students: 92.4, staff: 97.0 }
  ];

  const feeBreakdown = [
    { name: 'bKash Gateway', value: 245000, color: '#e11d48' },
    { name: 'Nagad Gateway', value: 115000, color: '#ea580c' },
    { name: 'Bank & Cards', value: 82500, color: '#2563eb' },
    { name: 'Cash Counter', value: 40000, color: '#059669' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Institution & Vertical Engine Badge */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white shadow-xs"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {institutionTypeConfig.label}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Academic Session 2026 • {activeCampus.name}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {branding.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {branding.address} • Affiliated with {branding.boardAffiliation || 'National Board'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${routeSlug}/ai-assistant`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition"
          >
            <Bot className="w-4 h-4" />
            <span>AI Copilot</span>
          </Link>
          <Link
            href={`/${routeSlug}/examination`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
          >
            <Award className="w-4 h-4" />
            <span>Exams & Marks</span>
          </Link>
          <Link
            href={`/${routeSlug}/finance`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
          >
            <DollarSign className="w-4 h-4" />
            <span>Fee Checkout</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Wizard (displays dynamically if incomplete) */}
      <TenantOnboardingWizard tenantSlug={routeSlug} />

      {/* 4 Core KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {getTranslation('totalStudents', language)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCampus.studentCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +8.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Enrolled across all active sections</p>
        </div>

        {/* Staff & Faculty */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {getTranslation('totalStaff', language)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCampus.teacherCount}
            </span>
            <span className="text-[11px] text-slate-400">Faculty & Officers</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average 97.8% biometric attendance</p>
        </div>

        {/* Today's Fee Collection */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {getTranslation('todayCollection', language)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ৳ 4,82,500
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">bKash: 62% • Nagad: 21% • Cards: 17%</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {getTranslation('attendanceRate', language)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              93.4%
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">1,402 Present</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Smart RFID & mobile classroom sync</p>
        </div>
      </div>

      {/* Vertical Engine Spotlight Card */}
      {isMadrasha && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-700/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookCheck className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Madrasha Vertical Engine • Hifzul Quran 30-Para Tracker
                </span>
              </div>
              <h3 className="text-xl font-black">
                Active Hifz Halqas & Daily Sabak Progress
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
                Real-time tracking of 142 memorizers across Halqa Al-Furqan & Abu Bakr (R). 89% completed daily Sabak today.
              </p>
            </div>
            <Link
              href={`/${routeSlug}/hifz`}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Open Hifz Manager</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {isUniversity && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Microscope className="w-5 h-5 text-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  University Vertical Engine • Semesters & Research Portal
                </span>
              </div>
              <h3 className="text-xl font-black">
                Credit Add/Drop, Thesis Defense & UGC Grants
              </h3>
              <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl">
                4 Faculties, 12 Degree Programs (BSc/BBA/MSc). Spring 2026 Course registration active with 112 credits completion average.
              </p>
            </div>
            <Link
              href={`/${routeSlug}/faculty-research`}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Open Higher-Ed Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Velocity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Weekly Attendance Velocity Trend (%)
              </h3>
              <p className="text-xs text-slate-400">Comparing Student vs Faculty daily presence</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
              Biometric Live Sync
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="staffGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#studentGrad)" name="Students (%)" />
                <Area type="monotone" dataKey="staff" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#staffGrad)" name="Faculty/Staff (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Fee Gateway Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Fee Collection Channels
            </h3>
            <p className="text-xs text-slate-400 mb-4">Payment gateway split for August</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeBreakdown}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {feeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`৳ ${(value as number).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {feeBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">
                  ৳ {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Predictive Risk & Early Warning Scorecards */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              {getTranslation('riskAlerts', language)}
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
            {predictiveRisks.length} Action Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictiveRisks.map((risk) => (
            <div
              key={risk.id}
              className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                    {risk.riskFactor.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                    {risk.riskScore}% Risk
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {risk.studentName} ({risk.studentIdNumber})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {risk.classNameOrProgram}
                </p>

                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">
                  {risk.primaryReason}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/60 text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-start gap-1">
                <Bot className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600" />
                <span>{risk.recommendedIntervention}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
