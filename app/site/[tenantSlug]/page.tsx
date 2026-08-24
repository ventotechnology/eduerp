import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { PRESET_DEMO_TENANTS } from '@/lib/constants';
import { resolveCanonicalTenantSlug } from '@/lib/tenant/tenant-guard';
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
  Compass,
  Award,
  ShieldCheck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SitePageProps {
  params: Promise<{ tenantSlug: string }> | { tenantSlug: string };
}

export default async function TenantPublicWebsitePage({ params }: SitePageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.tenantSlug || 'demo-school';
  const canonicalSlug = resolveCanonicalTenantSlug(rawSlug);

  // 1. Dynamic Database Lookup for Real Customers & Provisioned Tenants
  const dbTenant = await db.tenant.findFirst({
    where: {
      OR: [
        { slug: canonicalSlug },
        { slug: rawSlug }
      ]
    },
    include: {
      institution: {
        include: {
          campuses: true
        }
      }
    }
  });

  // 2. Preset Fallback for Demo Showroom
  const preset = PRESET_DEMO_TENANTS.find((t) => t.slug === canonicalSlug || t.slug === rawSlug);

  const tenantName = dbTenant?.institution?.name || preset?.name || 'Educational Institution';
  const shortName = dbTenant?.institution?.shortName || preset?.shortName || 'EDU';
  const primaryColor = dbTenant?.institution?.primaryColor || preset?.primaryColor || '#059669';
  const secondaryColor = dbTenant?.institution?.secondaryColor || preset?.secondaryColor || '#0f172a';
  const eiin = dbTenant?.institution?.eiin || preset?.eiin || '139820';
  const board = dbTenant?.institution?.boardAffiliation || dbTenant?.institution?.madrashaBoardInfo || preset?.board || 'Education Board';
  const address = dbTenant?.institution?.address || preset?.address || 'Uttara, Dhaka, Bangladesh';
  const phone = dbTenant?.institution?.phone || (preset as any)?.phone || '01988115666';
  const email = dbTenant?.institution?.email || (preset as any)?.email || 'contact@scholarsita.com';
  const headName = dbTenant?.institution?.principalHeadName || preset?.headName || 'Mohammad Saifullah';
  const headTitle = dbTenant?.institution?.principalHeadTitle || preset?.headTitle || 'Principal / Muhtamim';
  const description = preset?.description || `Official public portal of ${tenantName}. Committed to educational excellence, academic integrity, character building, and holistic student development.`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top CMS Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {shortName.slice(0, 2)}
            </div>
            <div>
              <h1 className="font-bold text-base text-white leading-tight">{tenantName}</h1>
              <p className="text-[10px] text-slate-400">EIIN: {eiin} • {board}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${canonicalSlug}/dashboard`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Login to ERP Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Official Public Institutional Website (EduERP CMS)</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Excellence in Education, Character & Innovation
        </h2>

        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href={`/apply/${canonicalSlug}`}
            className="px-6 py-3 rounded-xl font-bold text-xs text-white shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
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

      {/* Institutional Highlights */}
      <section className="py-10 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Academic Excellence</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard curriculum integrated with comprehensive assessment workflows, continuous evaluation, and high academic standards.
          </p>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Digital Campus</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paperless administration with smart attendance, digital LMS classrooms, fee payment gateways, and transparent guardian portal.
          </p>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-white">Character & Values</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fostering ethical discipline, moral responsibility, and leadership qualities in a secure, nurturing educational environment.
          </p>
        </div>
      </section>

      {/* Leadership Welcome Message */}
      <section className="py-12 px-6 max-w-5xl mx-auto border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="text-center md:text-left">
          <div
            className="w-24 h-24 rounded-3xl mx-auto md:mx-0 flex items-center justify-center text-3xl font-black text-white shadow-xl mb-3"
            style={{ backgroundColor: primaryColor }}
          >
            🎓
          </div>
          <h3 className="font-bold text-base text-white">{headName}</h3>
          <p className="text-xs text-slate-400">{headTitle}</p>
        </div>

        <div className="md:col-span-2 space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <h4 className="font-bold text-sm text-white">Message from the {headTitle}</h4>
          <p>
            &quot;Welcome to {tenantName}. We are dedicated to providing a transformative educational environment powered by world-class academic governance, smart digital learning infrastructure, and strong ethical values.&quot;
          </p>
        </div>
      </section>

      {/* Contact & Location Details */}
      <section className="py-8 px-6 max-w-5xl mx-auto border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{email}</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 {tenantName}. Powered by EduERP Universal Campus Management SaaS.</p>
      </footer>
    </div>
  );
}
