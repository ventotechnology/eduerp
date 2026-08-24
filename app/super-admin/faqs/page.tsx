'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function SuperAdminFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    question: '',
    answer: '',
    categoryId: '',
    relatedModule: 'LOGIN',
    displayOrder: 1
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/faqs');
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data || []);
      }
      const catRes = await fetch('/api/help/articles');
      const catData = await catRes.json();
      if (catData.success && catData.categories) {
        setCategories(catData.categories);
        if (catData.categories.length > 0 && !form.categoryId) {
          setForm((f) => ({ ...f, categoryId: catData.categories[0].id }));
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
      const res = await fetch('/api/super-admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({
          question: '',
          answer: '',
          categoryId: categories[0]?.id || '',
          relatedModule: 'LOGIN',
          displayOrder: 1
        });
        await fetchData();
      } else {
        alert(data.error || 'Failed to create FAQ');
      }
    } catch {
      alert('Error creating FAQ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            FAQ Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain public and tenant-facing FAQs with helpfulness metrics.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New FAQ</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No FAQs created.</div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                      Module: {faq.relatedModule || 'GENERAL'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{faq.question}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                    <span>👍 {faq.helpfulCount}</span>
                    <span>👎 {faq.notHelpfulCount}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create FAQ Item</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="e.g. How to enter subject marks?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Clear answer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
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
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
