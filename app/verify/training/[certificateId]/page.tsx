'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Download,
  Printer
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased print:bg-white print:text-slate-900">
      {/* Header - Hidden in Print */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 print:hidden">
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
      <main className="flex-1 py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex flex-col items-center justify-center print:p-0 print:max-w-none">
        {loading ? (
          <div className="text-center py-20 text-slate-400 print:hidden">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-mono tracking-widest uppercase">Validating Credential with EduERP Certificate Registry...</p>
          </div>
        ) : error || !cert ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-4 max-w-md w-full">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Invalid or Unverified Credential</h2>
            <p className="text-xs text-slate-400">
              Certificate number <span className="font-mono text-rose-300 font-bold">{certificateId}</span> could not be verified in the official EduERP certificate registry.
            </p>
            <Link
              href="/training"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
            >
              Browse Certified Programs
            </Link>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Status Alert if Revoked */}
            {cert.isRevoked && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold block">REVOKED CERTIFICATE</span>
                  <span>This credential was revoked by the issuer on {new Date(cert.revokedAt).toLocaleDateString()}. Reason: {cert.revocationReason || 'Administrative revocation'}</span>
                </div>
              </div>
            )}

            {/* Certificate Card */}
            <div className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden text-center print:border-4 print:border-emerald-600 print:bg-white print:text-slate-900 print:shadow-none">
              {/* Background Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

              {/* Seal & Badge */}
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${cert.isRevoked ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'} border text-xs font-bold font-mono print:text-emerald-700 print:border-emerald-700`}>
                  {cert.isRevoked ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{cert.isRevoked ? 'REVOKED CREDENTIAL' : 'OFFICIAL VERIFIED CREDENTIAL'}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight print:text-slate-900">
                  Certificate of Competency
                </h2>
                <p className="text-xs text-slate-400 print:text-slate-600">
                  Issued by <span className="text-white font-bold print:text-slate-900">Vento Technology</span> • EduERP Education OS
                </p>
              </div>

              {/* Candidate & Course Details */}
              <div className="space-y-4 py-4 border-y border-slate-800/80 print:border-slate-300">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block print:text-slate-600">
                  This is to officially certify that
                </span>
                <h3 className="text-2xl md:text-4xl font-black text-emerald-400 print:text-emerald-700">
                  {cert.userName}
                </h3>
                <p className="text-xs text-slate-300 print:text-slate-700">
                  has successfully completed all required curriculum modules, institutional workflows, and evaluation quizzes for:
                </p>
                <h4 className="text-lg md:text-xl font-bold text-white print:text-slate-900">
                  {cert.courseTitle || cert.course?.title || 'EduERP Professional Certification'}
                </h4>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Certificate ID</span>
                  <span className="font-mono font-bold text-emerald-400 print:text-emerald-700">{cert.certificateNumber}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Issue Date</span>
                  <span className="font-semibold text-slate-200 print:text-slate-800">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Institution / Role</span>
                  <span className="font-semibold text-slate-200 truncate block print:text-slate-800">{cert.institutionName || 'Certified Professional'}</span>
                </div>
              </div>

              {/* Issuer Signature & Trust Note */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 print:text-slate-600">
                <div className="flex items-center gap-2 text-left">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 print:text-emerald-700" />
                  <span>{cert.verificationStatement || 'Verified against the official EduERP training certificate registry.'}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-600 print:text-slate-500">
                  https://eduerp.us/verify/training/{cert.certificateNumber}
                </div>
              </div>
            </div>

            {/* Actions: Print / PDF Download - Hidden in Print */}
            <div className="flex items-center justify-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF Certificate</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer - Hidden in Print */}
      <div className="print:hidden">
        <PublicFooter />
      </div>
    </div>
  );
}
