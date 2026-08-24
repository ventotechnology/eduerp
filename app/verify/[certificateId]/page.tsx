'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  Award,
  ArrowLeft,
  Lock,
  Printer,
  Search
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const initialCertId = (params?.certificateId as string) || '';

  const [searchCode, setSearchCode] = useState(initialCertId);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || searchCode).trim();
    if (!code) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/exams?action=VERIFY_CERTIFICATE&certificateNumber=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success) {
        setVerificationResult(json.data);
      } else {
        setVerificationResult(null);
        setErrorMessage(json.error?.message || 'Certificate not found.');
      }
    } catch (err: any) {
      setVerificationResult(null);
      setErrorMessage('Verification server communication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <div className="max-w-2xl w-full mx-auto space-y-6 pt-6">
        {/* Navigation back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Gateway</span>
        </Link>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographically Verified Public Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Certificate & Transcript Authenticity Verification
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scan any physical QR code on EduERP issued transcripts or certificates to confirm legitimacy against immutable database records.
          </p>
        </div>

        {/* Search / Scan Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-2">
          <input
            type="text"
            placeholder="Enter Certificate / Transcript Number (e.g. CERT-2026-000123)"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs"
          />
          <button
            onClick={() => handleVerify()}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Verifying...' : 'Verify Now'}</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center gap-3 text-rose-300 text-xs">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            {/* Status Header */}
            {verificationResult.isValid ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-emerald-300">
                      AUTHENTIC & VERIFIED
                    </h3>
                    <p className="text-[11px] text-emerald-200/80 font-mono">
                      Certificate #{verificationResult.certificateNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 block">Registry Status</span>
                  <span className="text-xs font-bold text-emerald-400">ACTIVE & SECURE</span>
                </div>
              </div>
            ) : verificationResult.status === 'REVOKED' ? (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-rose-300">
                      OFFICIALLY REVOKED
                    </h3>
                    <p className="text-[11px] text-rose-200/80 font-mono">
                      Reason: {verificationResult.revocationReason}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/80 flex items-center gap-3 text-amber-300">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Verification Unsuccessful</h3>
                  <p className="text-xs">{verificationResult.message}</p>
                </div>
              </div>
            )}

            {/* Record Details Grid */}
            {verificationResult.isValid && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Student Information
                  </span>
                  <p><strong>Full Name:</strong> {verificationResult.studentName}</p>
                  <p><strong>Program / Class:</strong> {verificationResult.programOrClass || 'General Academic'}</p>
                  <p><strong>GPA / Division:</strong> <span className="text-emerald-400 font-black">{verificationResult.gpaOrDivision || 'Satisfactory'}</span></p>
                  <p><strong>Passing Year:</strong> {verificationResult.passingYear}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Issuing Authority
                  </span>
                  <p><strong>Institution:</strong> {verificationResult.institutionName}</p>
                  <p><strong>Document Type:</strong> {verificationResult.certificateType}</p>
                  <p><strong>Issue Date:</strong> {new Date(verificationResult.issueDate).toLocaleDateString()}</p>
                  <p><strong>Signatory:</strong> {verificationResult.signatoryTitle}</p>
                </div>
              </div>
            )}

            {/* Cryptographic Seal */}
            {verificationResult.integrityHash && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Digital Integrity Seal (HMAC-SHA256):</span>
                </div>
                <span className="font-mono text-slate-300 font-semibold truncate max-w-[260px]">
                  {verificationResult.integrityHash}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Authorized EduERP Institutional Registry Record
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Verification Proof</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-[10px] text-slate-600">
        EduERP Cryptographic Certificate Integrity Engine • Tamper-Evident Verification
      </footer>
    </div>
  );
}
