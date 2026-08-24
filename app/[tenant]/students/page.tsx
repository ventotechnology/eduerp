'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { getTenantCache, setTenantCache, invalidateTenantCache } from '@/lib/cache/tenant-cache';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  QrCode,
  Award,
  DollarSign,
  CalendarCheck,
  Eye,
  Edit,
  Printer,
  X,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  ShieldAlert,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Plus,
  BookOpen,
  Building2,
  GraduationCap
} from 'lucide-react';
import { PhotoUploader } from '@/components/media/photo-uploader';
import confetti from 'canvas-confetti';

export default function StudentsPage() {
  const { tenantSlug, branding, institutionTypeConfig } = useTenant();

  const [students, setStudents] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      const cached = getTenantCache<any[]>(tenantSlug, 'students', '__ALL__');
      return cached || [];
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      const cached = getTenantCache<any[]>(tenantSlug, 'students', '__ALL__');
      return !cached;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Academic Structure
  const [structure, setStructure] = useState<any | null>(() => {
    if (typeof window !== 'undefined' && tenantSlug) {
      return getTenantCache<any>(tenantSlug, 'structure', '') || null;
    }
    return null;
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Drawers
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showIdCard, setShowIdCard] = useState<any | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStructure = useCallback(async () => {
    if (!tenantSlug) return;
    const cachedStructure = getTenantCache<any>(tenantSlug, 'structure', '');
    if (cachedStructure) {
      setStructure(cachedStructure);
      return;
    }
    try {
      const res = await fetch(`/api/academics?tenantSlug=${tenantSlug}`);
      const json = await res.json();
      if (json.success) {
        setStructure(json.data);
        setTenantCache(tenantSlug, 'structure', '', json.data, { ttlMs: 300000 }); // 5 minutes cache
      }
    } catch {
      // Ignored
    }
  }, [tenantSlug]);

  const fetchStudents = useCallback(async (isBackground = false) => {
    if (!tenantSlug) return;

    const cacheSubKey = `${selectedCampus}_${selectedClass}_${selectedStatus}_${debouncedSearch}`;
    const cachedData = getTenantCache<any[]>(tenantSlug, 'students', cacheSubKey);

    if (cachedData && !isBackground) {
      setStudents(cachedData);
      setLoading(false);
    } else if (!cachedData) {
      setLoading(true);
    }

    // Cancel previous in-flight search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('tenantSlug', tenantSlug);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedCampus) params.append('campusId', selectedCampus);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (res.status === 403) throw new Error('You do not have permission to view student records.');
        throw new Error(json.error?.message || 'Unable to load student records.');
      }

      const freshStudents = json.data?.students || [];
      setStudents(freshStudents);
      setTenantCache(tenantSlug, 'students', cacheSubKey, freshStudents, { ttlMs: 60000 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to fetch student records');
      if (!cachedData) setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, selectedCampus, selectedClass, selectedStatus, debouncedSearch]);

  useEffect(() => {
    if (tenantSlug) {
      fetchStructure();
      fetchStudents();
    }
  }, [tenantSlug, selectedCampus, selectedClass, selectedStatus, debouncedSearch, fetchStructure, fetchStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Student Information System (SIS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database-backed unified student lifecycle, academic enrollment, demographic profiles, guardians, and ID cards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
          <button
            onClick={() => fetchStudents()}
            className="p-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID number, roll, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            >
              <option value="" className="bg-white text-slate-900">All Campuses</option>
              {structure?.campuses?.map((c: any) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            >
              <option value="" className="bg-white text-slate-900">All Classes / Programs</option>
              {structure?.classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id} className="bg-white text-slate-900">{cls.name}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div className="flex-1">
            <span className="font-semibold block">SIS Loading Error</span>
            <span className="text-xs">{error}</span>
          </div>
          <button
            onClick={() => fetchStudents()}
            className="text-xs bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg font-medium text-rose-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading student directory records...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No student records yet</h3>
            <p className="text-xs text-slate-500">
              There are no enrolled students matching your search criteria. Add your first student directly or admit approved applicants.
            </p>
          </div>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4" />
            Add First Student
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Academic Placement</th>
                  <th className="py-3.5 px-4">Campus</th>
                  <th className="py-3.5 px-4">Roll</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => {
                  const activeEnrollment = student.enrollments?.[0];
                  const placement = activeEnrollment
                    ? `${activeEnrollment.class?.name || activeEnrollment.batch?.program?.name || 'Enrolled'}${
                        activeEnrollment.section?.name ? ` - ${activeEnrollment.section.name}` : ''
                      }${activeEnrollment.shift?.name ? ` (${activeEnrollment.shift.name})` : ''}`
                    : student.section?.class?.name
                    ? `${student.section.class.name} - ${student.section.name}`
                    : 'General Admission';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{student.studentIdNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.firstName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.firstName[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div>{student.firstName} {student.lastName}</div>
                            {student.phone && <span className="block text-[10px] font-normal text-slate-400 font-mono">{student.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {placement}
                        {activeEnrollment?.hifzEnrolled && (
                          <span className="inline-block ml-1.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">
                            Hifz
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{student.campus?.name || 'Main'}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {student.rollNumber || activeEnrollment?.rollNumber || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">
                          {student.guardian?.guardianName || student.guardian?.fatherName || '-'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {student.guardian?.guardianPhone || student.guardian?.fatherPhone || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : student.status === 'GRADUATED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowIdCard(student)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Student ID Card"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Direct Add Student Modal */}
      {showAddStudentModal && (
        <DirectAddStudentModal
          tenantSlug={tenantSlug}
          structure={structure}
          institutionType={institutionTypeConfig?.type || 'SCHOOL'}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            setShowAddStudentModal(false);
            invalidateTenantCache(tenantSlug, 'students');
            fetchStudents();
          }}
        />
      )}

      {/* MODAL 2: Student Profile Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                  {selectedStudent.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">{selectedStudent.firstName[0]}</span>
                  )}
                </div>
                <div>
                  <span className="font-mono font-bold text-indigo-600">{selectedStudent.studentIdNumber}</span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Photo Management */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <PhotoUploader
                label="Student Profile Photograph"
                initialUrl={selectedStudent.photoUrl}
                tenantSlug={tenantSlug}
                entityType="STUDENT"
                entityId={selectedStudent.id}
                category="PROFILE_PHOTO"
                onChange={async (newUrl) => {
                  if (!newUrl) {
                    await fetch(`/api/students/${selectedStudent.id}/photo?tenantSlug=${tenantSlug}`, { method: 'DELETE' });
                  }
                  setSelectedStudent((prev: any) => (prev ? { ...prev, photoUrl: newUrl } : null));
                  invalidateTenantCache(tenantSlug, 'students');
                  fetchStudents();
                }}
                hint="Official student portrait photograph. Used automatically on Student ID Cards and printable documents."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Academic Placement</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.enrollments?.[0]?.class?.name || selectedStudent.section?.class?.name || 'General'}
                  {selectedStudent.enrollments?.[0]?.section?.name ? ` (${selectedStudent.enrollments[0].section.name})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Campus</span>
                <span className="font-semibold text-slate-800">{selectedStudent.campus?.name || 'Main Campus'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Roll Number</span>
                <span className="font-mono font-semibold text-slate-800">{selectedStudent.rollNumber || selectedStudent.enrollments?.[0]?.rollNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <span className="font-semibold text-emerald-600">{selectedStudent.status}</span>
              </div>
            </div>

            {/* Guardian Demographics with Portraits */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Guardian & Parent Demographics</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Father */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                      {selectedStudent.guardian?.fatherPhotoUrl ? (
                        <img src={selectedStudent.guardian.fatherPhotoUrl} alt="Father" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">F</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Father</span>
                      <h5 className="font-bold text-slate-800 text-xs truncate">{selectedStudent.guardian?.fatherName || 'Not recorded'}</h5>
                      <span className="text-[10px] text-slate-500 block font-mono">{selectedStudent.guardian?.fatherPhone || ''}</span>
                    </div>
                  </div>
                  {selectedStudent.guardianId && (
                    <PhotoUploader
                      label="Father's Photo"
                      initialUrl={selectedStudent.guardian?.fatherPhotoUrl}
                      tenantSlug={tenantSlug}
                      entityType="GUARDIAN"
                      entityId={selectedStudent.guardianId}
                      category="FATHER_PHOTO"
                      aspectRatio="1/1"
                      allowCamera={false}
                      onChange={async (newUrl) => {
                        if (!newUrl) {
                          await fetch(`/api/guardians/${selectedStudent.guardianId}/photo?tenantSlug=${tenantSlug}&relationRole=FATHER`, { method: 'DELETE' });
                        }
                        setSelectedStudent((prev: any) =>
                          prev ? { ...prev, guardian: { ...prev.guardian, fatherPhotoUrl: newUrl } } : null
                        );
                        invalidateTenantCache(tenantSlug, 'students');
                        fetchStudents();
                      }}
                      hint="Optional father portrait"
                    />
                  )}
                </div>

                {/* Mother */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                      {selectedStudent.guardian?.motherPhotoUrl ? (
                        <img src={selectedStudent.guardian.motherPhotoUrl} alt="Mother" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">M</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded">Mother</span>
                      <h5 className="font-bold text-slate-800 text-xs truncate">{selectedStudent.guardian?.motherName || 'Not recorded'}</h5>
                      <span className="text-[10px] text-slate-500 block font-mono">{selectedStudent.guardian?.motherPhone || ''}</span>
                    </div>
                  </div>
                  {selectedStudent.guardianId && (
                    <PhotoUploader
                      label="Mother's Photo"
                      initialUrl={selectedStudent.guardian?.motherPhotoUrl}
                      tenantSlug={tenantSlug}
                      entityType="GUARDIAN"
                      entityId={selectedStudent.guardianId}
                      category="MOTHER_PHOTO"
                      aspectRatio="1/1"
                      allowCamera={false}
                      onChange={async (newUrl) => {
                        if (!newUrl) {
                          await fetch(`/api/guardians/${selectedStudent.guardianId}/photo?tenantSlug=${tenantSlug}&relationRole=MOTHER`, { method: 'DELETE' });
                        }
                        setSelectedStudent((prev: any) =>
                          prev ? { ...prev, guardian: { ...prev.guardian, motherPhotoUrl: newUrl } } : null
                        );
                        invalidateTenantCache(tenantSlug, 'students');
                        fetchStudents();
                      }}
                      hint="Optional mother portrait"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          tenantSlug={tenantSlug}
          student={editingStudent}
          structure={structure}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            invalidateTenantCache(tenantSlug, 'students');
            fetchStudents();
          }}
        />
      )}

      {/* MODAL 4: Student ID Card */}
      {showIdCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-6 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Official Student ID</span>
              <button onClick={() => setShowIdCard(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ID Card Front View */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden text-left print:shadow-none print:border print:border-slate-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold block">EduERP Smart SIS</span>
                  <h4 className="text-xs font-black tracking-tight">{branding?.name || 'Educational Institution'}</h4>
                </div>
                <GraduationCap className="w-6 h-6 text-indigo-300" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-16 h-20 bg-white/20 rounded-xl border border-white/30 overflow-hidden flex items-center justify-center font-bold relative shrink-0">
                  {showIdCard.photoUrl ? (
                    <img
                      src={showIdCard.photoUrl}
                      alt={`${showIdCard.firstName} ${showIdCard.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl text-white font-bold">{showIdCard.firstName[0]}</div>
                  )}
                </div>
                <div>
                  <h5 className="font-bold text-sm leading-snug">{showIdCard.firstName} {showIdCard.lastName}</h5>
                  <span className="text-[10px] font-mono text-indigo-200 block">{showIdCard.studentIdNumber}</span>
                  <span className="text-[10px] text-indigo-100 block">
                    {showIdCard.enrollments?.[0]?.class?.name || showIdCard.section?.class?.name || 'Regular Student'}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/15 pt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-indigo-300 block text-[8px] uppercase">Roll Number</span>
                  <span className="font-mono font-bold">{showIdCard.rollNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-indigo-300 block text-[8px] uppercase">Blood Group</span>
                  <span className="font-bold">{showIdCard.bloodGroup || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print ID Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Direct Student Onboarding Wizard Modal
 */
function DirectAddStudentModal({
  tenantSlug,
  structure,
  institutionType,
  onClose,
  onSuccess
}: {
  tenantSlug: string;
  structure: any;
  institutionType: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    photoUrl: '',
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
    classId: structure?.classes?.[0]?.id || '',
    sectionId: '',
    shiftId: structure?.shifts?.[0]?.id || '',
    rollNumber: '',
    hifzProgram: false,

    admissionFeeAmount: 0,
    createPortalAccount: true
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
        classId: form.classId || null,
        sectionId: form.sectionId || null,
        shiftId: form.shiftId || null,
        rollNumber: form.rollNumber.trim() || null,
        hifzProgram: form.hifzProgram,

        photoUrl: form.photoUrl || null,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup || null,
        religion: form.religion || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        presentAddress: form.presentAddress.trim(),
        permanentAddress: form.permanentAddress.trim() || form.presentAddress.trim(),

        guardian: {
          fatherName: form.fatherName.trim() || form.guardianName.trim() || 'Father',
          fatherPhone: form.fatherPhone.trim() || form.guardianPhone.trim() || '01700000000',
          fatherProfession: form.fatherProfession.trim() || null,
          motherName: form.motherName.trim() || 'Mother',
          motherPhone: form.motherPhone.trim() || null,
          guardianName: form.guardianName.trim() || form.fatherName.trim() || 'Guardian',
          guardianPhone: form.guardianPhone.trim() || form.fatherPhone.trim() || '01700000000',
          guardianRelation: form.guardianRelation
        },

        admissionFeeAmount: form.admissionFeeAmount ? parseFloat(form.admissionFeeAmount as any) : 0,
        createPortalAccount: form.createPortalAccount
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to onboard student.');

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Direct student creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Direct Student Onboarding Wizard</h3>
            <span className="text-xs text-slate-500">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider">1. Student Details</h4>

            {/* Photo Uploader */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <PhotoUploader
                label="Student Photograph"
                initialUrl={form.photoUrl}
                tenantSlug={tenantSlug}
                entityType="STUDENT"
                category="PROFILE_PHOTO"
                onChange={(url) => update('photoUrl', url || '')}
                hint="Passport-style portrait photograph. Optional during creation."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="e.g. Mahfuzur"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  placeholder="e.g. Rahman"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => update('dateOfBirth', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Male" className="bg-white text-slate-900">Male</option>
                  <option value="Female" className="bg-white text-slate-900">Female</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => update('bloodGroup', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="" className="bg-white text-slate-900">Select</option>
                  <option value="A+" className="bg-white text-slate-900">A+</option>
                  <option value="A-" className="bg-white text-slate-900">A-</option>
                  <option value="B+" className="bg-white text-slate-900">B+</option>
                  <option value="B-" className="bg-white text-slate-900">B-</option>
                  <option value="O+" className="bg-white text-slate-900">O+</option>
                  <option value="O-" className="bg-white text-slate-900">O-</option>
                  <option value="AB+" className="bg-white text-slate-900">AB+</option>
                  <option value="AB-" className="bg-white text-slate-900">AB-</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Present Address *</label>
              <textarea
                rows={2}
                required
                value={form.presentAddress}
                onChange={(e) => update('presentAddress', e.target.value)}
                placeholder="Village/House, Road, Thana, District"
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="student@example.com"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider">2. Guardian & Relationship</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Father Name *</label>
                <input
                  type="text"
                  required
                  value={form.fatherName}
                  onChange={(e) => update('fatherName', e.target.value)}
                  placeholder="Father's full name"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Father Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.fatherPhone}
                  onChange={(e) => update('fatherPhone', e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mother Name</label>
                <input
                  type="text"
                  value={form.motherName}
                  onChange={(e) => update('motherName', e.target.value)}
                  placeholder="Mother's full name"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mother Phone</label>
                <input
                  type="tel"
                  value={form.motherPhone}
                  onChange={(e) => update('motherPhone', e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Guardian Relation</label>
                <select
                  value={form.guardianRelation}
                  onChange={(e) => update('guardianRelation', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Father" className="bg-white text-slate-900">Father</option>
                  <option value="Mother" className="bg-white text-slate-900">Mother</option>
                  <option value="Legal Guardian" className="bg-white text-slate-900">Legal Guardian</option>
                  <option value="Other" className="bg-white text-slate-900">Other</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guardian Profession</label>
                <input
                  type="text"
                  value={form.fatherProfession}
                  onChange={(e) => update('fatherProfession', e.target.value)}
                  placeholder="e.g. Business / Service / Teacher"
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider">3. Academic Placement & Fees</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Campus *</label>
                <select
                  value={form.campusId}
                  onChange={(e) => update('campusId', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {structure?.campuses?.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900">
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Academic Year *</label>
                <select
                  value={form.academicYearId}
                  onChange={(e) => update('academicYearId', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {structure?.academicYears?.map((y: any) => (
                    <option key={y.id} value={y.id} className="bg-white text-slate-900">
                      {y.name} {y.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Class / Marhala *</label>
                <select
                  value={form.classId}
                  onChange={(e) => update('classId', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="" className="bg-white text-slate-900">Select Class</option>
                  {structure?.classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id} className="bg-white text-slate-900">
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Section</label>
                <select
                  value={form.sectionId}
                  onChange={(e) => update('sectionId', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="" className="bg-white text-slate-900">Auto / Unassigned</option>
                  {structure?.sections
                    ?.filter((s: any) => !form.classId || s.classId === form.classId)
                    ?.map((sec: any) => (
                      <option key={sec.id} value={sec.id} className="bg-white text-slate-900">
                        {sec.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shift</label>
                <select
                  value={form.shiftId}
                  onChange={(e) => update('shiftId', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="" className="bg-white text-slate-900">None</option>
                  {structure?.shifts?.map((sh: any) => (
                    <option key={sh.id} value={sh.id} className="bg-white text-slate-900">
                      {sh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Roll Number</label>
                <input
                  type="text"
                  placeholder="Leave blank for auto-generate"
                  value={form.rollNumber}
                  onChange={(e) => update('rollNumber', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Admission Fee (BDT)</label>
                <input
                  type="number"
                  value={form.admissionFeeAmount}
                  onChange={(e) => update('admissionFeeAmount', e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {institutionType === 'MADRASHA' && (
              <label className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hifzProgram}
                  onChange={(e) => update('hifzProgram', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold">Enroll in 30-Para Hifzul Quran Progress Engine</span>
              </label>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-100 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Enrollment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Edit Student Demographic & Contact Modal
 */
function EditStudentModal({
  tenantSlug,
  student,
  structure,
  onClose,
  onSuccess
}: {
  tenantSlug: string;
  student: any;
  structure: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    photoUrl: student.photoUrl || '',
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    rollNumber: student.rollNumber || '',
    phone: student.phone || '',
    email: student.email || '',
    presentAddress: student.presentAddress || '',
    status: student.status || 'ACTIVE'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          ...form
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to update student');
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
          <h3 className="text-base font-bold text-slate-900">Edit Student Profile</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <PhotoUploader
            label="Student Photograph"
            initialUrl={form.photoUrl}
            tenantSlug={tenantSlug}
            entityType="STUDENT"
            entityId={student.id}
            category="PROFILE_PHOTO"
            onChange={(url) => setForm((p) => ({ ...p, photoUrl: url || '' }))}
            hint="Update portrait photograph"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="First name"
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name"
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Roll Number</label>
              <input
                type="text"
                value={form.rollNumber}
                onChange={(e) => setForm((p) => ({ ...p, rollNumber: e.target.value }))}
                placeholder="Roll number"
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ACTIVE" className="bg-white text-slate-900">ACTIVE</option>
                <option value="SUSPENDED" className="bg-white text-slate-900">SUSPENDED</option>
                <option value="TRANSFERRED" className="bg-white text-slate-900">TRANSFERRED</option>
                <option value="GRADUATED" className="bg-white text-slate-900">GRADUATED</option>
                <option value="DROPPED_OUT" className="bg-white text-slate-900">DROPPED_OUT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="017XXXXXXXX"
              className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Present Address</label>
            <textarea
              rows={2}
              value={form.presentAddress}
              onChange={(e) => setForm((p) => ({ ...p, presentAddress: e.target.value }))}
              placeholder="Full present address"
              className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
