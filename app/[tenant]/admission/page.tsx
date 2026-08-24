'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  Compass,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  FileText,
  UserCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  Copy,
  Check,
  Filter,
  Eye,
  Settings as SettingsIcon,
  Users,
  Building2,
  Calendar,
  GraduationCap,
  X,
  CreditCard,
  QrCode,
  Sliders,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdmissionPage() {
  const { tenantSlug, branding, institutionTypeConfig } = useTenant();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Structure & Settings
  const [structure, setStructure] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);

  // Modals & Drawers
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showAdmitConfirm, setShowAdmitConfirm] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Online Test States
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTestForExam, setSelectedTestForExam] = useState<any | null>(null);
  const [candidateAppForTest, setCandidateAppForTest] = useState<any | null>(null);
  const [testActive, setTestActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any | null>(null);

  // Fetch Academic Structure and Settings
  const fetchStructureAndSettings = async () => {
    try {
      const [structRes, setRes] = await Promise.all([
        fetch(`/api/academics?tenantSlug=${tenantSlug}`),
        fetch(`/api/admissions/settings?tenantSlug=${tenantSlug}`)
      ]);
      const structData = await structRes.json();
      const setData = await setRes.json();
      if (structData.success) setStructure(structData.data);
      if (setData.success) setSettings(setData.data);
    } catch {
      // Ignored
    }
  };

  // Fetch Applications
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('tenantSlug', tenantSlug);
      if (activeTab !== 'ALL') queryParams.append('status', activeTab);
      if (selectedCampus) queryParams.append('campusId', selectedCampus);
      if (selectedClass) queryParams.append('classId', selectedClass);
      if (searchTerm.trim()) queryParams.append('search', searchTerm.trim());

      const res = await fetch(`/api/admissions?${queryParams.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (res.status === 403) throw new Error('You do not have permission to view admission records for this institution.');
        const errorMsg = typeof json.error === 'string' ? json.error : (json.error?.message || json.message || 'Unable to load admission applications.');
        throw new Error(errorMsg);
      }

      setApplications(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admission applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tests
  const fetchTests = async () => {
    try {
      const res = await fetch(`/api/admissions/test?tenantSlug=${tenantSlug}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableTests(json.data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchStructureAndSettings();
      fetchApplications();
      fetchTests();
    }
  }, [tenantSlug, activeTab, selectedCampus, selectedClass]);

  // Timed Exam Countdown
  useEffect(() => {
    let timer: any;
    if (testActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && testActive) {
      handleOnlineTestSubmit();
    }
    return () => clearInterval(timer);
  }, [testActive, timeLeft]);

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/apply/${tenantSlug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Status Transition
  const handleTransitionStatus = async (appId: string, targetStatus: string, notes?: string, interviewScore?: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSITION_STATUS',
          tenantSlug,
          applicationId: appId,
          targetStatus,
          notes,
          interviewScore
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update application status.');
      }
      fetchApplications();
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(json.data);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Final Student Admission
  const handleConvertStudent = async (appId: string, sectionId?: string, rollNumber?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONVERT_TO_STUDENT',
          tenantSlug,
          applicationId: appId,
          sectionId: sectionId || null,
          customRollNumber: rollNumber || null,
          createPortalAccount: true
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to admit applicant.');
      }
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      setShowAdmitConfirm(null);
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Error during student admission and enrollment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Start Candidate Exam
  const startExamForCandidate = async (app: any, testId: string) => {
    try {
      const res = await fetch(`/api/admissions/test?tenantSlug=${tenantSlug}&testId=${testId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error('Failed to load admission test questions.');

      setSelectedTestForExam(json.data);
      setCandidateAppForTest(app);
      setAnswers({});
      setTimeLeft((json.data.durationMinutes || 30) * 60);
      setTestActive(true);
      setTestResult(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Online Test
  const handleOnlineTestSubmit = async () => {
    setTestActive(false);
    if (!candidateAppForTest || !selectedTestForExam) return;

    try {
      const res = await fetch('/api/admissions/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          applicationId: candidateAppForTest.id,
          testId: selectedTestForExam.id,
          answers
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to evaluate test');

      setTestResult(json.data);
      if (json.data.isPassed) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Error submitting admission test.');
    }
  };

  // Stats calculation
  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === 'SUBMITTED').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    verified: applications.filter((a) => a.status === 'VERIFIED').length,
    testEligible: applications.filter((a) => a.status === 'TEST_ELIGIBLE').length,
    tested: applications.filter((a) => a.status === 'TESTED').length,
    selected: applications.filter((a) => a.status === 'SELECTED').length,
    admitted: applications.filter((a) => a.status === 'ADMITTED').length,
    waitlisted: applications.filter((a) => a.status === 'WAITLISTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-indigo-600" />
            Online Admission & Enrollment Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end multi-stage admission desk: Public application portal, candidate testing, interview scoring, and atomic student enrollment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={copyPublicLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Copy Public Admission Link'}
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setShowNewAppModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            New Admission Application
          </button>
          <button
            onClick={() => fetchApplications()}
            className="p-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Received</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 block uppercase tracking-wider">Under Review</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.submitted + stats.underReview}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 block uppercase tracking-wider">Verified / Test</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.verified + stats.testEligible + stats.tested}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 block uppercase tracking-wider">Selected / Waiting</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.selected + stats.waitlisted}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/30">
          <span className="text-xs font-semibold text-emerald-700 block uppercase tracking-wider">Admitted Students</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{stats.admitted}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Rejected</span>
          <span className="text-2xl font-black text-slate-500 mt-1 block">{stats.rejected}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-semibold scrollbar-thin">
          {[
            { key: 'ALL', label: 'All Applications' },
            { key: 'SUBMITTED', label: 'Submitted' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'VERIFIED', label: 'Verified' },
            { key: 'TEST_ELIGIBLE', label: 'Test Eligible' },
            { key: 'TESTED', label: 'Tested' },
            { key: 'INTERVIEW', label: 'Interview' },
            { key: 'SELECTED', label: 'Selected' },
            { key: 'WAITLISTED', label: 'Waitlisted' },
            { key: 'ADMITTED', label: 'Admitted' },
            { key: 'REJECTED', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by applicant name, app number, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="">All Campuses</option>
              {structure?.campuses?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            >
              <option value="">All Classes / Programs</option>
              {structure?.classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div className="flex-1">
            <span className="font-semibold block">Admission Engine Error</span>
            <span className="text-xs">{error}</span>
          </div>
          <button
            onClick={() => fetchApplications()}
            className="text-xs bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg font-medium text-rose-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Applications Table / Empty State */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading admission pipeline records...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No applications received yet</h3>
            <p className="text-xs text-slate-500">
              There are no admission applications under the selected status filter. You can submit a direct internal application or copy the public link.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowNewAppModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              New Admission Application
            </button>
            <button
              onClick={copyPublicLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Online Admission Link
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">App Number</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Target Placement</th>
                  <th className="py-3.5 px-4">Campus</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4">Scores</th>
                  <th className="py-3.5 px-4">Fee Status</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{app.applicationNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.firstName} {app.middleName ? `${app.middleName} ` : ''}{app.lastName}
                      <span className="block text-[10px] font-normal text-slate-400 font-mono">{app.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {app.desiredClass?.name || app.desiredProgram?.name || 'General'}
                      {app.shift && <span className="block text-[10px] text-slate-400">{app.shift.name}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{app.campus?.name || 'Main'}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-medium text-slate-800">{app.guardianName}</span>
                      <span className="block text-[10px] text-slate-400">{app.guardianPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.testScore !== null && (
                        <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-semibold text-[10px] mr-1">
                          Test: {app.testScore}
                        </span>
                      )}
                      {app.interviewScore !== null && (
                        <span className="inline-block bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono font-semibold text-[10px]">
                          Viva: {app.interviewScore}
                        </span>
                      )}
                      {app.testScore === null && app.interviewScore === null && (
                        <span className="text-slate-400 italic">No score</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.applicationFeeStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.applicationFeeStatus === 'NOT_REQUIRED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {app.applicationFeeStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          app.status === 'ADMITTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'SELECTED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : app.status === 'VERIFIED'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'TEST_ELIGIBLE' || app.status === 'TESTED'
                            ? 'bg-purple-100 text-purple-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'SELECTED' && (
                          <button
                            onClick={() => setShowAdmitConfirm(app)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors shadow-sm"
                          >
                            Admit Student
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Application Detail Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600">{selectedApp.applicationNumber}</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedApp.firstName} {selectedApp.lastName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Current Pipeline Stage</span>
                  <span className="font-bold text-sm text-slate-900">{selectedApp.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fee Status</span>
                  <span className="font-semibold text-slate-800">{selectedApp.applicationFeeStatus}</span>
                </div>
              </div>

              {/* Student Demographics */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Demographics & Contact</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Gender & DOB</span>
                    <span className="font-semibold text-slate-800">{selectedApp.gender}, {new Date(selectedApp.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Blood & Religion</span>
                    <span className="font-semibold text-slate-800">{selectedApp.bloodGroup || 'N/A'}, {selectedApp.religion || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                    <span className="font-semibold text-slate-800">{selectedApp.phone}</span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Address</span>
                  <span className="font-semibold text-slate-800">{selectedApp.presentAddress}</span>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Guardian Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Primary Guardian</span>
                    <span className="font-semibold text-slate-800">{selectedApp.guardianName} ({selectedApp.guardianRelation})</span>
                    <span className="text-slate-500 block">{selectedApp.guardianPhone}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Parents</span>
                    <span className="font-semibold text-slate-800">F: {selectedApp.fatherName || selectedApp.guardianName}</span>
                    <span className="font-semibold text-slate-800 block">M: {selectedApp.motherName || 'Not recorded'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Placement */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Target Placement</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Class / Program</span>
                    <span className="font-semibold text-slate-800">{selectedApp.desiredClass?.name || selectedApp.desiredProgram?.name || 'General'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Campus</span>
                    <span className="font-semibold text-slate-800">{selectedApp.campus?.name || 'Main'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Shift</span>
                    <span className="font-semibold text-slate-800">{selectedApp.shift?.name || 'Morning'}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Progress Pipeline Action</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.status === 'SUBMITTED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleTransitionStatus(selectedApp.id, 'UNDER_REVIEW')}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      Start Review
                    </button>
                  )}
                  {(selectedApp.status === 'SUBMITTED' || selectedApp.status === 'UNDER_REVIEW') && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleTransitionStatus(selectedApp.id, 'VERIFIED')}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                    >
                      Verify Application
                    </button>
                  )}
                  {selectedApp.status === 'VERIFIED' && (
                    <>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus(selectedApp.id, 'TEST_ELIGIBLE')}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                      >
                        Mark Test Eligible
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus(selectedApp.id, 'SELECTED')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Select Directly (No Test)
                      </button>
                    </>
                  )}
                  {selectedApp.status === 'TEST_ELIGIBLE' && availableTests.length > 0 && (
                    <button
                      disabled={actionLoading}
                      onClick={() => {
                        setSelectedApp(null);
                        startExamForCandidate(selectedApp, availableTests[0].id);
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                    >
                      Launch Online Admission Assessment
                    </button>
                  )}
                  {(selectedApp.status === 'TESTED' || selectedApp.status === 'INTERVIEW') && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleTransitionStatus(selectedApp.id, 'SELECTED')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      Select for Admission
                    </button>
                  )}
                  {selectedApp.status === 'SELECTED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => {
                        setSelectedApp(null);
                        setShowAdmitConfirm(selectedApp);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md"
                    >
                      🎓 Admit & Enroll Student Now
                    </button>
                  )}
                  {selectedApp.status !== 'REJECTED' && selectedApp.status !== 'ADMITTED' && (
                    <>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus(selectedApp.id, 'WAITLISTED')}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium"
                      >
                        Waitlist
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus(selectedApp.id, 'REJECTED')}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Admission Confirmation Dialog */}
      {showAdmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Confirm Student Admission</h3>
              <p className="text-xs text-slate-500">
                You are about to admit and create an active SIS Student and Academic Enrollment record for:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl font-semibold text-slate-800 text-sm mt-2">
                {showAdmitConfirm.firstName} {showAdmitConfirm.lastName}
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Class/Program:</span>
                <span className="font-semibold text-slate-800">
                  {showAdmitConfirm.desiredClass?.name || showAdmitConfirm.desiredProgram?.name || 'General'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campus:</span>
                <span className="font-semibold text-slate-800">{showAdmitConfirm.campus?.name || 'Main'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Fee:</span>
                <span className="font-bold text-indigo-600">
                  {showAdmitConfirm.admissionFeeAmount > 0 ? `BDT ${showAdmitConfirm.admissionFeeAmount}` : 'Configured / Free'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdmitConfirm(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleConvertStudent(showAdmitConfirm.id)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm & Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Internal Application Wizard */}
      {showNewAppModal && (
        <InternalApplicationWizardModal
          tenantSlug={tenantSlug}
          structure={structure}
          settings={settings}
          institutionType={institutionTypeConfig?.type || 'SCHOOL'}
          onClose={() => setShowNewAppModal(false)}
          onSuccess={() => {
            setShowNewAppModal(false);
            fetchApplications();
          }}
        />
      )}

      {/* MODAL 4: Admission Settings */}
      {showSettingsModal && (
        <AdmissionSettingsModal
          tenantSlug={tenantSlug}
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSuccess={() => {
            setShowSettingsModal(false);
            fetchStructureAndSettings();
          }}
        />
      )}

      {/* MODAL 5: Online Admission Assessment Modal */}
      {testActive && selectedTestForExam && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded">
                  Online Assessment
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTestForExam.title}</h3>
                <span className="text-xs text-slate-500">Candidate: {candidateAppForTest?.firstName} {candidateAppForTest?.lastName}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono text-sm font-bold">
                <Clock className="w-4 h-4 text-purple-400" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="space-y-6">
              {selectedTestForExam.questions?.map((q: any, idx: number) => (
                <div key={q.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Q{idx + 1}. {q.text}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt: string) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          answers[q.id] === opt
                            ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTestActive(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-medium"
              >
                Cancel Exam
              </button>
              <button
                type="button"
                onClick={handleOnlineTestSubmit}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-100"
              >
                Submit Answers for Grading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Internal Multi-Step Application Wizard Modal
 */
function InternalApplicationWizardModal({
  tenantSlug,
  structure,
  settings,
  institutionType,
  onClose,
  onSuccess
}: {
  tenantSlug: string;
  structure: any;
  settings: any;
  institutionType: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    religion: 'Islam',
    phone: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',

    fatherName: '',
    fatherPhone: '',
    fatherProfession: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',

    campusId: structure?.campuses?.[0]?.id || '',
    academicYearId: structure?.academicYears?.[0]?.id || '',
    desiredClassId: structure?.classes?.[0]?.id || '',
    desiredProgramId: structure?.departments?.[0]?.programs?.[0]?.id || '',
    shiftId: structure?.shifts?.[0]?.id || '',
    sectionId: '',
    academicGroupId: structure?.academicGroups?.[0]?.id || '',
    technologyTradeId: structure?.technologyTrades?.[0]?.id || '',
    hifzProgram: false,

    previousSchool: '',
    previousClass: '',
    previousGpa: '',

    admissionFeeAmount: settings?.admissionFeeDefault || 0
  });

  const update = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        tenantSlug,
        campusId: form.campusId,
        academicYearId: form.academicYearId,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup || null,
        religion: form.religion || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        presentAddress: form.presentAddress.trim(),
        permanentAddress: form.permanentAddress.trim() || form.presentAddress.trim(),

        desiredClassId: form.desiredClassId || null,
        desiredProgramId: form.desiredProgramId || null,
        shiftId: form.shiftId || null,
        sectionId: form.sectionId || null,
        academicGroupId: form.academicGroupId || null,
        technologyTradeId: form.technologyTradeId || null,
        hifzProgram: form.hifzProgram,

        guardianName: form.guardianName.trim() || form.fatherName.trim(),
        guardianPhone: form.guardianPhone.trim() || form.fatherPhone.trim(),
        guardianRelation: form.guardianRelation,
        fatherName: form.fatherName.trim() || null,
        fatherPhone: form.fatherPhone.trim() || null,
        fatherProfession: form.fatherProfession.trim() || null,
        motherName: form.motherName.trim() || null,
        motherPhone: form.motherPhone.trim() || null,

        previousSchool: form.previousSchool.trim() || null,
        previousClass: form.previousClass.trim() || null,
        previousGpa: form.previousGpa ? parseFloat(form.previousGpa) : null,
        admissionFeeAmount: form.admissionFeeAmount ? Number(form.admissionFeeAmount.toString().replace(/^0+([1-9])/, '$1')) : 0
      };

      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const detailMsg = Array.isArray(json.details) && json.details.length > 0
          ? json.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(', ')
          : null;
        throw new Error(detailMsg || json.error || 'Failed to submit application.');
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">New Admission Application Wizard</h3>
            <span className="text-xs text-slate-400">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider">1. Student Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => update('dateOfBirth', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Male" className="bg-slate-900 text-white">Male</option>
                  <option value="Female" className="bg-slate-900 text-white">Female</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Present Address *</label>
              <textarea
                rows={2}
                required
                value={form.presentAddress}
                onChange={(e) => update('presentAddress', e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider">2. Parents & Guardian</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Father Name *</label>
                <input
                  type="text"
                  required
                  value={form.fatherName}
                  onChange={(e) => update('fatherName', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Father Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.fatherPhone}
                  onChange={(e) => update('fatherPhone', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mother Name *</label>
                <input
                  type="text"
                  required
                  value={form.motherName}
                  onChange={(e) => update('motherName', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Legal Guardian Name</label>
                <input
                  type="text"
                  value={form.guardianName}
                  onChange={(e) => update('guardianName', e.target.value)}
                  placeholder="Leave blank to use Father"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider">3. Academic Placement & Fee</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Campus *</label>
                <select
                  value={form.campusId}
                  onChange={(e) => update('campusId', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {structure?.campuses?.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Academic Year *</label>
                <select
                  value={form.academicYearId}
                  onChange={(e) => update('academicYearId', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {structure?.academicYears?.map((ay: any) => (
                    <option key={ay.id} value={ay.id} className="bg-slate-900 text-white">{ay.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Target Class / Program *</label>
                <select
                  value={form.desiredClassId}
                  onChange={(e) => update('desiredClassId', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {structure?.classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Admission Fee (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={form.admissionFeeAmount}
                  onChange={(e) => update('admissionFeeAmount', e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((p) => p - 1)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Previous
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((p) => p + 1)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Admission Settings Configuration Modal
 */
function AdmissionSettingsModal({
  tenantSlug,
  settings,
  onClose,
  onSuccess
}: {
  tenantSlug: string;
  settings: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    isOnlineAdmissionOpen: settings?.isOnlineAdmissionOpen ?? true,
    applicationFee: settings?.applicationFee ?? 0,
    admissionFeeDefault: settings?.admissionFeeDefault ?? 0,
    isTestRequired: settings?.isTestRequired ?? false,
    isInterviewRequired: settings?.isInterviewRequired ?? false,
    maxCapacityPerClass: settings?.maxCapacityPerClass ?? 40,
    applicationNumberPrefix: settings?.applicationNumberPrefix || 'APP'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admissions/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          ...form,
          applicationFee: parseFloat(form.applicationFee as any),
          admissionFeeDefault: parseFloat(form.admissionFeeDefault as any),
          maxCapacityPerClass: parseInt(form.maxCapacityPerClass as any, 10)
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to save settings');
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Admission Policy Settings
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block">Online Admission Open</span>
              <span className="text-[10px] text-slate-500">Allow public candidates to apply via online portal</span>
            </div>
            <input
              type="checkbox"
              checked={form.isOnlineAdmissionOpen}
              onChange={(e) => setForm((p) => ({ ...p, isOnlineAdmissionOpen: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block">Require Admission Test</span>
              <span className="text-[10px] text-slate-500">Mandate candidate test before selection</span>
            </div>
            <input
              type="checkbox"
              checked={form.isTestRequired}
              onChange={(e) => setForm((p) => ({ ...p, isTestRequired: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Application Fee (BDT)</label>
              <input
                type="number"
                min="0"
                value={form.applicationFee}
                onChange={(e) => setForm((p) => ({ ...p, applicationFee: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Admission Fee</label>
              <input
                type="number"
                min="0"
                value={form.admissionFeeDefault}
                onChange={(e) => setForm((p) => ({ ...p, admissionFeeDefault: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">App Number Prefix</label>
              <input
                type="text"
                value={form.applicationNumberPrefix}
                onChange={(e) => setForm((p) => ({ ...p, applicationNumberPrefix: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Max Class Capacity</label>
              <input
                type="number"
                min="1"
                value={form.maxCapacityPerClass}
                onChange={(e) => setForm((p) => ({ ...p, maxCapacityPerClass: e.target.value }))}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}
