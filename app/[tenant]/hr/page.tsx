'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  Briefcase,
  Users,
  CalendarCheck,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  UserX,
  Clock,
  Award,
  BookOpen,
  FileText,
  Shield,
  Building2,
  TrendingUp,
  RefreshCw,
  Eye,
  Check,
  FileCheck,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

export default function HrWorkforcePage() {
  const { branding, tenantSlug } = useTenant();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'directory'
    | 'recruitment'
    | 'attendance'
    | 'leaves'
    | 'talent'
    | 'relations'
    | 'separation'
  >('overview');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Data State
  const [overviewData, setOverviewData] = useState<any>(null);
  const [directoryData, setDirectoryData] = useState<any[]>([]);
  const [recruitmentData, setRecruitmentData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [leavesData, setLeavesData] = useState<any>(null);
  const [talentData, setTalentData] = useState<any>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Action State
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showPunchModal, setShowPunchModal] = useState(false);

  // Form State: Add Employee
  const [empForm, setEmpForm] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    designation: '',
    category: 'TEACHING',
    status: 'ACTIVE',
    academicRank: 'Lecturer',
    employmentType: 'PERMANENT',
    basicSalary: 40000,
    phone: '',
    email: '',
    joiningDate: new Date().toISOString().slice(0, 10),
  });

  // Form State: Apply Leave
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    totalDays: 1,
    reason: '',
  });

  // Form State: Raw Punch Ingestion
  const [punchForm, setPunchForm] = useState({
    employeeId: '',
    punchType: 'ENTRY',
    deviceSource: 'BIOMETRIC',
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = tenantSlug || 'dhaka-national-school';
      const [ovRes, dirRes, recRes, attRes, lvRes, talRes] = await Promise.all([
        fetch(`/api/hr?tenantId=${slug}&tab=overview`),
        fetch(`/api/hr?tenantId=${slug}&tab=directory&search=${searchTerm}&category=${categoryFilter}&status=${statusFilter}`),
        fetch(`/api/hr?tenantId=${slug}&tab=recruitment`),
        fetch(`/api/hr?tenantId=${slug}&tab=attendance`),
        fetch(`/api/hr?tenantId=${slug}&tab=leaves`),
        fetch(`/api/hr?tenantId=${slug}&tab=talent`),
      ]);

      const [ovJson, dirJson, recJson, attJson, lvJson, talJson] = await Promise.all([
        ovRes.json(),
        dirRes.json(),
        recRes.json(),
        attRes.json(),
        lvRes.json(),
        talRes.json(),
      ]);

      if (ovJson.success) setOverviewData(ovJson.data);
      if (dirJson.success) setDirectoryData(dirJson.data);
      if (recJson.success) setRecruitmentData(recJson.data);
      if (attJson.success) setAttendanceData(attJson.data);
      if (lvJson.success) setLeavesData(lvJson.data);
      if (talJson.success) setTalentData(talJson.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load HR and workforce data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantSlug, searchTerm, categoryFilter, statusFilter]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = tenantSlug || 'dhaka-national-school';
      const campusId = overviewData?.recentEmployees?.[0]?.campusId || 'main-campus';

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_EMPLOYEE',
          tenantId: slug,
          campusId,
          ...empForm,
          basicSalary: Number(empForm.basicSalary),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to create employee');

      setSuccessMsg(`Employee ${empForm.firstName} ${empForm.lastName} (${empForm.employeeCode}) created successfully!`);
      setShowAddEmployeeModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = tenantSlug || 'dhaka-national-school';
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY_LEAVE',
          tenantId: slug,
          ...leaveForm,
          totalDays: Number(leaveForm.totalDays),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to apply leave');

      setSuccessMsg('Leave application submitted successfully for review.');
      setShowAddLeaveModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeave = async (leaveApplicationId: string, action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = tenantSlug || 'dhaka-national-school';
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_LEAVE_ACTION',
          tenantId: slug,
          leaveApplicationId,
          statusAction: action,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Action failed');

      setSuccessMsg(`Leave application ${action.toLowerCase()}d successfully.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = tenantSlug || 'dhaka-national-school';
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INGEST_RAW_PUNCH',
          tenantId: slug,
          employeeId: punchForm.employeeId,
          punchTime: new Date().toISOString(),
          punchType: punchForm.punchType,
          deviceSource: punchForm.deviceSource,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Punch ingestion failed');

      setSuccessMsg(`Biometric punch (${punchForm.punchType}) recorded and attendance updated.`);
      setShowPunchModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              HR, Workforce Lifecycle, Biometric Time & Leave Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Full Lifecycle Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recruitment • Position Headcounts • Biometric Punch Ingestion • Leave Ledgers • Performance Cycles • Exit Clearances
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'directory', label: 'Directory & Positions' },
            { key: 'recruitment', label: 'Recruitment' },
            { key: 'attendance', label: 'Time & Attendance' },
            { key: 'leaves', label: 'Leave Engine' },
            { key: 'talent', label: 'Performance & Training' },
            { key: 'relations', label: 'Discipline & Grievance' },
            { key: 'separation', label: 'Separation' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Workforce</span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {overviewData?.metrics?.totalEmployees || 0}
              </p>
              <span className="text-[10px] text-blue-600 font-medium mt-1 inline-block">
                {overviewData?.metrics?.teachingEmployees || 0} Faculty / Teachers • {overviewData?.metrics?.nonTeachingEmployees || 0} Staff
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Present Today</span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {overviewData?.metrics?.todayPresent || 0}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
                Biometric & Web Check-ins
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Leave Requests</span>
                <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                  <CalendarCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {overviewData?.metrics?.pendingLeaves || 0}
              </p>
              <span className="text-[10px] text-amber-600 font-medium mt-1 inline-block">
                Awaiting Supervisor Review
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Open Job Vacancies</span>
                <span className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                  <Briefcase className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {overviewData?.metrics?.activeVacancies || 0}
              </p>
              <span className="text-[10px] text-purple-600 font-medium mt-1 inline-block">
                Published Requisitions
              </span>
            </div>
          </div>

          {/* Quick Actions & Recent Employees */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> HR Quick Actions
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="w-full p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Onboard New Employee</span>
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAddLeaveModal(true)}
                  className="w-full p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-semibold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Apply for Leave</span>
                  <CalendarCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPunchModal(true)}
                  className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl text-left flex items-center justify-between"
                >
                  <span>Record Biometric Punch</span>
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Recently Onboarded Employees
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {overviewData?.recentEmployees?.map((emp: any) => (
                  <div key={emp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-blue-600 font-bold mr-2">[{emp.employeeCode}]</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {emp.designation} • {emp.departmentRel?.name || emp.department || 'General'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {emp.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECTORY & POSITIONS TAB */}
      {activeTab === 'directory' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Staff & Faculty Directory</h2>
              <p className="text-xs text-slate-500">Persistent employee database with position assignments & privacy controls</p>
            </div>
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Onboard Employee
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, name, designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="">All Categories</option>
              <option value="TEACHING">Teaching / Faculty</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="MANAGEMENT">Management</option>
              <option value="SUPPORT">Support Staff</option>
              <option value="DRIVER">Driver</option>
              <option value="SECURITY">Security</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="NOTICE_PERIOD">Notice Period</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Employee Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation / Rank</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Employment Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {directoryData.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600">{emp.employeeCode}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {emp.designation} {emp.academicRank && `(${emp.academicRank})`}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {emp.departmentRel?.name || emp.department || 'General'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {emp.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{emp.employmentType}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'ACTIVE' || emp.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded font-semibold text-[11px]"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECRUITMENT TAB */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Job Vacancies & Candidates Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruitmentData?.vacancies?.map((vac: any) => (
                <div key={vac.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/40 dark:bg-slate-800/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-blue-600 font-bold">{vac.vacancyCode}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded font-bold text-[10px]">
                      {vac.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{vac.title}</h4>
                  <p className="text-xs text-slate-500">Position: {vac.position?.title}</p>
                  <p className="text-xs text-slate-500">Type: {vac.employmentType}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[11px]">
                    <span className="text-slate-400">Candidates: {vac.candidates?.length || 0}</span>
                    <span className="text-blue-600 font-semibold">Closing: {new Date(vac.closingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TIME & ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Attendance & Punch Records</h2>
                <p className="text-xs text-slate-500">Shift schedules, biometric punch logs, late calculation & early departures</p>
              </div>
              <button
                onClick={() => setShowPunchModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Record Device Punch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Working Hours</th>
                    <th className="p-3">Late (Mins)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {attendanceData?.attendances?.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {new Date(att.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {att.employee?.firstName} {att.employee?.lastName} ({att.employee?.employeeCode})
                      </td>
                      <td className="p-3 font-mono text-emerald-600">
                        {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-3 font-mono text-blue-600">
                        {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-3 font-mono font-bold">{att.actualWorkingHours} hrs</td>
                      <td className="p-3 font-mono text-rose-600">{att.lateMinutes > 0 ? `${att.lateMinutes}m` : '0m'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{att.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEAVES TAB */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Employee Leave Requests & Balances</h2>
                <p className="text-xs text-slate-500">Real leave balances, date overlap validation & multi-tier supervisor approvals</p>
              </div>
              <button
                onClick={() => setShowAddLeaveModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Apply Leave
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Date Range</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {leavesData?.applications?.map((lv: any) => (
                    <tr key={lv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {lv.employee?.firstName} {lv.employee?.lastName} ({lv.employee?.employeeCode})
                      </td>
                      <td className="p-3 font-bold text-purple-600">{lv.leaveType?.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {new Date(lv.startDate).toLocaleDateString()} to {new Date(lv.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono font-bold">{lv.totalDays}</td>
                      <td className="p-3 text-slate-500 truncate max-w-xs">{lv.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lv.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : lv.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {lv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {lv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleProcessLeave(lv.id, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessLeave(lv.id, 'REJECT')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TALENT & PERFORMANCE TAB */}
      {activeTab === 'talent' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Appraisal Cycles & Training Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-500 uppercase">Active Performance Cycles</h3>
              {talentData?.performanceCycles?.map((cy: any) => (
                <div key={cy.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cy.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Timeline: {new Date(cy.startDate).toLocaleDateString()} - {new Date(cy.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-2">Active Reviews: {cy.reviews?.length || 0}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-500 uppercase">Institutional Training Programs</h3>
              {talentData?.trainingPrograms?.map((tp: any) => (
                <div key={tp.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{tp.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Provider: {tp.provider} • Type: {tp.trainingType}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-2">Enrollments: {tp.enrollments?.length || 0} / {tp.capacity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISCIPLINE & GRIEVANCE TAB */}
      {activeTab === 'relations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Confidential Employee Relations & Grievances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-500 uppercase">Disciplinary Case Log</h3>
              {talentData?.disciplinaryCases?.map((dc: any) => (
                <div key={dc.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-rose-50/30 dark:bg-rose-950/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-rose-600 font-bold">{dc.caseNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">{dc.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    Employee: {dc.employee?.firstName} {dc.employee?.lastName}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{dc.allegation}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-500 uppercase">Confidential Grievances</h3>
              {talentData?.grievances?.map((gr: any) => (
                <div key={gr.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-purple-600 font-bold">{gr.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">{gr.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{gr.subject}</h4>
                  <p className="text-xs text-slate-500 mt-1">{gr.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEPARATION TAB */}
      {activeTab === 'separation' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Separation & Departmental Exit Clearances</h2>
          <p className="text-xs text-slate-500">
            Resignations, contract completions, and multi-department sign-offs (Department, Library, Finance, IT equipment, Hostel)
          </p>
          <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
            All separation records preserve historical employee IDs, contracts, and attendance ledgers permanently.
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Onboard New Employee
              </h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1042"
                    value={empForm.employeeCode}
                    onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={empForm.category}
                    onChange={(e) => setEmpForm({ ...empForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="TEACHING">Teaching / Faculty</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="SUPPORT">Support</option>
                    <option value="DRIVER">Driver</option>
                    <option value="SECURITY">Security</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={empForm.firstName}
                    onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={empForm.lastName}
                    onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Professor"
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Basic Salary (BDT)</label>
                  <input
                    type="number"
                    required
                    value={empForm.basicSalary}
                    onChange={(e) => setEmpForm({ ...empForm, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="employee@school.edu.bd"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {loading ? 'Creating...' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" /> Apply Employee Leave
              </h3>
              <button onClick={() => setShowAddLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Employee</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">Select Employee...</option>
                  {directoryData.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Leave Type</label>
                <select
                  required
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">Select Leave Type...</option>
                  {leavesData?.leaveTypes?.map((lt: any) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Total Days</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reason</label>
                <textarea
                  required
                  rows={2}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD BIOMETRIC PUNCH MODAL */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> Record Biometric Device Punch
              </h3>
              <button onClick={() => setShowPunchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulatePunch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Employee</label>
                <select
                  required
                  value={punchForm.employeeId}
                  onChange={(e) => setPunchForm({ ...punchForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">Select Employee...</option>
                  {directoryData.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Punch Type</label>
                  <select
                    value={punchForm.punchType}
                    onChange={(e) => setPunchForm({ ...punchForm, punchType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="ENTRY">ENTRY (Check-In)</option>
                    <option value="EXIT">EXIT (Check-Out)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Device Source</label>
                  <select
                    value={punchForm.deviceSource}
                    onChange={(e) => setPunchForm({ ...punchForm, deviceSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="BIOMETRIC">ZKTeco Biometric</option>
                    <option value="RFID">RFID Card Terminal</option>
                    <option value="WEB">Web Self-Service</option>
                    <option value="MOBILE">Mobile Geofence</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {loading ? 'Ingesting...' : 'Record Punch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
