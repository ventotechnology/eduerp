'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { getTenantRouteSlug } from '@/lib/tenant/tenant-aliases';
import { getTranslation } from '@/lib/i18n';
import {
  Bell,
  Search,
  Bot,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export function TenantHeader() {
  const params = useParams();
  const { tenantSlug, branding, activeUser, activeCampusId, campuses, language } = useTenant();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const urlTenant = (params?.tenant as string) || '';
  const routeSlug = getTenantRouteSlug(urlTenant, tenantSlug);

  const activeCampus = campuses.find((c) => c.id === activeCampusId) || campuses[0];

  const handleBroadcastEmergency = () => {
    setEmergencySent(true);
    setTimeout(() => {
      setEmergencySent(false);
      setShowEmergencyModal(false);
    }, 2000);
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shadow-xs sticky top-0 z-40">
        {/* Left: Campus & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-sm">{activeCampus.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
              {activeCampus.type}
            </span>
          </div>
        </div>

        {/* Middle: AI Search Trigger */}
        <div className="hidden md:flex items-center max-w-md w-full mx-4">
          <Link
            href={`/${routeSlug}/ai-assistant`}
            className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 transition"
          >
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span className="truncate">Ask AI Copilot (e.g., &quot;How many absent today?&quot; or &quot;Show dues&quot;)...</span>
            <kbd className="ml-auto text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono">
              Ctrl+K
            </kbd>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Emergency Siren Broadcast Trigger */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
            title="Broadcast Campus-wide Emergency Alert"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-bounce" />
            <span className="hidden sm:inline">Emergency Siren</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Campus Notifications</h4>
                  <span className="text-[10px] text-blue-600 font-medium cursor-pointer">Mark all read</span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                    <p className="font-medium text-slate-800 dark:text-slate-200">Midterm Examination Schedule Published</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">2 hours ago • Exam Controller</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                    <p className="font-medium text-slate-800 dark:text-slate-200">82 Overdue Invoices Pending Reminder</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">5 hours ago • Accounts</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {activeUser.name.slice(0, 1)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{activeUser.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{activeUser.role.toLowerCase().replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Siren Broadcast Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-lg">
                <Volume2 className="w-6 h-6 animate-pulse" />
                <span>Campus Emergency Siren Broadcast</span>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              This triggers a high-priority emergency alert with push sound notification across all mobile apps, parent portal, SMS gateway, and on-campus digital display screens.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Category</label>
                <select className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option>Severe Weather / Cyclonic Warning & Urgent Campus Closure</option>
                  <option>Immediate Earthquake / Evacuation Protocol</option>
                  <option>Security Incident / Lock-down Notice</option>
                  <option>Unscheduled Examination Postponement (Govt. Directive)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Siren Message</label>
                <textarea
                  defaultValue="ATTENTION: Due to severe weather warnings, all classes and examinations for today are suspended. School transport buses are dispatched immediately."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {emergencySent ? (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center justify-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Emergency Broadcast Dispatched to 1,850 Guardians, 142 Staff & SMS Gateway!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBroadcastEmergency}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Send Broadcast Immediately</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
