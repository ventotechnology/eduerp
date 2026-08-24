'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { getTenantCache, setTenantCache, invalidateTenantCache } from '@/lib/cache/tenant-cache';
import {
  BookOpen,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Star,
  Check,
  GraduationCap,
  Sliders,
  FolderPlus,
  BookMarked
} from 'lucide-react';

export default function AcademicsPage() {
  const { branding, institutionType, institutionTypeConfig, tenantSlug } = useTenant();

  const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'sections' | 'subjects' | 'routine' | 'sessions' | 'groups'>('years');
  const [structure, setStructure] = useState<any>(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      return getTenantCache<any>(tenantSlug, 'structure', '') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      return !getTenantCache<any>(tenantSlug, 'structure', '');
    }
    return true;
  });
  const [timetable, setTimetable] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      return getTenantCache<any[]>(tenantSlug, 'timetable', '') || [];
    }
    return [];
  });
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Feedback notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showYearModal, setShowYearModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  // Form States
  const [yearForm, setYearForm] = useState({
    name: '2026',
    code: 'AY-2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    admissionStartDate: '2025-11-01',
    admissionEndDate: '2026-03-31',
    status: 'ACTIVE',
    isCurrent: true
  });

  const [classForm, setClassForm] = useState({
    name: 'Hifz Beginner',
    numericValue: 1,
    sequence: 1,
    stage: 'HIFZ',
    shift: 'Morning'
  });

  const [sectionForm, setSectionForm] = useState({
    classId: '',
    name: 'A',
    capacity: 40,
    roomNumber: 'Room 101',
    group: 'General'
  });

  const [subjectForm, setSubjectForm] = useState({
    classId: '',
    name: 'Quran Mazid & Tajweed',
    code: 'QRN-101',
    type: 'COMPULSORY',
    fullMarks: 100,
    passMarks: 40,
    theoryMarks: 60,
    practicalMarks: 40,
    assignmentMarks: 0,
    attendanceMarks: 0
  });

  const [sessionForm, setSessionForm] = useState({
    academicYearId: '',
    name: 'Annual Term 2026',
    type: 'ANNUAL',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    isCurrent: true
  });

  const [groupForm, setGroupForm] = useState({
    name: 'General',
    code: 'GEN',
    description: 'General Academic Stream'
  });

  // Timetable Slot Form
  const [slotDay, setSlotDay] = useState('SUNDAY');
  const [slotStartTime, setSlotStartTime] = useState('08:00');
  const [slotEndTime, setSlotEndTime] = useState('08:45');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoomId, setSlotRoomId] = useState('');
  const [slotSectionId, setSlotSectionId] = useState('');

  const fetchStructure = useCallback(async (force = false) => {
    if (!tenantSlug) return;
    const cached = getTenantCache<any>(tenantSlug, 'structure', '');
    if (cached && !force) {
      setStructure(cached);
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }

    try {
      const structRes = await fetch(`/api/academics?tenantSlug=${tenantSlug}`);
      const structData = await structRes.json();

      if (structData.success && structData.data) {
        setStructure(structData.data);
        setTenantCache(tenantSlug, 'structure', '', structData.data, { ttlMs: 300000 });
        if (structData.data.classes?.length > 0 && !sectionForm.classId) {
          setSectionForm((prev) => ({ ...prev, classId: structData.data.classes[0].id }));
          setSubjectForm((prev) => ({ ...prev, classId: structData.data.classes[0].id }));
        }
        if (structData.data.academicYears?.length > 0 && !sessionForm.academicYearId) {
          setSessionForm((prev) => ({ ...prev, academicYearId: structData.data.academicYears[0].id }));
        }
        if (structData.data.rooms?.length > 0 && !slotRoomId) {
          setSlotRoomId(structData.data.rooms[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load academic structure');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, sectionForm.classId, sessionForm.academicYearId, slotRoomId]);

  const fetchTimetable = useCallback(async (force = false) => {
    if (!tenantSlug) return;
    const cached = getTenantCache<any[]>(tenantSlug, 'timetable', '');
    if (cached && !force) {
      setTimetable(cached);
      return;
    }
    try {
      setTimetableLoading(true);
      const res = await fetch(`/api/timetable?tenantId=${tenantSlug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTimetable(json.data);
        setTenantCache(tenantSlug, 'timetable', '', json.data, { ttlMs: 120000 });
      }
    } catch {
      // Ignored
    } finally {
      setTimetableLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (tenantSlug) {
      fetchStructure();
    }
  }, [tenantSlug, fetchStructure]);

  // Lazy load timetable only when switching to routine tab
  useEffect(() => {
    if (activeTab === 'routine' && tenantSlug) {
      fetchTimetable();
    }
  }, [activeTab, tenantSlug, fetchTimetable]);

  const fetchData = () => {
    invalidateTenantCache(tenantSlug, 'structure');
    invalidateTenantCache(tenantSlug, 'timetable');
    fetchStructure(true);
    if (activeTab === 'routine') {
      fetchTimetable(true);
    }
  };

  const showNotification = (success: string | null, error: string | null = null) => {
    setSuccessMessage(success);
    setErrorMessage(error);
    if (success) {
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // API Handlers
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_ACADEMIC_YEAR', tenantId: tenantSlug, ...yearForm })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create academic year');
      setShowYearModal(false);
      showNotification(`Academic Year '${yearForm.name}' created successfully.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrentYear = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_CURRENT_ACADEMIC_YEAR', tenantId: tenantSlug, id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set current academic year');
      showNotification(`Academic Year '${name}' marked as Current.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    }
  };

  const handleDeleteYear = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Academic Year '${name}'?`)) return;
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_ACADEMIC_YEAR', tenantId: tenantSlug, id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete academic year');
      showNotification(`Academic Year '${name}' deleted.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CLASS',
          tenantId: tenantSlug,
          ...classForm,
          numericValue: Number(classForm.numericValue),
          sequence: Number(classForm.sequence)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create class');
      setShowClassModal(false);
      showNotification(`Class '${classForm.name}' created successfully.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete class '${name}'?`)) return;
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CLASS', tenantId: tenantSlug, id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete class');
      showNotification(`Class '${name}' deleted.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SECTION',
          tenantId: tenantSlug,
          ...sectionForm,
          capacity: Number(sectionForm.capacity)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create section');
      setShowSectionModal(false);
      showNotification(`Section '${sectionForm.name}' created successfully.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete section '${name}'?`)) return;
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_SECTION', tenantId: tenantSlug, id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete section');
      showNotification(`Section '${name}' deleted.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SUBJECT',
          tenantId: tenantSlug,
          ...subjectForm,
          fullMarks: Number(subjectForm.fullMarks),
          passMarks: Number(subjectForm.passMarks),
          theoryMarks: Number(subjectForm.theoryMarks),
          practicalMarks: Number(subjectForm.practicalMarks),
          assignmentMarks: Number(subjectForm.assignmentMarks),
          attendanceMarks: Number(subjectForm.attendanceMarks)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create subject');
      setShowSubjectModal(false);
      showNotification(`Subject '${subjectForm.name}' created successfully.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete subject '${name}'?`)) return;
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_SUBJECT', tenantId: tenantSlug, id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete subject');
      showNotification(`Subject '${name}' deleted.`);
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    }
  };

  const handleApplyTemplate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPLY_MADRASHA_TEMPLATE', tenantId: tenantSlug })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to apply template');
      setShowTemplateModal(false);
      showNotification('Bangladesh Madrasha Starter Structure applied successfully!');
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantSlug,
          dayOfWeek: slotDay,
          startTime: slotStartTime,
          endTime: slotEndTime,
          subjectName: slotSubject || 'Quran Mazid',
          teacherName: slotTeacher || 'Ustadh Saifullah',
          roomId: slotRoomId || undefined,
          sectionId: slotSectionId || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to schedule routine slot');
      setShowRoutineModal(false);
      showNotification('Timetable routine slot scheduled successfully.');
      fetchData();
    } catch (err: any) {
      showNotification(null, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {institutionTypeConfig?.label || 'Academic Engine'}
            </span>
            <span className="text-xs text-slate-400">
              Academic Setup & Curriculum Management Center
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {branding?.name || 'Academic Setup'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Academic Years, Madrasha Levels, Programs, Classes, Sections, Subjects, and Timetable schedules.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {institutionType === 'MADRASHA' && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Madrasha Starter Template</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'years') setShowYearModal(true);
              else if (activeTab === 'classes') setShowClassModal(true);
              else if (activeTab === 'sections') setShowSectionModal(true);
              else if (activeTab === 'subjects') setShowSubjectModal(true);
              else if (activeTab === 'routine') setShowRoutineModal(true);
              else setShowYearModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'years' && 'Create Academic Year'}
              {activeTab === 'classes' && 'Add Class / Level'}
              {activeTab === 'sections' && 'Add Section'}
              {activeTab === 'subjects' && 'Add Subject'}
              {activeTab === 'routine' && 'Schedule Routine Slot'}
              {activeTab === 'sessions' && 'Add Session / Term'}
              {activeTab === 'groups' && 'Add Group / Stream'}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400">
        {[
          { id: 'years', label: 'Academic Years', icon: Calendar, count: structure?.academicYears?.length || 0 },
          { id: 'classes', label: 'Classes & Levels', icon: GraduationCap, count: structure?.classes?.length || 0 },
          { id: 'sections', label: 'Sections', icon: Layers, count: structure?.classes?.reduce((acc: number, c: any) => acc + (c.sections?.length || 0), 0) || 0 },
          { id: 'subjects', label: 'Subjects & Curriculum', icon: BookOpen, count: structure?.classes?.reduce((acc: number, c: any) => acc + (c.subjects?.length || 0), 0) || 0 },
          { id: 'routine', label: 'Timetable Routine', icon: Clock, count: timetable.length },
          { id: 'sessions', label: 'Sessions & Terms', icon: BookMarked, count: structure?.academicYears?.reduce((acc: number, y: any) => acc + (y.sessions?.length || 0), 0) || 0 },
          { id: 'groups', label: 'Groups & Streams', icon: Sliders, count: structure?.groups?.length || 0 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Academic Years */}
      {activeTab === 'years' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Academic Years</span>
            </h2>
            <button
              onClick={() => setShowYearModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Academic Year</span>
            </button>
          </div>

          {!structure?.academicYears || structure.academicYears.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-950 border border-slate-800 p-8 space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Academic Year Configured</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your institution requires at least one active Academic Year to enable student admissions, enrollment, and attendance records.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setShowYearModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Create Academic Year
                </button>
                {institutionType === 'MADRASHA' && (
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700"
                  >
                    Apply Madrasha Starter Template
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Academic Year</th>
                    <th className="pb-3 font-semibold">Code</th>
                    <th className="pb-3 font-semibold">Duration</th>
                    <th className="pb-3 font-semibold">Admission Window</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Current</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {structure.academicYears.map((ay: any) => (
                    <tr key={ay.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <span>{ay.name}</span>
                        {ay.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Current Year
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-400">{ay.code || `AY-${ay.name}`}</td>
                      <td className="py-3">
                        {new Date(ay.startDate).toLocaleDateString()} — {new Date(ay.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-slate-400">
                        {ay.admissionStartDate ? (
                          `${new Date(ay.admissionStartDate).toLocaleDateString()} to ${new Date(ay.admissionEndDate || ay.endDate).toLocaleDateString()}`
                        ) : (
                          <span className="text-slate-500">Not set</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ay.status === 'ACTIVE'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ay.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {!ay.isCurrent ? (
                          <button
                            onClick={() => handleSetCurrentYear(ay.id, ay.name)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            Set Active
                          </button>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteYear(ay.id, ay.name)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Academic Year"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Classes & Levels */}
      {activeTab === 'classes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Classes, Levels & Programs</span>
            </h2>
            <button
              onClick={() => setShowClassModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class / Level</span>
            </button>
          </div>

          {!structure?.classes || structure.classes.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-950 border border-slate-800 p-8 space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Classes or Programs Configured</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Add your institutional levels (e.g. Hifz Beginner, Dakhil 6, Play, Grade 1) to enable sections and course assignments.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowClassModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Configure Classes / Programs
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {structure.classes.map((cls: any) => (
                <div key={cls.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {cls.stage || 'General'}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1">{cls.name}</h3>
                      <span className="text-[11px] text-slate-400">Sequence: #{cls.sequence} • Shift: {cls.shift}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>{cls.sections?.length || 0} Sections</span>
                    <span>{cls.subjects?.length || 0} Subjects</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Sections */}
      {activeTab === 'sections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Class Sections</span>
            </h2>
            <button
              onClick={() => setShowSectionModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Class / Level</th>
                  <th className="pb-3 font-semibold">Section Name</th>
                  <th className="pb-3 font-semibold">Capacity</th>
                  <th className="pb-3 font-semibold">Room</th>
                  <th className="pb-3 font-semibold">Group / Stream</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {structure?.classes?.flatMap((cls: any) =>
                  (cls.sections || []).map((sec: any) => (
                    <tr key={sec.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-bold text-white">{cls.name}</td>
                      <td className="py-3 font-semibold text-emerald-400">{sec.name}</td>
                      <td className="py-3">{sec.capacity} students</td>
                      <td className="py-3 text-slate-400">{sec.roomNumber || 'Unassigned'}</td>
                      <td className="py-3 text-slate-400">{sec.group || 'General'}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteSection(sec.id, `${cls.name} - Section ${sec.name}`)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Subjects & Curriculum */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Subjects & Curriculum</span>
            </h2>
            <button
              onClick={() => setShowSubjectModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Class</th>
                  <th className="pb-3 font-semibold">Subject Name</th>
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Full Marks</th>
                  <th className="pb-3 font-semibold">Pass Marks</th>
                  <th className="pb-3 font-semibold">Theory / Practical</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {structure?.classes?.flatMap((cls: any) =>
                  (cls.subjects || []).map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-bold text-white">{cls.name}</td>
                      <td className="py-3 font-medium text-amber-300">{sub.name}</td>
                      <td className="py-3 font-mono text-slate-400">{sub.code}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white">{sub.fullMarks}</td>
                      <td className="py-3 text-emerald-400">{sub.passMarks}</td>
                      <td className="py-3 text-slate-400">{sub.theoryMarks} / {sub.practicalMarks}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteSubject(sub.id, `${cls.name} - ${sub.name}`)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Routine & Timetable */}
      {activeTab === 'routine' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Timetable Routine Schedule</span>
            </h2>
            <button
              onClick={() => setShowRoutineModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Slot</span>
            </button>
          </div>

          {timetable.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800 p-6">
              No timetable routine slots scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timetable.map((slot) => (
                <div key={slot.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{slot.dayOfWeek}</span>
                    <span className="font-mono text-slate-400">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{slot.subjectName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Teacher: {slot.teacherName || 'Assigned Staff'}</span>
                    <span>{slot.room?.roomNumber || 'Hall 1'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Academic Year */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Create Academic Year</span>
              </h3>
              <button onClick={() => setShowYearModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Academic Year Name *</label>
                <input
                  type="text"
                  required
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value, code: `AY-${e.target.value}` })}
                  placeholder="e.g. 2026 or 2026-2027"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={yearForm.startDate}
                    onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={yearForm.endDate}
                    onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Admission Start</label>
                  <input
                    type="date"
                    value={yearForm.admissionStartDate}
                    onChange={(e) => setYearForm({ ...yearForm, admissionStartDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Admission End</label>
                  <input
                    type="date"
                    value={yearForm.admissionEndDate}
                    onChange={(e) => setYearForm({ ...yearForm, admissionEndDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={yearForm.isCurrent}
                  onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isCurrent" className="font-semibold text-slate-300 cursor-pointer">
                  Mark as Current Active Academic Year
                </label>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Creating...' : 'Create Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Class / Level */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>Add Class / Level / Program</span>
              </h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class / Level Name *</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. Hifz Beginner, Nazera, Dakhil 6"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Numeric Value (Grade)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={classForm.numericValue}
                    onChange={(e) => setClassForm({ ...classForm, numericValue: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sequence Order</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={classForm.sequence}
                    onChange={(e) => setClassForm({ ...classForm, sequence: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Academic Stage</label>
                  <select
                    value={classForm.stage}
                    onChange={(e) => setClassForm({ ...classForm, stage: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="HIFZ">Hifz / Tahfiz</option>
                    <option value="NAZERA">Nazera</option>
                    <option value="EBTEDAYEE">Ebtedayee (1-5)</option>
                    <option value="DAKHIL">Dakhil (6-10)</option>
                    <option value="ALIM">Alim (11-12)</option>
                    <option value="FAZIL">Fazil (Degree)</option>
                    <option value="KAMIL">Kamil (Masters)</option>
                    <option value="PRIMARY">General Primary</option>
                    <option value="SECONDARY">General Secondary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Shift</label>
                  <select
                    value={classForm.shift}
                    onChange={(e) => setClassForm({ ...classForm, shift: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Day">Day Shift</option>
                    <option value="Evening">Evening Shift</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Adding...' : 'Add Class / Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Section */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Add Section</span>
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Class *</label>
                <select
                  required
                  value={sectionForm.classId}
                  onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  {structure?.classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Section Name *</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    placeholder="e.g. A, B, Green"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value, 10) || 40 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Room Number / Location</label>
                <input
                  type="text"
                  value={sectionForm.roomNumber}
                  onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                  placeholder="e.g. Room 101, Tahfiz Hall"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Adding...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Add Subject to Curriculum</span>
              </h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Class *</label>
                <select
                  required
                  value={subjectForm.classId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  {structure?.classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g. Quran Mazid, Hadith"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="e.g. QRN-101"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Marks</label>
                  <input
                    type="number"
                    value={subjectForm.fullMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, fullMarks: parseInt(e.target.value, 10) || 100 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={subjectForm.passMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: parseInt(e.target.value, 10) || 40 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="COMPULSORY">Compulsory</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="OPTIONAL">Optional</option>
                    <option value="4TH_SUBJECT">4th Subject</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Madrasha Starter Template Preview & Apply */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold text-white">Apply Madrasha Starter Template</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This one-click template configures standard draft academic structures for Bangladesh Madrashas:
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
              <div className="font-bold text-emerald-400">Included Structure:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Academic Year 2026 with Annual Session</li>
                <li>Hifz Beginner, Hifz Intermediate, Hifz Advanced & Nazera Levels</li>
                <li>Ebtedayee (Grade 1 & 5) and Dakhil (Grade 6 & 10) classes</li>
                <li>Standard Section &apos;A&apos; for each class level</li>
                <li>Curriculum subjects: Quran Mazid, Hadith, Fiqh, Arabic, Bangla, English, Mathematics</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-[11px] text-blue-300">
              Note: This action only sets up the academic configuration structure. It does NOT generate any fake students, mock attendance, or simulated fee transactions.
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApplyTemplate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                {isSubmitting ? 'Applying Template...' : 'Confirm & Apply Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Routine Slot Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Schedule Routine Slot</span>
              </h3>
              <button onClick={() => setShowRoutineModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTimetableSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Day of Week</label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="SUNDAY">Sunday</option>
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={slotSubject}
                    onChange={(e) => setSlotSubject(e.target.value)}
                    placeholder="e.g. Quran Mazid"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Teacher</label>
                <input
                  type="text"
                  value={slotTeacher}
                  onChange={(e) => setSlotTeacher(e.target.value)}
                  placeholder="e.g. Ustadh Saifullah"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
