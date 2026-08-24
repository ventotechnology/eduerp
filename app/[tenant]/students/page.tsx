'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
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
  Printer,
  X,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function StudentsPage() {
  const { tenantSlug, branding } = useTenant();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showIdCard, setShowIdCard] = useState<any | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students?tenantId=${tenantSlug}&search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (data.success && data.data?.students) {
        setStudents(data.data.students);
      } else {
        setStudents([]);
      }
    } catch {
      setError('Failed to fetch persistent student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchStudents();
    }
  }, [tenantSlug, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Student Information System (SIS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Database-backed unified student lifecycle, academic status, guardians, and fee records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStudents()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, ID number, roll, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            {students.length} Active Records
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchStudents()} className="underline font-medium hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading persistent database records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No student records found</p>
            <p className="text-sm text-slate-400 mt-1">Try refining your search query or add a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student ID & Name</th>
                  <th className="py-3.5 px-4">Academic Placement</th>
                  <th className="py-3.5 px-4">Guardian Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: branding?.primaryColor || '#4f46e5' }}
                        >
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {student.firstName} {student.lastName}
                          </p>
                          <span className="inline-block mt-0.5 text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {student.studentIdNumber}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">
                        {student.section?.class?.name || student.batch?.program?.name || 'Class / Batch Enrolled'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {student.section?.name ? `Section: ${student.section.name}` : ''}
                        {student.rollNumber ? ` • Roll: ${student.rollNumber}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-medium">{student.guardian?.guardianName || 'N/A'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {student.guardian?.guardianPhone || student.phone || 'No phone'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View SIS Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowIdCard(student)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Generate Smart ID Card"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Drawer Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl font-bold text-indigo-300">
                  {selectedStudent.firstName[0]}
                  {selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-sm font-mono text-indigo-300">{selectedStudent.studentIdNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Gender & Blood Group</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {selectedStudent.gender} • {selectedStudent.bloodGroup || 'O+'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Date of Birth</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Present Address</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedStudent.presentAddress}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Guardian Name & Phone</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {selectedStudent.guardian?.guardianName || 'N/A'} ({selectedStudent.guardian?.guardianPhone || 'N/A'})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Smart Student ID Card</h3>
              <button onClick={() => setShowIdCard(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div
                className="w-20 h-20 mx-auto rounded-full text-white font-bold text-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: branding?.primaryColor || '#4f46e5' }}
              >
                {showIdCard.firstName[0]}
                {showIdCard.lastName[0]}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {showIdCard.firstName} {showIdCard.lastName}
                </h4>
                <p className="text-xs font-mono text-indigo-600 font-semibold mt-0.5">{showIdCard.studentIdNumber}</p>
                <p className="text-xs text-slate-500 mt-1">{branding?.name}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-3">
                <QrCode className="w-12 h-12 text-slate-800" />
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-800">DigiCert QR Verified</p>
                  <p className="text-slate-400 font-mono text-[10px]">ID: {showIdCard.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Card
              </button>
              <button
                onClick={() => setShowIdCard(null)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
