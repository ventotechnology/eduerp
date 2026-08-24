'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Upload,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Check,
  Loader2,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  step: number;
  key: string;
  title: string;
  description: string;
  isOptional: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface OnboardingData {
  progress: {
    currentStep: number;
    completedSteps: number[];
    isCompleted: boolean;
    totalSteps: number;
    completionPercent: number;
  };
  steps: Step[];
  tenant?: any;
}

export function TenantOnboardingWizard({ tenantSlug }: { tenantSlug: string }) {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/tenant/onboarding');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // Ignore background fetch failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleCompleteStep = async (stepNumber: number) => {
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE_STEP', stepNumber })
      });
      const json = await res.json();
      if (json.success) {
        await fetchProgress();
      }
    } catch (err) {
      console.error('Failed to complete step', err);
    }
  };

  const handleApplyTemplate = async (templateType: string) => {
    setApplyingTemplate(templateType);
    setTemplateSuccess(null);
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPLY_TEMPLATE', templateType })
      });
      const json = await res.json();
      if (json.success) {
        setTemplateSuccess(json.message || 'Academic template applied successfully.');
        await fetchProgress();
      }
    } catch (err) {
      console.error('Failed to apply template', err);
    } finally {
      setApplyingTemplate(null);
    }
  };

  if (loading || !data || data.progress.isCompleted) {
    return null;
  }

  const { progress, steps, tenant } = data;
  const institutionType = tenant?.institutionType || 'SCHOOL';

  if (minimized) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Setup {progress.completedSteps.length} of {progress.totalSteps} Complete
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                {progress.completionPercent}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Institution Onboarding Checklist</p>
          </div>
        </div>
        <button
          onClick={() => setMinimized(false)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
          title="Expand Setup Wizard"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Welcome to EduERP
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                Setup {progress.completedSteps.length} of {progress.totalSteps} Complete
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete these steps to configure your academic calendar, curriculum, workforce, and fee structure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(true)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
            title="Minimize Setup Wizard"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Onboarding Progress</span>
          <span className="font-bold text-emerald-400">{progress.completionPercent}% Completed</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress.completionPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 1-Click Starter Template Loader */}
      <div className="mb-8 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              1-Click Academic Starter Template
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly create draft classes, sections, and subjects tailored for your institution type.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleApplyTemplate(institutionType)}
              disabled={!!applyingTemplate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              {applyingTemplate ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Structure...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load {institutionType.replace(/_/g, ' ')} Template</span>
                </>
              )}
            </button>
          </div>
        </div>

        {templateSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{templateSuccess}</span>
          </div>
        )}
      </div>

      {/* 14 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {steps.map((s) => {
          return (
            <div
              key={s.step}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                s.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : s.isCurrent
                  ? 'bg-slate-950 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500">Step {s.step}</span>
                  {s.isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3 stroke-[3]" /> Done
                    </span>
                  ) : s.isOptional ? (
                    <span className="text-[10px] text-slate-500">Optional</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-400/80">Required</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{s.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                {!s.isCompleted && (
                  <button
                    onClick={() => handleCompleteStep(s.step)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition"
                  >
                    Mark Done
                  </button>
                )}
                {s.isCompleted && (
                  <span className="text-[10px] text-slate-500">Completed</span>
                )}
                <Link
                  href={`/${tenantSlug}/${getRouteForStep(s.key)}`}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition ml-auto"
                >
                  <span>Configure</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRouteForStep(key: string): string {
  switch (key) {
    case 'INSTITUTION_PROFILE': return 'settings';
    case 'BRANDING': return 'settings';
    case 'ACADEMIC_YEAR': return 'academics';
    case 'CAMPUS': return 'facilities';
    case 'CLASSES': return 'academics';
    case 'SECTIONS': return 'academics';
    case 'SUBJECTS': return 'academics';
    case 'STAFF': return 'hr';
    case 'FEE_STRUCTURE': return 'finance';
    case 'ADMISSION_SETTINGS': return 'admission';
    case 'PAYMENT_GATEWAY': return 'settings/billing';
    case 'STUDENT_IMPORT': return 'students';
    case 'COMMUNICATION': return 'communication';
    case 'GO_LIVE': return 'dashboard';
    default: return 'dashboard';
  }
}
