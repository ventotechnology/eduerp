'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, UserCheck, CreditCard, Check, AlertCircle, Loader2, Sparkles, Globe, Lock, Mail, Phone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Feature {
  id: string;
  featureKey: string;
  name?: string | null;
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
  trialDays: number;
  setupFee: number;
  maxStudents: number;
  maxCampuses: number;
  maxStorageGb: number;
  includedSms: number;
  features: Feature[];
}

const INSTITUTION_TYPES = [
  { value: 'SCHOOL', label: 'Primary / Secondary School' },
  { value: 'COLLEGE', label: 'Higher Secondary / Degree College' },
  { value: 'SCHOOL_AND_COLLEGE', label: 'Combined School & College' },
  { value: 'MADRASHA', label: 'Madrasha (Qawmi / Alia / Hifz)' },
  { value: 'UNIVERSITY', label: 'Private / Public University' },
  { value: 'POLYTECHNIC', label: 'Polytechnic Institute' },
  { value: 'TECHNICAL_INSTITUTE', label: 'Technical / Vocational Institute' },
  { value: 'TRAINING_INSTITUTE', label: 'Professional Training Academy' },
  { value: 'OTHER', label: 'Other Educational Organization' },
];

export default function SignupClient({ plans }: { plans: Plan[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedPlan = searchParams.get('plan') || 'standard';
  const isTrialParam = searchParams.get('trial') === 'true';
  const preselectedBilling = isTrialParam ? 'TRIAL' : (searchParams.get('billing') === 'MONTHLY' ? 'MONTHLY' : 'ANNUAL');

  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(preselectedPlan);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL' | 'TRIAL'>(preselectedBilling);

  // Form State
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('SCHOOL');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [desiredSlug, setDesiredSlug] = useState('');
  
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');

  // Validation & Live Status
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    valid?: boolean;
    message?: string;
  }>({ checking: false });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState<any | null>(null);

  // Find active plan object
  const activePlan = plans.find(p => p.slug === selectedPlanSlug) || plans[0] || null;

  // Live Slug Check Debounce
  useEffect(() => {
    if (!desiredSlug || desiredSlug.trim().length < 3) {
      setSlugStatus({ checking: false, valid: undefined });
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus({ checking: true });
      try {
        const res = await fetch(`/api/signup/validate-slug?slug=${encodeURIComponent(desiredSlug.trim())}`);
        const data = await res.json();
        setSlugStatus({
          checking: false,
          valid: data.valid,
          message: data.message
        });
      } catch {
        setSlugStatus({ checking: false, valid: false, message: 'Could not verify slug availability.' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [desiredSlug]);

  // Auto-generate slug suggestion from institution name if slug is empty
  const handleNameChange = (val: string) => {
    setInstitutionName(val);
    if (!desiredSlug || desiredSlug.trim() === '') {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      setDesiredSlug(generated);
    }
  };

  // Submit Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!institutionName.trim()) {
      setError('Please enter your institution name.');
      return;
    }

    if (!desiredSlug.trim() || slugStatus.valid === false) {
      setError('Please choose a valid and available subdomain slug.');
      return;
    }

    if (!contactPerson.trim()) {
      setError('Please enter the contact person name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: institutionName.trim(),
          institutionType,
          address: address.trim() || 'Dhaka, Bangladesh',
          country,
          desiredSlug: desiredSlug.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          planIdOrCode: activePlan.id,
          billingCycle,
          isTrial: billingCycle === 'TRIAL',
          promoCode: promoCode.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create institution account.');
      }

      if (data.isTrial) {
        setTrialSuccess(data);
        setLoading(false);
      } else {
        // Redirect to Order Checkout
        router.push(`/checkout/${data.orderId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  if (trialSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900 border border-emerald-500/40 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Free Trial Activated Successfully!</h2>
          <p className="text-sm text-slate-300">
            Your {trialSuccess.trialDays || 14}-day free trial for <strong>{trialSuccess.plan?.name || 'EduERP'}</strong> has been provisioned.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Institution:</span>
            <span className="text-white font-bold">{institutionName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tenant Slug:</span>
            <span className="text-emerald-400 font-bold">{trialSuccess.tenantSlug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Workspace URL:</span>
            <span className="text-white">https://eduerp.us/{trialSuccess.tenantSlug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Admin Email:</span>
            <span className="text-white">{email}</span>
          </div>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/login?email=${encodeURIComponent(email)}&returnUrl=/${trialSuccess.tenantSlug}/dashboard`}
            className="py-3 px-6 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span>Sign In to Your Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${trialSuccess.tenantSlug}/dashboard`}
            className="py-3 px-6 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            <span>Open Institution Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAnnual = billingCycle === 'ANNUAL';
  const isTrial = billingCycle === 'TRIAL';
  const price = isTrial ? 0 : (activePlan ? (isAnnual ? activePlan.annualPrice : activePlan.monthlyPrice) : 0);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form Details */}
      <div className="lg:col-span-7 space-y-8">
        {/* Section 1: Institution Details */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">1. Institution Details</h2>
              <p className="text-xs text-slate-400">Basic identification and your custom cloud workspace URL</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Dhaka Scholars International School"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Institution Type *
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Desired Subdomain / Tenant Slug *
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={desiredSlug}
                  onChange={(e) => setDesiredSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. dhaka-scholars"
                  className="w-full pl-4 pr-28 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
                />
                <span className="absolute right-3 text-xs font-mono text-slate-500 pointer-events-none">
                  .eduerp.us
                </span>
              </div>

              {/* Slug Validation Feedback */}
              <div className="mt-1.5 min-h-[20px] text-xs">
                {slugStatus.checking && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> Checking availability...
                  </span>
                )}
                {!slugStatus.checking && slugStatus.valid === true && (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" /> Domain {desiredSlug}.eduerp.us is available!
                  </span>
                )}
                {!slugStatus.checking && slugStatus.valid === false && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {slugStatus.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Campus Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Dhanmondi, Dhaka"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Administrator Account */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2. Administrator / Owner Account</h2>
              <p className="text-xs text-slate-400">This account will have primary Super Admin access to your instance</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contact Person Full Name *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Prof. Mohammad Kabir Hossain"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="principal@school.edu.bd"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile / Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711000000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password (min 8 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Plan Selection & Order Summary */}
      <div className="lg:col-span-5 space-y-6">
        {/* Plan Selector Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Select Package</h3>
            {/* Billing Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('TRIAL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  billingCycle === 'TRIAL'
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                14d Trial
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual (~17% off)
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {plans.map((p) => {
              const isSelected = p.slug === selectedPlanSlug;
              const pPrice = isTrial ? 0 : (isAnnual ? p.annualPrice : p.monthlyPrice);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanSlug(p.slug)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {p.name}
                        {p.trialDays > 0 && (
                          <span className="text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.2 rounded font-semibold">
                            {p.trialDays}d Trial
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Up to {p.maxStudents.toLocaleString()} students · {p.maxCampuses} campus
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">
                      {isTrial ? 'FREE TRIAL' : `BDT ${pPrice.toLocaleString()}`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isTrial ? `${p.trialDays || 14} days` : `/${isAnnual ? 'year' : 'mo'}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo Code Input */}
          {!isTrial && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Promo Code (Optional)
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAUNCH2026"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Order Summary & Checkout CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4">
            {isTrial ? 'Free Trial Summary' : 'Order Summary'}
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300 pb-4 border-b border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Package:</span>
              <span className="font-semibold text-white">{activePlan?.name} ({billingCycle})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isTrial ? 'Trial Period:' : 'Base Subscription:'}</span>
              <span className="font-semibold text-white">
                {isTrial ? `${activePlan?.trialDays || 14} Days Active Trial` : `BDT ${price.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Setup Fee:</span>
              <span className="text-emerald-400 font-semibold">FREE (BDT 0)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Billing Verification:</span>
              <span className="text-slate-400 font-semibold">{isTrial ? 'No Credit Card Required' : 'Instant bKash Gateway'}</span>
            </div>
          </div>

          <div className="pt-4 pb-6 flex items-baseline justify-between">
            <span className="text-sm font-bold text-white">Total Due Today:</span>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                {isTrial ? 'BDT 0' : `BDT ${price.toLocaleString()}`}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {isTrial ? 'Full feature access included' : (isAnnual ? 'Billed annually' : 'Billed monthly')}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || slugStatus.valid === false}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isTrial ? 'Provisioning Free Trial...' : 'Creating Institution Account...'}</span>
              </>
            ) : isTrial ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Activate 14-Day Free Trial</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Continue to Checkout</span>
              </>
            )}
          </button>

          <p className="mt-3 text-[11px] text-center text-slate-500">
            By proceeding, you agree to EduERP&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </form>
  );
}
