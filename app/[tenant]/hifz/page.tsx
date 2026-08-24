'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  BookCheck,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  Plus,
  BookOpen,
  User,
  ShieldCheck,
  Star,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';

export default function HifzTrackerPage() {
  const { tenantSlug, branding, language } = useTenant();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [sabakPara, setSabakPara] = useState(18);
  const [sabakSurah, setSabakSurah] = useState('Surah Al-Muminun');
  const [sabakAyatStart, setSabakAyatStart] = useState(1);
  const [sabakAyatEnd, setSabakAyatEnd] = useState(30);
  const [sabakGrade, setSabakGrade] = useState('Excellent');
  const [totalParas, setTotalParas] = useState(17.5);
  const [notes, setNotes] = useState('Excellent Tajweed precision and Makhraj.');

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/students?tenantId=${tenantSlug}`);
      const data = await res.json();
      if (data.success && data.data?.students?.length > 0) {
        setStudents(data.data.students);
        setSelectedStudentId(data.data.students[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchHifzHistory = async (studentId: string) => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/hifz?tenantId=${tenantSlug}&studentId=${studentId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistory(data.data);
      }
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchStudents();
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchHifzHistory(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      const res = await fetch('/api/hifz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantSlug,
          studentId: selectedStudentId,
          date: new Date().toISOString().split('T')[0],
          sabakPara: Number(sabakPara),
          sabakSurah,
          sabakAyatStart: Number(sabakAyatStart),
          sabakAyatEnd: Number(sabakAyatEnd),
          sabakGrade,
          totalParasMemorized: Number(totalParas),
          teacherNotes: notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchHifzHistory(selectedStudentId);
      } else {
        alert(data.error?.message || 'Failed to save Hifz record');
      }
    } catch {
      alert('Error recording Hifz entry');
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookCheck className="w-7 h-7 text-emerald-600" />
            30-Para Hifzul Quran Progress Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Madrasha automated daily Sabak (New Lesson), Sabki (Recent Revision), and Dour (Full Revision) historical tracker.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Daily Sabak
          </button>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <User className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-700">Select Hifz Student:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.studentIdNumber})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
              Total Memorized: {history[0]?.totalParasMemorized || 17.5} / 30 Paras
            </span>
          </div>
        )}
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Current Sabak (New Lesson)</p>
          <p className="text-xl font-bold text-slate-900 mt-2">
            Para {history[0]?.sabakPara || 18} • {history[0]?.sabakSurah || 'Surah Al-Muminun'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ayat: {history[0]?.sabakAyatStart || 1} to {history[0]?.sabakAyatEnd || 25}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Sabki (Recent Quarter)</p>
          <p className="text-xl font-bold text-slate-900 mt-2">Para {history[0]?.sabkiPara || 17}</p>
          <p className="text-xs text-slate-500 mt-1">Status: Jayyid Jiddan (Very Good)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Dour (Full Quran Cycle)</p>
          <p className="text-xl font-bold text-slate-900 mt-2">
            Paras {history[0]?.dourParaStart || 1} to {history[0]?.dourParaEnd || 5}
          </p>
          <p className="text-xs text-slate-500 mt-1">Cycle Grade: Mumtaz (Excellent)</p>
        </div>
      </div>

      {/* Chronological History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Historical Hifz Recitation Log</h3>
          <span className="text-xs text-slate-500">{history.length} Daily Sessions</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Loading recitation logs...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No recitation logs for this student</p>
            <p className="text-sm text-slate-400 mt-1">Click Record Daily Sabak above to log today&apos;s progress.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sabak Recited</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Total Progress</th>
                  <th className="py-3 px-4">Teacher Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/75">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {new Date(rec.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">
                        Para {rec.sabakPara} • {rec.sabakSurah}
                      </p>
                      <p className="text-xs text-slate-400">
                        Ayat {rec.sabakAyatStart} - {rec.sabakAyatEnd}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rec.sabakGrade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{rec.totalParasMemorized} / 30 Paras</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <p>{rec.teacherNotes || 'MashaAllah satisfactory performance.'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">By: {rec.evaluatedBy}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-emerald-400" />
                Record Daily Sabak & Recitation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sabak Para (1-30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={sabakPara}
                    onChange={(e) => setSabakPara(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Surah Name</label>
                  <input
                    type="text"
                    value={sabakSurah}
                    onChange={(e) => setSabakSurah(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Ayat</label>
                  <input
                    type="number"
                    value={sabakAyatStart}
                    onChange={(e) => setSabakAyatStart(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Ayat</label>
                  <input
                    type="number"
                    value={sabakAyatEnd}
                    onChange={(e) => setSabakAyatEnd(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sabak Grade</label>
                  <select
                    value={sabakGrade}
                    onChange={(e) => setSabakGrade(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                  >
                    <option value="Excellent">Mumtaz (Excellent)</option>
                    <option value="Very Good">Jayyid Jiddan (Very Good)</option>
                    <option value="Good">Jayyid (Good)</option>
                    <option value="Fair">Maqbool (Fair)</option>
                    <option value="Needs Revision">Needs Revision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Paras Completed</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={totalParas}
                    onChange={(e) => setTotalParas(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Tajweed & Makhraj Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Save to Hifz Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
