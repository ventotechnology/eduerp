"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Radio,
  Send,
  Activity,
  X,
  CreditCard,
  Building2,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { listSupportedSmsAdapters } from "@/lib/services/sms/adapters";

export default function TenantSmsSettingsPage() {
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({});
  const [quota, setQuota] = useState<any>({});
  const [tenantProviders, setTenantProviders] = useState<any[]>([]);
  const [platformProvider, setPlatformProvider] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Connection Test
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Provider Modal
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [savingProvider, setSavingProvider] = useState(false);

  const supportedAdapters = listSupportedSmsAdapters();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/sms/config");
      const data = await res.json();
      if (data.success) {
        setConfig(data.config || {});
        setQuota(data.quota || {});
        setTenantProviders(data.tenantProviders || []);
        setPlatformProvider(data.platformProvider || null);
      } else {
        setError(data.error || "Failed to load SMS settings.");
      }
    } catch (err: any) {
      setError(err.message || "Error connecting to SMS service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateMode = async (mode: string) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/sms/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceMode: mode,
          activeProviderId: mode === "TENANT_OWN" ? tenantProviders[0]?.id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSuccess("SMS Service mode updated to " + mode.replace("_", " ") + ".");
        await fetchData();
      } else {
        setError(data.error || "Failed to update SMS service mode.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTestConnection = async (providerId?: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.result?.message || data.error || (data.success ? "Gateway online and reachable." : "Test failed.")
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Connection test timed out."
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setSavingProvider(true);

    try {
      const isNew = !editingProvider.id;
      const res = await fetch("/api/sms/providers", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProvider)
      });
      const data = await res.json();
      if (data.success) {
        setEditingProvider(null);
        setSuccess("Institutional SMS provider credentials saved and encrypted.");
        await fetchData();
      } else {
        alert(data.error || "Failed to save SMS provider.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMS provider integration?")) return;
    try {
      const res = await fetch("/api/sms/providers?id=" + id, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={"/" + tenantSlug + "/settings"}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Settings
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">SMS Gateway</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            SMS Gateway & Messaging Architecture
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose whether to use the central EduERP Universal SMS network or integrate your institution&apos;s own telecom gateway.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Status & Quota Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Mode</span>
          <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {config.serviceMode === "PLATFORM_SHARED"
                ? "EduERP Universal SMS"
                : config.serviceMode === "TENANT_OWN"
                ? "Own Telecom Gateway"
                : "Disabled"}
            </span>
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            {config.serviceMode === "PLATFORM_SHARED"
              ? "Aggregator: " + (platformProvider?.name || "EduERP Central Network")
              : config.serviceMode === "TENANT_OWN"
              ? "Institution direct API connection"
              : "Outbound SMS blocked"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Included Quota</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {quota.isUnlimited ? "Unlimited" : (quota.includedMonthly || 0).toLocaleString() + " SMS"}
          </div>
          <span className="text-[11px] text-slate-400">Included with active subscription package</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Credits</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {quota.isUnlimited ? "Unlimited" : (quota.remainingCredits || 0).toLocaleString() + " SMS"}
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Used: {quota.usedThisPeriod || 0} this month</span>
            <Link href={"/" + tenantSlug + "/settings/billing#sms-addons"} className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
              + Top-up
            </Link>
          </div>
        </div>
      </div>

      {/* Gateway Selection Matrix */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-500" />
            <span>Select Messaging Gateway Strategy</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose how your institution delivers attendance alerts, exam results, and administrative SMS notices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OPTION 1: EduERP Universal SMS */}
          <div
            onClick={() => handleUpdateMode("PLATFORM_SHARED")}
            className={"p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-4 " + (
              config.serviceMode === "PLATFORM_SHARED"
                ? "bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 shadow-md ring-1 ring-teal-500"
                : "bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-teal-600 dark:text-teal-400">Option 1</span>
                {config.serviceMode === "PLATFORM_SHARED" && (
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">EduERP Universal SMS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero setup required. Delivers immediately via high-reliability platform multi-operator routes (Banglalink, GP, Robi, Teletalk).
              </p>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 space-y-1">
              <div>Uses included package quota & add-ons</div>
              <div>Masked sender ID supported</div>
            </div>
          </div>

          {/* OPTION 2: Institution Own Gateway */}
          <div
            onClick={() => handleUpdateMode("TENANT_OWN")}
            className={"p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-4 " + (
              config.serviceMode === "TENANT_OWN"
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-md ring-1 ring-blue-500"
                : "bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Option 2</span>
                {config.serviceMode === "TENANT_OWN" && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Institution&apos;s Own SMS Gateway</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your school&apos;s existing corporate agreement with Banglalink, GP, Teletalk, Robi, SSL Wireless, or BulkSMSBD.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 space-y-1">
              <div>Direct billing with your telecom operator</div>
              <div>Credentials encrypted with AES-256-GCM</div>
            </div>
          </div>

          {/* OPTION 3: SMS Disabled */}
          <div
            onClick={() => handleUpdateMode("DISABLED")}
            className={"p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-4 " + (
              config.serviceMode === "DISABLED"
                ? "bg-slate-200/60 dark:bg-slate-800/60 border-slate-400 shadow-md"
                : "bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Option 3</span>
                {config.serviceMode === "DISABLED" && (
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Disable SMS Services</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deactivates all outgoing SMS broadcasts, attendance notifications, and automated alerts for this institution.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 space-y-1">
              <div>Notice board & web portal remain active</div>
              <div>Zero SMS billing consumption</div>
            </div>
          </div>
        </div>

        {/* Live Test Action */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">Test Active Gateway Connectivity</span>
            <span className="text-slate-500 dark:text-slate-400">
              Performs non-intrusive handshake verification with the telecom server.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {testResult && (
              <span
                className={"text-xs font-semibold flex items-center gap-1 " + (
                  testResult.success ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message}
              </span>
            )}
            <button
              onClick={() => handleTestConnection()}
              disabled={testing || config.serviceMode === "DISABLED"}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <Activity className={"w-3.5 h-3.5 " + (testing ? "animate-spin" : "")} />
              <span>{testing ? "Testing..." : "Test Gateway"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institution-Owned Gateways Management */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>Your Institution&apos;s Integrated SMS Gateways</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Encrypted credentials stored securely with AES-256-GCM. Never shared with third parties.
            </p>
          </div>

          <button
            onClick={() =>
              setEditingProvider({
                name: "Institution Gateway",
                code: "BULKSMSBD",
                type: "HTTP_API",
                senderId: "",
                credentials: { apiKey: "", senderId: "" }
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Gateway</span>
          </button>
        </div>

        {tenantProviders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            No institutional custom SMS gateways added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenantProviders.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                        {p.code}
                      </span>
                    </h4>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      Sender ID: <strong className="text-slate-700 dark:text-slate-200">{p.senderId || "Default"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingProvider(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-[11px] font-mono text-slate-500 space-y-0.5 border border-slate-200 dark:border-slate-800">
                  {Object.entries(p.credentials || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize">{k}:</span>
                      <span className="text-slate-700 dark:text-slate-300">{String(v)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleTestConnection(p.id)}
                    disabled={testing}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                  >
                    Test This Gateway
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Custom Provider Setup Form */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProvider.id ? "Edit Institutional SMS Gateway" : "Add Institutional SMS Gateway"}
              </h3>
              <button onClick={() => setEditingProvider(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gateway Provider *</label>
                <select
                  disabled={Boolean(editingProvider.id)}
                  value={editingProvider.code}
                  onChange={(e) => {
                    const sel = supportedAdapters.find((a) => a.code === e.target.value);
                    const initCreds: any = {};
                    sel?.fields.forEach((f) => {
                      initCreds[f] = "";
                    });
                    setEditingProvider({
                      ...editingProvider,
                      code: e.target.value,
                      name: sel?.name || e.target.value,
                      credentials: initCreds
                    });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {supportedAdapters.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Display Label *</label>
                  <input
                    type="text"
                    required
                    value={editingProvider.name}
                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Approved Sender ID (Masking)</label>
                  <input
                    type="text"
                    placeholder="e.g. SITA"
                    value={editingProvider.senderId || ""}
                    onChange={(e) => setEditingProvider({ ...editingProvider, senderId: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Dynamic Credential Fields */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Encrypted Credentials at Rest</span>
                </div>

                {supportedAdapters
                  .find((a) => a.code === editingProvider.code)
                  ?.fields.map((f) => (
                    <div key={f}>
                      <label className="block text-slate-400 capitalize mb-0.5">{f} *</label>
                      <input
                        type={f.toLowerCase().includes("pass") || f.toLowerCase().includes("secret") || f.toLowerCase().includes("token") || f.toLowerCase().includes("key") ? "password" : "text"}
                        value={editingProvider.credentials?.[f] || ""}
                        placeholder={editingProvider.id ? "•••••••• (leave unchanged or enter new value)" : ("Enter " + f)}
                        onChange={(e) =>
                          setEditingProvider({
                            ...editingProvider,
                            credentials: {
                              ...editingProvider.credentials,
                              [f]: e.target.value
                            }
                          })
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                  ))}
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProvider}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                >
                  {savingProvider ? "Saving..." : "Save & Encrypt Gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
