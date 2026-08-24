"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant-context";
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
  FileText
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

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities?tenantId=${tenantSlug}&tab=${activeTab}&search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error("Error fetching facilities data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantSlug, activeTab]);

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
            <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

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
                  ? "bg-blue-600 text-white shadow-xs"
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
              { label: "Books & Resources", value: data?.metrics?.totalBooks || 0, sub: `${data?.metrics?.activeBookLoans || 0} active loans`, icon: BookOpen, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
              { label: "Hostel Rooms", value: data?.metrics?.totalHostelRooms || 0, sub: `${data?.metrics?.activeHostelResidents || 0} residents`, icon: Bed, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
              { label: "Transport Fleet", value: data?.metrics?.activeVehicles || 0, sub: "Active GPS units", icon: Bus, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
              { label: "Inventory Items", value: data?.metrics?.inventoryItemsCount || 0, sub: "In central store", icon: Package, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
              { label: "Fixed Assets", value: data?.metrics?.fixedAssetsCount || 0, sub: "Tagged & tracked", icon: Tag, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
              { label: "Open Work Orders", value: data?.metrics?.openMaintenanceRequests || 0, sub: "Maintenance desk", icon: Wrench, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
              { label: "Active Visitors", value: data?.metrics?.visitorsToday || 0, sub: "On campus now", icon: UserCheck, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
              { label: "Canteens", value: data?.metrics?.canteensCount || 0, sub: "Cashless POS", icon: Coffee, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
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
                  <span><strong>Asset Exit Clearance Check:</strong> Command 6 HR exit clearance requires all employee-held fixed assets to be returned.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Academic Timetable Conflict Engine:</strong> Classroom bookings automatically check scheduled routine conflicts.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Hardware & External Integration Classifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">GPS Telemetry</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">REAL_GPS_TELEMETRY_ARCHITECTURE</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Card / Smart ID</p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">REAL_CARD_IDENTIFIER_ARCHITECTURE</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Cashless POS</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">REAL_INTERNAL_PAYMENT_ENGINE</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Biometric Attendance</p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">REAL_ATTENDANCE_ENGINE</p>
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Catalog & Circulation</h3>
              <span className="text-xs text-slate-500 font-semibold">{data?.catalogs?.length || 0} Titles Registered</span>
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
                  {data?.catalogs?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No catalog items found.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.hostels?.map((h: any) => (
              <div key={h.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">
                    {h.type} Hostel
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{h.code}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-base">{h.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Warden: {h.wardenName || "Not Assigned"} ({h.wardenPhone || "N/A"})</p>

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
                <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                  REAL_GPS_TELEMETRY_ARCHITECTURE
                </span>
              </div>

              <div className="my-8 text-center z-10">
                <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-full border border-blue-500/30 mb-3">
                  <Bus className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Fleet Tracking Hub</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Ingests live vehicle coordinates via secure device webhooks. Authenticates hardware and logs real-time parent notifications.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center z-10">
                <div>
                  <p className="text-[10px] text-slate-400">ACTIVE FLEET</p>
                  <p className="text-sm font-bold text-white">{data?.vehicles?.length || 0} Buses</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">SCHEDULED TRIPS</p>
                  <p className="text-sm font-bold text-emerald-400">{data?.trips?.length || 0} Today</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">INCIDENTS</p>
                  <p className="text-sm font-bold text-slate-300">{data?.incidents?.length || 0} Logged</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Transport Fleet Overview</h3>
                <p className="text-xs text-slate-500 mb-4">Real vehicles, route configurations and student transport subscriptions.</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Enrolled Routes</p>
                  <p className="text-base font-extrabold text-blue-600 mt-1">{data?.routes?.length || 0} Configured Routes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No inventory items registered.
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.sku}</p>
                      </td>
                      <td className="p-3">{item.category?.name || "General"}</td>
                      <td className="p-3">{item.unitOfMeasure}</td>
                      <td className="p-3 font-semibold">{item.standardCost} BDT</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
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
                {data?.assets?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No fixed assets found.
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
                          <span className="text-blue-600 font-semibold">{asset.currentCustodianEmployee.firstName} {asset.currentCustodianEmployee.lastName}</span>
                        ) : (
                          <span className="text-slate-400">In Storage</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.status === "ASSIGNED" ? "bg-blue-100 text-blue-800" : asset.status === "DISPOSED" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
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
    </div>
  );
}
