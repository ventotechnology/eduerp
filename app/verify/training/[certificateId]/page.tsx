'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Building2,
  User,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  QrCode
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateId = (params?.certificateId as string) || '';

  const [cert, setCert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) return;
    setLoading(true);
    fetch(`/api/training/verify?certificateNumber=${encodeURIComponent(certificateId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCert(data.data);
        } else {
          setError(data.error || 'Certificate not recognized');
        }
      })
      .catch(() => setError('Failed to verify certificate'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                Official Credential Registry
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/training" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Training Academy</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex flex-col items-center justify-center">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-mono tracking-widest uppercase">Validating Credential Hash with EduERP Trust Registry...</p>
          </div>
        ) : error || !cert ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-4 max-w-md w-full">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Invalid or Unverified Credential</h2>
            <p className="text-xs text-slate-400">
              Certificate number <span className="font-mono text-rose-300 font-bold">{certificateId}</span> could not be verified in our institutional certification registry.
            </p>
            <Link
              href="/training"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
            >
              Browse Certified Programs
            </Link>
          </div>
        ) : (
          <div className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden text-center">
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Seal & Badge */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>OFFICIAL VERIFIED CREDENTIAL</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Certificate of Competency
              </h2>
              <p className="text-xs text-slate-400">
                Issued by <span className="text-white font-bold">Vento Technology</span> • EduERP Education OS
              </p>
            </div>

            {/* Candidate & Course Details */}
            <div className="space-y-4 py-4 border-y border-slate-800/80">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block">
                This is to officially certify that
              </span>
              <h3 className="text-2xl md:text-4xl font-black text-emerald-400">
                {cert.userName}
              </h3>
              <p className="text-xs text-slate-300">
                has successfully completed all required curriculum modules, workflows, and evaluation quizzes for:
              </p>
              <h4 className="text-lg md:text-xl font-bold text-white">
                {cert.course?.title || 'EduERP Professional Certification'}
              </h4>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Certificate ID</span>
                <span className="font-mono font-bold text-emerald-400">{cert.certificateNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Issue Date</span>
                <span className="font-semibold text-slate-200">{new Date(cert.issuedAt).toLocaleDateString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Institution / Role</span>
                <span className="font-semibold text-slate-200 truncate block">{cert.institutionName || 'Professional'}</span>
              </div>
            </div>

            {/* Issuer Signature & Trust Note */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Digitally signed and cryptographically verified on PostgreSQL 16 master ledger.</span>
              </div>
              <Link
                href="/training"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                EduERP Academy
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
