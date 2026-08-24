'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Award,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  Printer,
  QrCode,
  AlertCircle
} from 'lucide-react';

export default function PublicResultsPage() {
  const [tenantSlug, setTenantSlug] = useState('scholars-dhaka');
  const [studentIdOrRoll, setStudentIdOrRoll] = useState('SCH-2026-0001');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentIdOrRoll.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/exams?action=PUBLIC_RESULT&tenantId=${tenantSlug}&studentIdNumber=${encodeURIComponent(
          studentIdOrRoll
        )}`
      );
      const json = await res.json();
      if (json.success) {
        setSearchResult(json.data);
      } else {
        setSearchResult(null);
        setErrorMsg(json.error?.message || 'No published result found for this student ID.');
      }
    } catch (err: any) {
      setSearchResult(null);
      setErrorMsg('Failed to query academic result server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial auto-search for demo if parameter present
    const params = new URLSearchParams(window.location.search);
    const id = params.get('studentIdNumber');
    const slug = params.get('tenant') || params.get('slug');
    if (slug) setTenantSlug(slug);
    if (id) {
      setStudentIdOrRoll(id);
      fetch(
        `/api/exams?action=PUBLIC_RESULT&tenantId=${slug || 'scholars-dhaka'}&studentIdNumber=${encodeURIComponent(id)}`
      )
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setSearchResult(json.data);
            setSearched(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <div className="max-w-3xl w-full mx-auto space-y-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Portal</span>
        </Link>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Public Academic Results Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Online Examination Results & Marksheet Search
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter your Institution, Student ID or Roll Number to retrieve official term marks and grade points from verified database records.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Institution</label>
            <select
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
            >
              <option value="scholars-dhaka">Dhaka Scholars International (School)</option>
              <option value="ideal-college">Ideal College Dhanmondi (College)</option>
              <option value="darul-uloom">Darul Uloom Central Madrasha (Madrasha)</option>
              <option value="green-university">Green University (Higher Ed)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Student ID or Roll #</label>
            <input
              type="text"
              placeholder="e.g. SCH-2026-0001"
              value={studentIdOrRoll}
              onChange={(e) => setStudentIdOrRoll(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Searching...' : 'Search Results'}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Result Card */}
        {searched && searchResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-400 block font-mono">
                  {searchResult.studentIdNumber} {searchResult.rollNumber ? `• Roll: ${searchResult.rollNumber}` : ''}
                </span>
                <h2 className="text-lg font-black text-white">{searchResult.studentName}</h2>
                <p className="text-xs text-slate-400 font-medium">{searchResult.examName} ({searchResult.academicYear})</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                <Award className="w-8 h-8 text-amber-400" />
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">GPA / Status</span>
                  <span className="text-base font-black text-emerald-400">
                    {searchResult.gpa.toFixed(2)} (Grade {searchResult.letterGrade})
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="p-3">Subject / Course</th>
                    <th className="p-3 text-center">Marks Obtained</th>
                    <th className="p-3 text-center">Letter Grade</th>
                    <th className="p-3 text-center">Grade Point</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {searchResult.subjectResults.map((sub: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-slate-200">
                        {sub.name || sub.code}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-100">
                        {sub.totalMarks}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-400">
                        {sub.letterGrade}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {sub.gradePoint.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.status === 'PASS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Result from EduERP Secure Central Registry</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 font-bold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Marksheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-[10px] text-slate-600">
        EduERP Public Examination & Transcript Verification Protocol • Cryptographically Secure
      </footer>
    </div>
  );
}
