'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PRESET_DEMO_TENANTS } from '@/lib/constants';
import {
  Building2,
  GraduationCap,
  BookCheck,
  Microscope,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Compass
} from 'lucide-react';

export default function TenantPublicWebsitePage() {
  const params = useParams();
  const slug = (params?.tenantSlug as string) || 'dhaka-ideal-school';

  const tenant =
    PRESET_DEMO_TENANTS.find((t) => t.slug === slug) || PRESET_DEMO_TENANTS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top CMS Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.shortName.slice(0, 2)}
            </div>
            <div>
              <h1 className="font-bold text-base text-white leading-tight">{tenant.name}</h1>
              <p className="text-[10px] text-slate-400">EIIN: {tenant.eiin} • {tenant.board}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${tenant.slug}/dashboard`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              Login to ERP Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Official Public Institutional Website (EduERP CMS)</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Excellence in Education, Character & Innovation
        </h2>

        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {tenant.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href={`/apply/${slug}`}
            className="px-6 py-3 rounded-xl font-bold text-xs text-white shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            <Compass className="w-4 h-4" />
            <span>Apply Online for Admission</span>
          </Link>
          <Link
            href="/results"
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Check Examination Results
          </Link>
        </div>
      </section>

      {/* Leadership Welcome Message */}
      <section className="py-12 px-6 max-w-5xl mx-auto border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="text-center md:text-left">
          <div
            className="w-24 h-24 rounded-3xl mx-auto md:mx-0 flex items-center justify-center text-3xl font-black text-white shadow-xl mb-3"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            🎓
          </div>
          <h3 className="font-bold text-base text-white">{tenant.headName}</h3>
          <p className="text-xs text-slate-400">{tenant.headTitle}</p>
        </div>

        <div className="md:col-span-2 space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <h4 className="font-bold text-sm text-white">Message from the {tenant.headTitle}</h4>
          <p>
            &quot;Welcome to {tenant.name}. We are dedicated to providing a transformative educational environment powered by world-class academic governance, smart digital learning infrastructure, and strong ethical values.&quot;
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 {tenant.name}. Powered by EduERP Campus Management SaaS.</p>
      </footer>
    </div>
  );
}
