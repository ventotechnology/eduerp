'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Feature {
  id: string;
  featureKey: string;
  name?: string | null;
  description?: string | null;
  isEnabled: boolean;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  monthlyDiscount: number;
  annualDiscount: number;
  trialDays: number;
  setupFee: number;
  maxStudents: number;
  maxCampuses: number;
  maxUsers: number;
  maxTeachers: number;
  maxStorageGb: number;
  includedSms: number;
  includedEmails: number;
  apiAccess: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  isFeatured: boolean;
  badge?: string | null;
  buttonText: string;
  features: Feature[];
}

export default function PricingClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  return (
    <div className="flex flex-col items-center">
      {/* Billing Switcher */}
      <div className="flex items-center justify-center p-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner mb-14">
        <button
          type="button"
          onClick={() => setBillingCycle('MONTHLY')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
            billingCycle === 'MONTHLY'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly Billing
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('ANNUAL')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
            billingCycle === 'ANNUAL'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Annual Billing</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            billingCycle === 'ANNUAL' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            Save ~17%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {initialPlans.map((plan) => {
          const isAnnual = billingCycle === 'ANNUAL';
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                plan.isFeatured
                  ? 'bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-[1.02] z-10'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/90'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" /> {plan.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pt-3 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-slate-400">{plan.currency}</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">/{isAnnual ? 'year' : 'month'}</span>
                  </div>
                  {isAnnual && (
                    <div className="text-xs text-emerald-400 font-medium mt-1">
                      BDT {monthlyEquivalent.toLocaleString()}/mo billed annually
                    </div>
                  )}
                  {plan.trialDays > 0 && (
                    <div className="inline-flex items-center gap-1 mt-2 text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> {plan.trialDays}-day free trial included
                    </div>
                  )}
                </div>

                {/* Limits Breakdown */}
                <div className="space-y-2 py-4 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Capacity:</span>
                    <span className="font-bold text-white">{plan.maxStudents.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Campuses Included:</span>
                    <span className="font-bold text-white">{plan.maxCampuses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage Quota:</span>
                    <span className="font-bold text-white">{plan.maxStorageGb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SMS / Month:</span>
                    <span className="font-bold text-white">{plan.includedSms.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admin Staff & Teachers:</span>
                    <span className="font-bold text-white">{plan.maxUsers} Users</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6 mb-8">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                    Features Included:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat.id} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feat.name || feat.featureKey}</span>
                      </li>
                    ))}
                    {plan.apiAccess && (
                      <li className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>REST API & Webhooks</span>
                      </li>
                    )}
                    {plan.customDomain && (
                      <li className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>Custom Domain Mapping</span>
                      </li>
                    )}
                    {plan.whiteLabel && (
                      <li className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>Institutional White-Labeling</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Link
                  href={`/signup?plan=${plan.slug}&billing=${billingCycle}`}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    plan.isFeatured
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                      : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span>{plan.buttonText || 'Choose Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
