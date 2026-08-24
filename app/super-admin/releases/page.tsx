'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Calendar,
  Zap,
  Wrench,
  Bug
} from 'lucide-react';

export default function SuperAdminReleasesPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    version: '',
    title: '',
    summary: '',
    newFeaturesText: '',
    improvementsText: '',
    bugFixesText: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/releases');
      const data = await res.json();
      if (data.success) {
        setReleases(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFeatures = form.newFeaturesText.split('\n').map((s) => s.trim()).filter(Boolean);
      const improvements = form.improvementsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const bugFixes = form.bugFixesText.split('\n').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/super-admin/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: form.version,
          title: form.title,
          summary: form.summary,
          newFeatures: JSON.stringify(newFeatures),
          improvements: JSON.stringify(improvements),
          bugFixes: JSON.stringify(bugFixes)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({
          version: '',
          title: '',
          summary: '',
          newFeaturesText: '',
          improvementsText: '',
          bugFixesText: ''
        });
        await fetchData();
      } else {
        alert(data.error || 'Failed to publish release');
      }
    } catch {
      alert('Error publishing release');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Release Notes & Changelog CMS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish version releases, changelog items, and architectural enhancements.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Release Note</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading releases...</div>
        ) : releases.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No release notes published.</div>
        ) : (
          <div className="space-y-4">
            {releases.map((rel) => (
              <div key={rel.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                      {rel.version}
                    </span>
                    <h3 className="font-bold text-white text-sm">{rel.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(rel.releaseDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{rel.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Publish New Version Release</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Version (e.g. v1.2.0)</label>
                  <input
                    type="text"
                    required
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="v1.2.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Release Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Multi-Campus Sync"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Summary</label>
                <input
                  type="text"
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Overview of this release..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Features (one per line)</label>
                <textarea
                  rows={3}
                  value={form.newFeaturesText}
                  onChange={(e) => setForm({ ...form, newFeaturesText: e.target.value })}
                  placeholder="Feature 1&#10;Feature 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Publish Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
