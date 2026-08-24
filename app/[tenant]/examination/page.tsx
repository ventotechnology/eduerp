'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  Award,
  FileSpreadsheet,
  Printer,
  QrCode,
  CheckCircle2,
  Sparkles,
  Download,
  Eye,
  X,
  GraduationCap,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function ExaminationPage() {
  const { branding, institutionType, tenantSlug } = useTenant();
  const isUniversity = institutionType === 'UNIVERSITY';

  const [activeTab, setActiveTab] = useState<'EXAMS' | 'TABULATION' | 'CERTIFICATES'>('EXAMS');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [reportCardData, setReportCardData] = useState<any | null>(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for creating exams
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('TERM');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/exams?tenantId=${tenantSlug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setExams(json.data);
        if (json.data.length > 0 && !selectedExam) {
          setSelectedExam(json.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [tenantSlug]);

  const handlePrintReport = async (studentId?: string) => {
    if (!selectedExam) return;
    try {
      const stId = studentId || selectedExam.marksEntries?.[0]?.studentId || 'sample';
      const res = await fetch(`/api/exams?tenantId=${tenantSlug}&action=REPORT_CARD&examId=${selectedExam.id}&studentId=${stId}`);
      const json = await res.json();
      if (json.success) {
        setReportCardData(json.data);
        setShowReportCardModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Examination Engine, Result Publication & Progression Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theory, Practical, Assignment & Attendance mark components with multi-tier workflow, immutable snapshots, and tamper-proof verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadExams()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePrintReport()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>{isUniversity ? 'Generate Official Transcript' : 'Print Branded Report Card'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('EXAMS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'EXAMS' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Examinations & Schedules
        </button>
        <button
          onClick={() => setActiveTab('TABULATION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'TABULATION' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Tabulation & Marks Moderation
        </button>
        <button
          onClick={() => setActiveTab('CERTIFICATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'CERTIFICATES' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Transcripts & Certificates
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'EXAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Exam List */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center justify-between">
              <span>Active Examinations</span>
              <span className="text-xs text-blue-600 font-mono">({exams.length})</span>
            </h3>

            {isLoading ? (
              <p className="text-xs text-slate-400">Loading exams...</p>
            ) : exams.length === 0 ? (
              <p className="text-xs text-slate-400">No examinations configured yet.</p>
            ) : (
              <div className="space-y-2">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExam(ex)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${selectedExam?.id === ex.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ex.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ex.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                        {ex.publicationStatus || (ex.isPublished ? 'PUBLISHED' : 'INTERNAL')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Type: {ex.type} • Term {ex.termNumber}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span>Schedules: {ex._count?.schedules || 0}</span>
                      <span>Marks: {ex._count?.marksEntries || 0}</span>
                      <span>Eligible: {ex._count?.eligibilities || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam Details & Summary */}
          <div className="md:col-span-2 space-y-4">
            {selectedExam ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedExam.name}</h2>
                    <p className="text-xs text-slate-500">
                      Session: {selectedExam.session?.academicYear?.name || 'Academic Session'} • Status: {selectedExam.publicationStatus}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePrintReport()}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Tabulation</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block">Total Entries</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{selectedExam._count?.marksEntries || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block">Exam Schedules</span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">{selectedExam._count?.schedules || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block">Finalized Results</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{selectedExam._count?.results || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block">Publication</span>
                    <span className="text-xs font-bold text-indigo-500 mt-1 block">{selectedExam.isPublished ? 'LIVE' : 'DRAFT'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <span>
                    Exam results are secured with server-side tenant isolation and immutable versioned snapshots. Marks moderation changes generate tamper-proof audit trails.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                Select an examination from the list to view scheduling and marks moderation details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabulation Sheet */}
      {activeTab === 'TABULATION' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Marks Tabulation Sheet • {selectedExam?.name || 'Current Exam'}
              </h3>
              <p className="text-xs text-slate-500">
                Multi-tier workflow: Draft $\rightarrow$ Submitted $\rightarrow$ Under Review $\rightarrow$ Approved $\rightarrow$ Locked
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Calculated on Server GPA Scale
              </span>
            </div>
          </div>

          <div className="p-8 text-center text-xs text-slate-500">
            Tabulation marks grid loaded dynamically from central persistence. Select an exam or click Print Report Card to generate full breakdown.
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'CERTIFICATES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Cryptographic Certificates & Official Transcripts
              </h3>
              <p className="text-xs text-slate-500">
                All certificates issued in EduERP include an HMAC-SHA256 digital integrity hash and QR verification endpoint.
              </p>
            </div>
            <a
              href="/verify/CERT-2026-SAMPLE"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Public Verification Portal</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="font-bold text-slate-900 dark:text-white">Academic Transcripts</h4>
              <p className="text-slate-500 mt-1">Official semester and final cumulative transcripts with completed credit breakdown.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="font-bold text-slate-900 dark:text-white">Testimonial & Character</h4>
              <p className="text-slate-500 mt-1">Official institutional character certificates for passing graduates.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="font-bold text-slate-900 dark:text-white">Graduation Degree Seal</h4>
              <p className="text-slate-500 mt-1">Degree classification and convocation verification records.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Report Card */}
      {showReportCardModal && reportCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowReportCardModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Institution Brand Header */}
            <div className="text-center border-b pb-6 space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {reportCardData.institution?.name || branding.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {reportCardData.institution?.address || branding.address} • EIIN: {reportCardData.institution?.eiin || '108421'}
              </p>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                {reportCardData.exam?.name}
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Student Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{reportCardData.student?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Student ID #</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{reportCardData.student?.studentIdNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Class & Section</span>
                <span className="font-bold text-slate-900 dark:text-white">{reportCardData.student?.class} ({reportCardData.student?.section})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Overall GPA</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {reportCardData.results?.gpa.toFixed(2)} (Grade {reportCardData.results?.letterGrade})
                </span>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">Subject / Course</th>
                    <th className="p-3 text-center">Marks</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Grade Point</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportCardData.results?.subjects?.map((sub: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {sub.name || sub.code}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {sub.totalMarks}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-600">
                        {sub.letterGrade}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">
                        {sub.gradePoint.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                Verified with QR: <span className="font-mono text-blue-500">{reportCardData.qrVerificationUrl}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
