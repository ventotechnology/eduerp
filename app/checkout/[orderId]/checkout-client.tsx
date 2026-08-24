'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CreditCard, Building2, CheckCircle2, AlertCircle, Loader2, Zap, ArrowRight, ExternalLink } from 'lucide-react';

interface Gateway {
  gateway: string;
  name: string;
  displayName: string;
  isSandbox: boolean;
  minAmount: number;
  maxAmount: number;
  instructions?: string | null;
}

interface OrderData {
  order: {
    id: string;
    orderNumber: string;
    billingCycle: string;
    subtotal: number;
    discount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    plan: {
      name: string;
      code: string;
      maxStudents: number;
      maxCampuses: number;
      maxStorageGb: number;
      includedSms: number;
    };
    signup?: {
      institutionName: string;
      desiredSlug: string;
      contactPerson: string;
      email: string;
      phone: string;
    } | null;
  };
  gateways: Gateway[];
}

export default function CheckoutClient({ initialData }: { initialData: OrderData }) {
  const { order, gateways } = initialData;
  const router = useRouter();

  const [selectedGateway, setSelectedGateway] = useState<string>('BKASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank Transfer Form State
  const [bankName, setBankName] = useState('City Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankNotes, setBankNotes] = useState('');
  const [bankSubmitted, setBankSubmitted] = useState(false);

  const isAlreadyPaid = order.status === 'PAID' || order.status === 'FULFILLED';

  // Handle bKash Pay
  const handleBkashCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscriptions/checkout/bkash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize bKash checkout session.');
      }

      if (data.bkashUrl) {
        // Redirect user to official bKash checkout portal
        window.location.href = data.bkashUrl;
      } else {
        // Fallback status check
        router.push(`/payment/status/${order.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to bKash.');
      setLoading(false);
    }
  };

  // Handle Bank Transfer Submit
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setError('Please enter your bank deposit transaction reference / slip number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscriptions/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          bankName,
          accountNumber,
          transactionRef: transactionRef.trim(),
          depositDate,
          notes: bankNotes.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bank transfer info.');
      }

      setBankSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error submitting bank transfer details.');
      setLoading(false);
    }
  };

  if (isAlreadyPaid) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Order Already Paid & Fulfilled</h2>
        <p className="text-sm text-slate-400 mb-6">
          This order has already been successfully paid. Your institution instance is active!
        </p>
        <button
          type="button"
          onClick={() => router.push(`/payment/status/${order.id}?status=success`)}
          className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400"
        >
          View Activation Details
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left Column: Payment Methods */}
      <div className="md:col-span-7 space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Choose Payment Method
          </h2>

          <div className="space-y-3">
            {/* bKash Option */}
            <div
              onClick={() => setSelectedGateway('BKASH')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedGateway === 'BKASH'
                  ? 'bg-pink-500/10 border-pink-500 shadow-md shadow-pink-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                    bKash
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>bKash Direct Merchant</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                        Instant Setup
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Pay with your personal bKash wallet or app
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedGateway === 'BKASH' ? 'border-pink-500 bg-pink-500' : 'border-slate-600'
                }`}>
                  {selectedGateway === 'BKASH' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* Bank Transfer Option */}
            <div
              onClick={() => setSelectedGateway('BANK_TRANSFER')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedGateway === 'BANK_TRANSFER'
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">
                      Direct Bank Wire / Deposit
                    </div>
                    <div className="text-xs text-slate-400">
                      Transfer to City Bank corporate account
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedGateway === 'BANK_TRANSFER' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                }`}>
                  {selectedGateway === 'BANK_TRANSFER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Payment Details Area */}
        {selectedGateway === 'BKASH' && (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-pink-950/20 to-slate-900 border border-pink-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Instant Automated bKash Activation</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You will be redirected to the secure official bKash portal. Once verified with your bKash PIN, your EduERP workspace will be created and activated immediately.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBkashCheckout}
              disabled={loading}
              className="mt-6 w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-pink-600 text-white hover:bg-pink-500 transition-all shadow-lg shadow-pink-600/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to bKash...</span>
                </>
              ) : (
                <>
                  <span>Pay BDT {order.totalAmount.toLocaleString()} with bKash</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {selectedGateway === 'BANK_TRANSFER' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Bank Account Information</h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-300 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Name:</span>
                <span className="font-bold text-white">The City Bank Limited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Name:</span>
                <span className="font-bold text-white">Vento Technology</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-mono font-bold text-emerald-400">1102948192001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-white">Dhanmondi Branch, Dhaka</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Routing Number:</span>
                <span className="font-mono text-white">225271928</span>
              </div>
            </div>

            {bankSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Reference Submitted Successfully!
                </div>
                <p className="text-slate-300">
                  Our billing operations team has received your deposit reference ({transactionRef}). Your instance will be activated once funds clear.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBankSubmit} className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Submit Deposit Slip Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transaction / Slip Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TXN-948102948 or Cheque # 120938"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Deposit Date
                    </label>
                    <input
                      type="date"
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender Account
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Deposit Reference'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Order Summary Card */}
      <div className="md:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">Subscription Overview</h2>

          {/* Institution Info */}
          {order.signup && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 mb-4 text-xs">
              <div className="text-slate-400">Institution:</div>
              <div className="font-bold text-white text-sm">{order.signup.institutionName}</div>
              <div className="text-emerald-400 font-mono text-[11px]">
                https://{order.signup.desiredSlug}.eduerp.us
              </div>
            </div>
          )}

          {/* Plan Limits */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs text-slate-300 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Plan:</span>
              <span className="font-bold text-white">{order.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Billing Cycle:</span>
              <span className="font-semibold text-emerald-400">{order.billingCycle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Students:</span>
              <span className="text-white">{order.plan.maxStudents.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Campuses:</span>
              <span className="text-white">{order.plan.maxCampuses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage:</span>
              <span className="text-white">{order.plan.maxStorageGb} GB</span>
            </div>
          </div>

          {/* Pricing Calculation */}
          <div className="space-y-2 text-xs text-slate-300 pb-4 border-b border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-white">BDT {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span>- BDT {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>VAT / Tax (Included):</span>
              <span>BDT {order.taxAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex items-baseline justify-between">
            <span className="text-sm font-bold text-white">Total Amount:</span>
            <span className="text-2xl font-black text-emerald-400">
              BDT {order.totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-Bit Encrypted & Protected Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
