'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SuperAdminKnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    body: '',
    categoryId: '',
    relatedModule: 'SIS',
    visibility: 'PUBLIC',
    isPublished: true,
    isFeatured: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/knowledge');
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles || []);
        setCategories(data.categories || []);
        if (data.categories && data.categories.length > 0 && !form.categoryId) {
          setForm((f) => ({ ...f, categoryId: data.categories[0].id }));
        }
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
      const res = await fetch('/api/super-admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setForm({
          title: '',
          slug: '',
          summary: '',
          body: '',
          categoryId: categories[0]?.id || '',
          relatedModule: 'SIS',
          visibility: 'PUBLIC',
          isPublished: true,
          isFeatured: false
        });
        await fetchData();
      } else {
        alert(data.error || 'Failed to create article');
      }
    } catch {
      alert('Error creating article');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Knowledge Base CMS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author and publish official guides, role-based workflows, and troubleshooting references.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading CMS articles...</div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No articles created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Module</th>
                  <th className="pb-3 font-semibold">Visibility</th>
                  <th className="pb-3 font-semibold">Views</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-white">
                      {art.title}
                    </td>
                    <td className="py-3 text-slate-300">
                      {art.category?.name || 'General'}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      {art.relatedModule || 'ALL'}
                    </td>
                    <td className="py-3 font-mono text-[10px]">
                      {art.visibility}
                    </td>
                    <td className="py-3 text-slate-400 font-mono">
                      {art.viewCount}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        art.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {art.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`/help/articles/${art.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create Knowledge Base Article</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Managing Teacher Workload & Timetable"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Related Module</label>
                  <select
                    value={form.relatedModule}
                    onChange={(e) => setForm({ ...form, relatedModule: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOGIN">Login & Authentication</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="SIS">Student SIS</option>
                    <option value="ACADEMICS">Academics</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="EXAM">Examination</option>
                    <option value="LMS">LMS</option>
                    <option value="FINANCE">Finance</option>
                    <option value="HR">HR & Payroll</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Summary (1-2 sentences)</label>
                <input
                  type="text"
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Brief overview displayed on article cards..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Content (Markdown supported)</label>
                <textarea
                  rows={8}
                  required
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write step-by-step instructions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
