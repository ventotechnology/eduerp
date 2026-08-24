'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { BANGLADESH_EDUCATION_BOARDS } from '@/lib/constants';
import {
  Settings,
  Building2,
  Palette,
  Shield,
  Layers,
  Save,
  CheckCircle2,
  Plus,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const { branding, institutionType, institutionTypeConfig } = useTenant();

  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'customFields' | 'workflows'>('profile');

  // Form State
  const [instName, setInstName] = useState(branding.name);
  const [shortName, setShortName] = useState(branding.shortName);
  const [eiin, setEiin] = useState(branding.eiin || '');
  const [board, setBoard] = useState(branding.boardAffiliation || BANGLADESH_EDUCATION_BOARDS[0]);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Custom Fields State
  const [customFields, setCustomFields] = useState([
    { id: 'CF-01', label: 'Preferred Transport Bus Stop', type: 'SELECT', entity: 'STUDENT', required: false },
    { id: 'CF-02', label: 'Special Dietary / Medical Allergy', type: 'TEXT', entity: 'STUDENT', required: false },
    { id: 'CF-03', label: 'Hifz Target Completion Year', type: 'NUMBER', entity: 'MADRASHA_STUDENT', required: false }
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Institution Configuration, Custom Fields & Branding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional profile, board affiliations, EIIN/MPO numbers, primary theme colors, and custom entity fields.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'branding' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Branding & Themes
          </button>
          <button
            onClick={() => setActiveTab('customFields')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'customFields' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Custom Fields Builder
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Institution settings and configuration updated successfully!</span>
        </div>
      )}

      {/* Tab 1: Profile & Affiliations */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Institution Full Name</label>
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Name / Code</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">EIIN / Institute Number</label>
              <input
                type="text"
                value={eiin}
                onChange={(e) => setEiin(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Board / Regulatory Affiliation</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {BANGLADESH_EDUCATION_BOARDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Branding & Themes */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Domain / Subdomain</label>
              <input
                type="text"
                defaultValue={`${branding.shortName.toLowerCase()}.eduerp.app`}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Apply Theme</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Custom Fields Builder */}
      {activeTab === 'customFields' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Dynamic Custom Fields Manager
            </h3>
            <button className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Field</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {customFields.map((cf) => (
              <div key={cf.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{cf.label}</span>
                  <span className="text-[10px] text-slate-400">
                    Attached to: <strong className="text-blue-600">{cf.entity}</strong> • Type: {cf.type}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {cf.required ? 'Mandatory' : 'Optional'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
