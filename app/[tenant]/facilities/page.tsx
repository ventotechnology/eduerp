"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/tenant-context";
import { getTenantCache, setTenantCache, invalidateTenantCache } from "@/lib/cache/tenant-cache";
import {
  Building,
  BookOpen,
  Bus,
  Bed,
  Coffee,
  Package,
  ShieldCheck,
  Wrench,
  UserCheck,
  Calendar,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  QrCode,
  Tag,
  Truck,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";

type FacilityTab =
  | "overview"
  | "library"
  | "hostel"
  | "transport"
  | "canteen"
  | "inventory"
  | "assets"
  | "procurement"
  | "maintenance"
  | "security"
  | "booking";

export default function FacilitiesPage() {
  const { branding, tenantSlug } = useTenant();
  const [activeTab, setActiveTab] = useState<FacilityTab>("overview");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action Modals State
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "General",
    classificationNumber: "GEN-001",
    copies: 5,
  });

  const [showHostelModal, setShowHostelModal] = useState(false);
  const [hostelForm, setHostelForm] = useState({
    code: "",
    name: "",
    type: "BOYS",
    capacity: 50,
    wardenName: "",
    wardenPhone: "",
  });

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    sku: "",
    name: "",
    unitOfMeasure: "PCS",
    standardCost: 100,
    reorderLevel: 10,
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetTag: "",
    name: "",
    category: "IT_EQUIPMENT",
    purchaseCost: 25000,
    serialNumber: "",
  });

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    location: "Main Building",
  });

  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    phone: "",
    purpose: "Official Meeting",
    hostType: "OFFICE",
    badgeNumber: "",
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    facilityName: "Main Auditorium",
    purpose: "Academic Assembly",
    startDateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 90000000).toISOString().slice(0, 16),
  });

  const fetchData = useCallback(async (force = false) => {
    const slug = tenantSlug || 'demo-school';
    const subKey = `${activeTab}::${searchQuery}`;
    const cached = getTenantCache<any>(slug, 'facilities', subKey);

    if (cached && !force) {
      setData(cached);
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/facilities?tenantId=${slug}&tab=${activeTab}&search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTenantCache(slug, 'facilities', subKey, json.data, { ttlMs: 60000 });
      }
    } catch (err: any) {
      console.error("Error fetching facilities data:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, activeTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePostAction = async (action: string, payload: any, modalCloseFn: () => void, successMsg: string) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tenantId: tenantSlug || 'demo-school',
          ...payload,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || json.error || `Failed to execute ${action}`);
      }
      setMessage({ type: 'success', text: successMsg });
      modalCloseFn();
      invalidateTenantCache(tenantSlug || 'demo-school', 'facilities');
      fetchData(true);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: FacilityTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "library", label: "Library", icon: BookOpen },
    { id: "hostel", label: "Hostel & Housing", icon: Bed },
    { id: "transport", label: "Transport & GPS", icon: Bus },
    { id: "canteen", label: "Canteen & Wallet", icon: Coffee },
    { id: "inventory", label: "Inventory & Store", icon: Package },
    { id: "assets", label: "Fixed Assets", icon: Tag },
    { id: "procurement", label: "Procurement & PO", icon: Truck },
    { id: "maintenance", label: "Maintenance Desk", icon: Wrench },
    { id: "security", label: "Visitor & Gate", icon: ShieldCheck },
    { id: "booking", label: "Facility Booking", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Campus Operations, Logistics & Facilities Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise facility management with automated library circulation, hostel allocation, GPS fleet tracking, cashless POS, inventory ledgers & 3-way match procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Books & Resources", value: data?.metrics?.totalBooks || 0, sub: `${data?.metrics?.activeBookLoans || 0} active loans`, icon: BookOpen, color: "text-blue-400 bg-blue-950/40" },
              { label: "Hostel Rooms", value: data?.metrics?.totalHostelRooms || 0, sub: `${data?.metrics?.activeHostelResidents || 0} residents`, icon: Bed, color: "text-indigo-400 bg-indigo-950/40" },
              { label: "Transport Fleet", value: data?.metrics?.activeVehicles || 0, sub: "Active GPS units", icon: Bus, color: "text-emerald-400 bg-emerald-950/40" },
              { label: "Inventory Items", value: data?.metrics?.inventoryItemsCount || 0, sub: "In central store", icon: Package, color: "text-amber-400 bg-amber-950/40" },
              { label: "Fixed Assets", value: data?.metrics?.fixedAssetsCount || 0, sub: "Tagged & tracked", icon: Tag, color: "text-purple-400 bg-purple-950/40" },
              { label: "Open Work Orders", value: data?.metrics?.openMaintenanceRequests || 0, sub: "Maintenance desk", icon: Wrench, color: "text-rose-400 bg-rose-950/40" },
              { label: "Active Visitors", value: data?.metrics?.visitorsToday || 0, sub: "On campus now", icon: UserCheck, color: "text-cyan-400 bg-cyan-950/40" },
              { label: "Canteens", value: data?.metrics?.canteensCount || 0, sub: "Cashless POS", icon: Coffee, color: "text-orange-400 bg-orange-950/40" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Facility Governance Invariants</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>No Double Hostel Bed Allocation:</strong> Bed uniqueness and atomic transaction state prevents concurrent double-assignment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Immutable Stock Ledger:</strong> Inventory stock balances are strictly derived from debit/credit transaction movements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Asset Exit Clearance Check:</strong> HR exit clearance requires all employee-held fixed assets to be returned.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Academic Timetable Conflict Engine:</strong> Classroom bookings automatically check scheduled routine conflicts.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Hardware & Integration Telemetry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">GPS Telemetry</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">REAL_GPS_TELEMETRY_READY</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Card / Smart ID</p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">REAL_CARD_IDENTIFIER_READY</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Cashless POS</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">REAL_INTERNAL_PAYMENT_READY</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Biometric Attendance</p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">REAL_ATTENDANCE_READY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Catalog & Circulation</h3>
                <span className="text-xs text-slate-500 font-semibold">{data?.catalogs?.length || 0} Titles Registered</span>
              </div>
              <button
                onClick={() => setShowCatalogModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Book Title</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <th className="p-3">Title & ISBN</th>
                    <th className="p-3">Author / Publisher</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Copies</th>
                    <th className="p-3">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(!data?.catalogs || data.catalogs.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <div className="space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="font-semibold text-slate-300">No catalog items registered in library.</p>
                          <button
                            onClick={() => setShowCatalogModal(true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 mt-1 shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Book Title
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data?.catalogs?.map((cat: any) => {
                      const totalCopies = cat.copies?.length || 0;
                      const availableCopies = cat.copies?.filter((c: any) => c.availabilityStatus === "AVAILABLE").length || 0;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-white">{cat.title}</p>
                            <p className="text-[11px] text-slate-400">ISBN: {cat.isbn || "N/A"}</p>
                          </td>
                          <td className="p-3">{cat.author}</td>
                          <td className="p-3">{cat.category}</td>
                          <td className="p-3 font-semibold">{totalCopies}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              availableCopies > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-rose-100 text-rose-800"
                            }`}>
                              {availableCopies} Available
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HOSTEL */}
      {activeTab === "hostel" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hostel Master & Housing Blocks</h3>
            <button
              onClick={() => setShowHostelModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hostel Master</span>
            </button>
          </div>

          {(!data?.hostels || data.hostels.length === 0) ? (
            <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <Bed className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Hostels Configured</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Configure residential hostel buildings, room types, and bed capacities.
                </p>
              </div>
              <button
                onClick={() => setShowHostelModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Hostel Master</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.hostels?.map((h: any) => (
                <div key={h.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-bold text-[10px] uppercase">
                      {h.type} Hostel
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-semibold">{h.code}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-base">{h.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Warden: {h.wardenName || "Not Assigned"} ({h.wardenPhone || "N/A"})</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Total Capacity</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{h.capacity} Beds</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Rooms</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{h.rooms?.length || 0} Registered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRANSPORT */}
      {activeTab === "transport" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white relative overflow-hidden shadow-xl min-h-[350px] flex flex-col justify-between">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-sm text-emerald-400">Live GPS Fleet Telemetry</span>
                </div>
                <span className="text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800 font-semibold">
                  REAL_GPS_TELEMETRY_ARCHITECTURE
                </span>
              </div>

              <div className="my-8 text-center z-10">
                <div className="inline-flex items-center justify-center p-4 bg-emerald-950/60 rounded-full border border-emerald-800 mb-3">
                  <Bus className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold">Fleet Tracking Hub</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Ingests live vehicle coordinates via secure device webhooks. Authenticates hardware and logs real-time parent notifications.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center z-10">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">ACTIVE FLEET</p>
                  <p className="text-sm font-bold text-white">{data?.vehicles?.length || 0} Buses</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">SCHEDULED TRIPS</p>
                  <p className="text-sm font-bold text-emerald-400">{data?.trips?.length || 0} Today</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">INCIDENTS</p>
                  <p className="text-sm font-bold text-slate-300">{data?.incidents?.length || 0} Logged</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Transport Fleet Overview</h3>
                <p className="text-xs text-slate-500 mb-4">Real vehicles, route configurations and student transport subscriptions.</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Enrolled Routes</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{data?.routes?.length || 0} Configured Routes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANTEEN */}
      {activeTab === "canteen" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cashless Canteen & Campus POS</h3>
                <p className="text-xs text-slate-500">Card wallet debits, daily nutritional logs, and spending limits.</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                REAL_INTERNAL_PAYMENT_ENGINE
              </span>
            </div>
            <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
              <Coffee className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Canteen items, menus, and POS terminals are ready for cashless transactions.</p>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Central Store & Inventory</h3>
                <span className="text-xs text-slate-500 font-semibold">{data?.items?.length || 0} SKUs Tracked</span>
              </div>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Inventory Item</span>
              </button>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <th className="p-3">SKU & Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">UOM</th>
                  <th className="p-3">Standard Cost</th>
                  <th className="p-3">Reorder Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(!data?.items || data.items.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="space-y-2">
                        <Package className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="font-semibold text-slate-300">No inventory items registered in central store.</p>
                        <button
                          onClick={() => setShowInventoryModal(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 mt-1 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add First Inventory Item
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.sku}</p>
                      </td>
                      <td className="p-3">{item.category?.name || "General"}</td>
                      <td className="p-3">{item.unitOfMeasure}</td>
                      <td className="p-3 font-semibold">{item.standardCost} BDT</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                          Min: {item.reorderLevel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSETS */}
      {activeTab === "assets" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fixed Assets & Equipment Register</h3>
                <span className="text-xs text-slate-500 font-semibold">{data?.assets?.length || 0} Assets Tagged</span>
              </div>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Fixed Asset</span>
              </button>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <th className="p-3">Asset Tag & Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Purchase Cost</th>
                  <th className="p-3">Current Custodian</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(!data?.assets || data.assets.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="space-y-2">
                        <Tag className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="font-semibold text-slate-300">No fixed assets registered in institution ledger.</p>
                        <button
                          onClick={() => setShowAssetModal(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 mt-1 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" /> Register First Asset
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.assets?.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{asset.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{asset.assetTag}</p>
                      </td>
                      <td className="p-3">{asset.category}</td>
                      <td className="p-3 font-semibold">{asset.purchaseCost} BDT</td>
                      <td className="p-3">
                        {asset.currentCustodianEmployee ? (
                          <span className="text-emerald-400 font-semibold">{asset.currentCustodianEmployee.firstName} {asset.currentCustodianEmployee.lastName}</span>
                        ) : (
                          <span className="text-slate-400">In Campus Storage</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.status === "ASSIGNED" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" : asset.status === "DISPOSED" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Desk & Work Orders</h3>
                <p className="text-xs text-slate-500">Preventive schedules, electrical/HVAC work orders, and emergency tickets.</p>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Work Order</span>
              </button>
            </div>

            {(!data?.requests || data.requests.length === 0) ? (
              <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <Wrench className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No open maintenance tickets. Campus facilities are fully operational.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.requests?.map((req: any) => (
                  <div key={req.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">{req.ticketNumber || req.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                        {req.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{req.title}</h4>
                    <p className="text-slate-400 mt-0.5">{req.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECURITY / VISITOR */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Visitor & Gate Security Protocol</h3>
                <p className="text-xs text-slate-500">Real-time gate check-in, guardian authorization, and ANPR vehicle access logs.</p>
              </div>
              <button
                onClick={() => setShowVisitorModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Check-In Visitor</span>
              </button>
            </div>

            {(!data?.visitors || data.visitors.length === 0) ? (
              <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No active visitors logged on campus right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.visitors?.map((v: any) => (
                  <div key={v.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{v.visitorName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        {v.status || "CHECKED_IN"}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">Phone: {v.phone} | Purpose: {v.purpose}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKING */}
      {activeTab === "booking" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Campus Facility & Resource Booking</h3>
                <p className="text-xs text-slate-500">Auditoriums, sports grounds, science labs & conflict-free scheduling.</p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Facility Booking</span>
              </button>
            </div>

            {(!data?.bookings || data.bookings.length === 0) ? (
              <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">All campus auditoriums and laboratories are available for reservations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.bookings?.map((b: any) => (
                  <div key={b.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{b.facilityName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">Purpose: {b.purpose} | Timing: {new Date(b.startTime).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ACTION MODALS */}
      {/* ============================================================ */}

      {/* 1. ADD BOOK CATALOG MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Add Book to Library Catalog
              </h3>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_CATALOG', catalogForm, () => setShowCatalogModal(false), 'Book catalog created successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahih al-Bukhari (Complete)"
                  value={catalogForm.title}
                  onChange={(e) => setCatalogForm({ ...catalogForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imam al-Bukhari"
                    value={catalogForm.author}
                    onChange={(e) => setCatalogForm({ ...catalogForm, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">ISBN</label>
                  <input
                    type="text"
                    placeholder="978-XXXXXXXXXX"
                    value={catalogForm.isbn}
                    onChange={(e) => setCatalogForm({ ...catalogForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <input
                    type="text"
                    value={catalogForm.category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Classification Code</label>
                  <input
                    type="text"
                    value={catalogForm.classificationNumber}
                    onChange={(e) => setCatalogForm({ ...catalogForm, classificationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD HOSTEL MODAL */}
      {showHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bed className="w-4 h-4 text-emerald-400" /> Create Hostel Building
              </h3>
              <button onClick={() => setShowHostelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_HOSTEL', { ...hostelForm, capacity: Number(hostelForm.capacity) }, () => setShowHostelModal(false), 'Hostel building created successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Hostel Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SITA-HST-01"
                    value={hostelForm.code}
                    onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Hostel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Farooq Boys Hostel"
                    value={hostelForm.name}
                    onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Hostel Type</label>
                  <select
                    value={hostelForm.type}
                    onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BOYS" className="bg-slate-900 text-white">Boys Hostel</option>
                    <option value="GIRLS" className="bg-slate-900 text-white">Girls Hostel</option>
                    <option value="FACULTY" className="bg-slate-900 text-white">Faculty Residence</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Bed Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hostelForm.capacity}
                    onChange={(e) => setHostelForm({ ...hostelForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Warden Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ustaz Abdullah"
                    value={hostelForm.wardenName}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Warden Phone</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={hostelForm.wardenPhone}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHostelModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD INVENTORY ITEM MODAL */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" /> Add Inventory SKU Item
              </h3>
              <button onClick={() => setShowInventoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_INVENTORY_ITEM', {
                  ...inventoryForm,
                  standardCost: Number(inventoryForm.standardCost),
                  reorderLevel: Number(inventoryForm.reorderLevel),
                }, () => setShowInventoryModal(false), 'Inventory SKU created successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SITA-PAP-A4"
                    value={inventoryForm.sku}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A4 Printing Paper (Box)"
                    value={inventoryForm.name}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Unit (UOM)</label>
                  <select
                    value={inventoryForm.unitOfMeasure}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, unitOfMeasure: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PCS" className="bg-slate-900 text-white">PCS (Pieces)</option>
                    <option value="BOX" className="bg-slate-900 text-white">BOX</option>
                    <option value="SET" className="bg-slate-900 text-white">SET</option>
                    <option value="KG" className="bg-slate-900 text-white">KG</option>
                    <option value="LTR" className="bg-slate-900 text-white">LTR</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Cost (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryForm.standardCost}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, standardCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.reorderLevel}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD FIXED ASSET MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> Register Fixed Asset
              </h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_FIXED_ASSET', {
                  ...assetForm,
                  purchaseCost: Number(assetForm.purchaseCost),
                }, () => setShowAssetModal(false), 'Fixed asset registered successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Asset Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SITA-AST-101"
                    value={assetForm.assetTag}
                    onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classroom Projector 4K"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="IT_EQUIPMENT" className="bg-slate-900 text-white">IT & Electronics</option>
                    <option value="FURNITURE" className="bg-slate-900 text-white">Furniture & Desks</option>
                    <option value="LAB_EQUIPMENT" className="bg-slate-900 text-white">Lab & Science Gear</option>
                    <option value="VEHICLE" className="bg-slate-900 text-white">Vehicle</option>
                    <option value="ELECTRICAL" className="bg-slate-900 text-white">Electrical / Generator</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Purchase Cost (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MAINTENANCE REQUEST MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" /> New Maintenance Work Order
              </h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_MAINTENANCE_REQUEST', maintenanceForm, () => setShowMaintenanceModal(false), 'Maintenance request submitted!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC Maintenance in Room 302"
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW" className="bg-slate-900 text-white">Low</option>
                    <option value="MEDIUM" className="bg-slate-900 text-white">Medium</option>
                    <option value="HIGH" className="bg-slate-900 text-white">High</option>
                    <option value="URGENT" className="bg-slate-900 text-white">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={maintenanceForm.location}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain symptoms, affected assets, or required repairs..."
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VISITOR CHECK-IN MODAL */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Visitor Gate Check-In
              </h3>
              <button onClick={() => setShowVisitorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('REGISTER_VISITOR', visitorForm, () => setShowVisitorModal(false), 'Visitor checked in successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Visitor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Purpose of Visit *</label>
                  <input
                    type="text"
                    required
                    value={visitorForm.purpose}
                    onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Gate Badge / ID #</label>
                  <input
                    type="text"
                    placeholder="BADGE-012"
                    value={visitorForm.badgeNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging In...' : 'Check In Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. FACILITY BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Book Campus Facility
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostAction('CREATE_FACILITY_BOOKING', bookingForm, () => setShowBookingModal(false), 'Facility reservation requested successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.facilityName}
                  onChange={(e) => setBookingForm({ ...bookingForm, facilityName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Purpose of Reservation *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.startDateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startDateTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.endDateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endDateTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Booking...' : 'Reserve Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
