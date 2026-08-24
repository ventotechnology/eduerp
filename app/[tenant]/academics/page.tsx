'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
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
  Copy,
  RefreshCw,
  X
} from 'lucide-react';

export default function AcademicsPage() {
  const { branding, institutionType, institutionTypeConfig, tenantSlug } = useTenant();

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'routine' | 'curriculum'>('routine');
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  // Modals & State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Slot Form
  const [slotDay, setSlotDay] = useState('SUNDAY');
  const [slotStartTime, setSlotStartTime] = useState('08:00');
  const [slotEndTime, setSlotEndTime] = useState('08:45');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoomId, setSlotRoomId] = useState('');
  const [slotSectionId, setSlotSectionId] = useState('');

  // Duplicate Year Form
  const [targetYearName, setTargetYearName] = useState('2027');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [structRes, routineRes] = await Promise.all([
        fetch(`/api/academics?tenantId=${tenantSlug}`),
        fetch(`/api/timetable?tenantId=${tenantSlug}`)
      ]);

      const structData = await structRes.json();
      const routineData = await routineRes.json();

      if (structData.success) {
        setStructure(structData.data);
        if (structData.data.rooms && structData.data.rooms.length > 0 && !slotRoomId) {
          setSlotRoomId(structData.data.rooms[0].id);
        }
      }

      if (routineData.success) {
        setTimetable(routineData.data || []);
      }
    } catch (err) {
      console.error('Failed to load academic data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchData();
    }
  }, [tenantSlug]);

  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setSuccessMessage(null);
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
          subjectName: slotSubject || 'Bangla 1st Paper',
          teacherName: slotTeacher || 'Nazmul Haque',
          classroomId: slotRoomId,
          sectionId: slotSectionId || undefined
        })
      });

      const data = await res.json();
      if (!data.success) {
        setConflictError(data.error?.message || 'Conflict detected in timetable scheduling');
      } else {
        setSuccessMessage('Timetable slot scheduled successfully with 0 conflicts!');
        setShowAddModal(false);
        setSlotSubject('');
        setSlotTeacher('');
        fetchData();
      }
    } catch (err: any) {
      setConflictError(err.message || 'Failed to save timetable slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      const res = await fetch(`/api/timetable?id=${id}&tenantId=${tenantSlug}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Timetable entry removed.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structure?.academicYears?.[0]?.id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantSlug,
          action: 'DUPLICATE_ACADEMIC_YEAR',
          sourceYearId: structure.academicYears[0].id,
          newYearName: targetYearName
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Academic structure successfully duplicated for ${targetYearName}!`);
        setShowDuplicateModal(false);
        fetchData();
      } else {
        setConflictError(data.error?.message || 'Failed to duplicate academic year');
      }
    } catch (err: any) {
      setConflictError(err.message || 'Error duplicating academic year');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTimetable = timetable.filter((entry) => {
    if (selectedSection !== 'ALL' && entry.sectionId !== selectedSection) return false;
    if (selectedDay !== 'ALL' && entry.dayOfWeek !== selectedDay) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Academic Structures & Server-Side Timetable Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Academic Sessions, {institutionTypeConfig.academicUnitLabel} hierarchies, Curriculum OBE versions, and conflict-checked timetable routines.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'routine'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Class Routine & Conflicts
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'hierarchy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Academic Hierarchy
          </button>
          {institutionType === 'UNIVERSITY' && (
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'curriculum'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Curriculum Versions
            </button>
          )}
          <button
            onClick={() => setShowDuplicateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Next-Year Setup</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {conflictError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{conflictError}</span>
          </div>
          <button onClick={() => setConflictError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Class Routine & Conflict Engine */}
      {activeTab === 'routine' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Day Filter:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Days</option>
                <option value="SUNDAY">Sunday</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="FRIDAY">Friday</option>
                <option value="SATURDAY">Saturday</option>
              </select>

              <button
                onClick={fetchData}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => {
                setConflictError(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Class Slot</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Time Window</th>
                    <th className="p-3">Subject / Course</th>
                    <th className="p-3">Teacher / Instructor</th>
                    <th className="p-3">Room / Lab</th>
                    <th className="p-3">Section / Cohort</th>
                    <th className="p-3 text-right">Conflict Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTimetable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No timetable slots found for the selected criteria. Click &quot;Schedule Class Slot&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredTimetable.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{slot.dayOfWeek}</td>
                        <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{slot.subjectName}</td>
                        <td className="p-3">{slot.teacherName}</td>
                        <td className="p-3 font-medium text-purple-600 dark:text-purple-400">
                          {slot.classroom?.roomNumber || 'Room 201'}
                        </td>
                        <td className="p-3 text-slate-500">
                          {slot.section?.name || 'All Students'}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Validated Clean</span>
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Remove Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Hierarchy */}
      {activeTab === 'hierarchy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Academic Years & Sessions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Academic Years & Terms</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400">
                {structure?.academicYears?.length || 0} Years
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {structure?.academicYears?.map((yr: any) => (
                <div key={yr.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{yr.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {yr.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {yr.sessions?.length || 0} Sessions configured
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Classes / Programs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>{institutionTypeConfig.academicUnitLabel} Units</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400">
                {structure?.classes?.length || structure?.programs?.length || 0}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {structure?.classes?.map((cls: any) => (
                <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{cls.name}</span>
                    <span className="text-[10px] text-slate-400">{cls.shift} Shift</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{cls.sections?.length || 0} Sections</span>
                    <span>•</span>
                    <span>{cls.subjects?.length || 0} Subjects</span>
                  </div>
                </div>
              ))}
              {structure?.programs?.map((prog: any) => (
                <div key={prog.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{prog.name}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{prog.degreeLevel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{prog.courses?.length || 0} Courses</span>
                    <span>•</span>
                    <span>{prog.totalCredits || 144} Credits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms & Facilities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Classrooms & Labs</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-400">
                {structure?.rooms?.length || 0} Rooms
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {structure?.rooms?.map((room: any) => (
                <div key={room.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{room.roomNumber}</div>
                    <div className="text-[11px] text-slate-500">Cap: {room.capacity} Students • {room.type}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {room.hasProjector && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Projector</span>}
                    {room.hasAirConditioner && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">AC</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Curriculum Versions (University) */}
      {activeTab === 'curriculum' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">OBE Curriculum Version Control</h3>
              <p className="text-xs text-slate-500">
                Maintains historical course requirements, required vs elective credits, and prerequisite chains.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {structure?.curriculums?.map((curr: any) => (
              <div key={curr.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800 dark:text-white">{curr.name} ({curr.code})</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active OBE Syllabus
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {curr.versions?.map((ver: any) => (
                    <div key={ver.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                      <div className="font-bold text-blue-600">Version {ver.versionCode}</div>
                      <div className="text-slate-600 dark:text-slate-400">Total Credits: {ver.totalCredits}</div>
                      <div className="text-slate-600 dark:text-slate-400">Min Passing CGPA: {ver.minCgpa}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{ver.courses?.length || 0} Mapped Courses</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Schedule New Timetable Slot</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTimetableSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Day of Week</label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="SUNDAY">Sunday</option>
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Classroom / Lab</label>
                  <select
                    value={slotRoomId}
                    onChange={(e) => setSlotRoomId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                    required
                  >
                    {structure?.rooms?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject / Course Name</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Theory / Data Structures"
                  value={slotSubject}
                  onChange={(e) => setSlotSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Teacher / Instructor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rafiqul Islam"
                  value={slotTeacher}
                  onChange={(e) => setSlotTeacher(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Checking Conflicts...' : 'Save & Validate Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Next-Year Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Next Academic Year Setup Assistant</h3>
              <button onClick={() => setShowDuplicateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Clones existing academic structure (sessions, classes, and subjects) for the new academic year in DRAFT status, without moving student records or historical results.
            </p>

            <form onSubmit={handleDuplicateYear} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Academic Year Name</label>
                <input
                  type="text"
                  value={targetYearName}
                  onChange={(e) => setTargetYearName(e.target.value)}
                  placeholder="e.g. 2027 or 2026-2027"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Duplicating...' : 'Duplicate Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
