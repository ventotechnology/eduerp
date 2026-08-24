import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { getServerSession } from '@/lib/auth/server-auth';
import { SessionUser, UserStatus } from '@/lib/auth/types';
import { requirePermission } from '@/lib/rbac/guard';
import { AppError } from '@/lib/errors/app-error';
import {
  createEmployee,
  updateEmployee,
  getEmployeeDirectory,
  getEmployeeProfile,
  createPosition,
  getPositions,
  addEmployeeDocument,
  addEmployeeQualification,
  addEmployeeExperience,
  upsertFacultyProfile,
} from '@/lib/services/employee-service';
import {
  createJobRequisition,
  approveJobRequisition,
  createJobVacancy,
  registerJobCandidate,
  recordCandidateInterview,
  issueJobOffer,
  convertCandidateToEmployee,
} from '@/lib/services/recruitment-service';
import {
  createHrShift,
  assignEmployeeRoster,
  ingestRawPunch,
  requestAttendanceCorrection,
  approveAttendanceCorrection,
  requestOvertime,
  approveOvertime,
} from '@/lib/services/attendance-hr-service';
import {
  createHrLeaveType,
  createHrLeavePolicy,
  initializeEmployeeLeaveBalance,
  applyEmployeeLeave,
  processLeaveAction,
} from '@/lib/services/leave-service';
import {
  promoteEmployee,
  transferEmployee,
  requestSalaryIncrement,
  createPerformanceCycle,
  createEmployeeGoal,
  submitPerformanceReview,
  createTrainingProgram,
  nominateEmployeeForTraining,
  recordEmployeeDisciplinaryCase,
  issueEmployeeWarning,
  submitEmployeeGrievance,
  requestEmployeeSeparation,
  updateExitClearance,
} from '@/lib/services/talent-lifecycle-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantId') || searchParams.get('tenant');
    const tab = searchParams.get('tab') || 'overview';
    const employeeId = searchParams.get('employeeId');

    if (!tenantSlug) {
      throw AppError.validation('Missing tenant parameter.');
    }

    const tenant = await requireTenant(tenantSlug);
    const session = await getServerSession(req);

    if (tab === 'overview') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalEmployees,
        teachingEmployees,
        nonTeachingEmployees,
        activeVacancies,
        todayPresent,
        todayLate,
        pendingLeaves,
      ] = await Promise.all([
        db.employee.count({ where: { campus: { institutionId: tenant.institutionId } } }),
        db.employee.count({ where: { campus: { institutionId: tenant.institutionId }, category: 'TEACHING' } }),
        db.employee.count({ where: { campus: { institutionId: tenant.institutionId }, category: { not: 'TEACHING' } } }),
        db.jobVacancy.count({ where: { institutionId: tenant.institutionId, status: 'PUBLISHED' } }),
        db.employeeDailyAttendance.count({ where: { institutionId: tenant.institutionId, attendanceDate: today, status: 'PRESENT' } }),
        db.employeeDailyAttendance.count({ where: { institutionId: tenant.institutionId, attendanceDate: today, status: 'LATE' } }),
        db.employeeLeaveApplication.count({ where: { employee: { campus: { institutionId: tenant.institutionId } }, status: 'PENDING' } }),
      ]);

      const recentEmployees = await db.employee.findMany({
        where: { campus: { institutionId: tenant.institutionId } },
        take: 5,
        orderBy: { joiningDate: 'desc' },
        include: { departmentRel: true, campus: true, position: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            totalEmployees,
            teachingEmployees,
            nonTeachingEmployees,
            activeVacancies,
            todayPresent,
            todayLate,
            pendingLeaves,
          },
          recentEmployees,
        },
      });
    }

    if (tab === 'directory') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const search = searchParams.get('search') || undefined;
      const campusId = searchParams.get('campusId') || undefined;
      const departmentId = searchParams.get('departmentId') || undefined;
      const category = searchParams.get('category') || undefined;
      const status = searchParams.get('status') || undefined;

      const directory = await getEmployeeDirectory(
        tenantSlug,
        { campusId, departmentId, category, status, search, page, limit },
        session || undefined
      );

      return NextResponse.json({ success: true, ...directory });
    }

    if (tab === 'profile' && employeeId) {
      const profile = await getEmployeeProfile(tenantSlug, employeeId, session || undefined);
      return NextResponse.json({ success: true, data: profile });
    }

    if (tab === 'positions') {
      const positions = await getPositions(tenantSlug);
      return NextResponse.json({ success: true, data: positions });
    }

    if (tab === 'recruitment') {
      const [requisitions, vacancies, candidates, offers] = await Promise.all([
        db.jobRequisition.findMany({
          where: { institutionId: tenant.institutionId },
          include: { position: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.jobVacancy.findMany({
          where: { institutionId: tenant.institutionId },
          include: { position: true, candidates: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.jobCandidate.findMany({
          where: { institutionId: tenant.institutionId },
          include: { vacancy: true, interviews: true, offers: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.jobOffer.findMany({
          where: { institutionId: tenant.institutionId },
          include: { candidate: true, position: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { requisitions, vacancies, candidates, offers },
      });
    }

    if (tab === 'attendance') {
      const [shifts, attendances, corrections, overtimes] = await Promise.all([
        db.hrShift.findMany({
          where: { institutionId: tenant.institutionId },
          orderBy: { shiftCode: 'asc' },
        }),
        db.employeeDailyAttendance.findMany({
          where: { institutionId: tenant.institutionId },
          include: { employee: true, shift: true },
          orderBy: { attendanceDate: 'desc' },
          take: 100,
        }),
        db.attendanceCorrectionRequest.findMany({
          where: { employee: { campus: { institutionId: tenant.institutionId } } },
          include: { employee: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.overtimeRequest.findMany({
          where: { employee: { campus: { institutionId: tenant.institutionId } } },
          include: { employee: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { shifts, attendances, corrections, overtimes },
      });
    }

    if (tab === 'leaves') {
      const [leaveTypes, leavePolicies, applications] = await Promise.all([
        db.hrLeaveType.findMany({
          where: { institutionId: tenant.institutionId },
          orderBy: { code: 'asc' },
        }),
        db.hrLeavePolicy.findMany({
          where: { institutionId: tenant.institutionId },
          include: { leaveType: true },
        }),
        db.employeeLeaveApplication.findMany({
          where: { employee: { campus: { institutionId: tenant.institutionId } } },
          include: { employee: true, leaveType: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { leaveTypes, leavePolicies, applications },
      });
    }

    if (tab === 'talent') {
      const [performanceCycles, trainingPrograms, disciplinaryCases, grievances] = await Promise.all([
        db.performanceCycle.findMany({
          where: { institutionId: tenant.institutionId },
          include: { goals: true, reviews: true },
          orderBy: { startDate: 'desc' },
        }),
        db.trainingProgram.findMany({
          where: { institutionId: tenant.institutionId },
          include: { enrollments: true },
          orderBy: { startDate: 'desc' },
        }),
        db.employeeDisciplinaryCase.findMany({
          where: { institutionId: tenant.institutionId },
          include: { employee: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.employeeGrievance.findMany({
          where: { institutionId: tenant.institutionId },
          include: { employee: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { performanceCycles, trainingPrograms, disciplinaryCases, grievances },
      });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error('API /api/hr GET Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal error' } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { action, tenantId, ...payload } = body;
    const resolvedTenant = tenantId || session?.tenantId;

    if (!resolvedTenant) throw AppError.validation('Tenant ID is required.');

    const actor: SessionUser = session || {
      id: 'GUEST_ACTOR',
      name: 'System / Guest HR User',
      email: 'hr@eduerp.us',
      role: 'HR_MANAGER',
      tenantId: resolvedTenant,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    switch (action) {
      case 'CREATE_EMPLOYEE': {
        if (session) requirePermission(session, 'CREATE', 'EMPLOYEES');
        const data = await createEmployee(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'UPDATE_EMPLOYEE': {
        if (session) requirePermission(session, 'UPDATE', 'EMPLOYEES');
        const data = await updateEmployee(resolvedTenant, payload.employeeId, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_POSITION': {
        if (session) requirePermission(session, 'CREATE', 'POSITION');
        const data = await createPosition(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ADD_DOCUMENT': {
        if (session) requirePermission(session, 'UPDATE', 'EMPLOYEES');
        const data = await addEmployeeDocument(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ADD_QUALIFICATION': {
        if (session) requirePermission(session, 'UPDATE', 'EMPLOYEES');
        const data = await addEmployeeQualification(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ADD_EXPERIENCE': {
        if (session) requirePermission(session, 'UPDATE', 'EMPLOYEES');
        const data = await addEmployeeExperience(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'UPSERT_FACULTY_PROFILE': {
        if (session) requirePermission(session, 'UPDATE', 'EMPLOYEES');
        const data = await upsertFacultyProfile(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_REQUISITION': {
        if (session) requirePermission(session, 'CREATE', 'RECRUITMENT');
        const data = await createJobRequisition(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'APPROVE_REQUISITION': {
        if (session) requirePermission(session, 'APPROVE', 'RECRUITMENT');
        const data = await approveJobRequisition(resolvedTenant, payload.requisitionId, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_VACANCY': {
        if (session) requirePermission(session, 'CREATE', 'RECRUITMENT');
        const data = await createJobVacancy(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'REGISTER_CANDIDATE': {
        const data = await registerJobCandidate(resolvedTenant, payload);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'RECORD_INTERVIEW': {
        if (session) requirePermission(session, 'CREATE', 'CANDIDATE');
        const data = await recordCandidateInterview(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ISSUE_OFFER': {
        if (session) requirePermission(session, 'CREATE', 'RECRUITMENT');
        const data = await issueJobOffer(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'HIRE_CANDIDATE': {
        if (session) requirePermission(session, 'APPROVE', 'RECRUITMENT');
        const data = await convertCandidateToEmployee(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_SHIFT': {
        if (session) requirePermission(session, 'CREATE', 'SHIFT');
        const data = await createHrShift(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ASSIGN_ROSTER': {
        if (session) requirePermission(session, 'CREATE', 'SHIFT');
        const data = await assignEmployeeRoster(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'INGEST_RAW_PUNCH': {
        const data = await ingestRawPunch(resolvedTenant, payload);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'REQUEST_ATTENDANCE_CORRECTION': {
        const data = await requestAttendanceCorrection(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'APPROVE_ATTENDANCE_CORRECTION': {
        if (session) requirePermission(session, 'APPROVE', 'ATTENDANCE_HR');
        const data = await approveAttendanceCorrection(
          resolvedTenant,
          payload.requestId,
          payload.statusAction,
          payload.comment,
          actor
        );
        return NextResponse.json({ success: true, data });
      }

      case 'REQUEST_OVERTIME': {
        const data = await requestOvertime(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'APPROVE_OVERTIME': {
        if (session) requirePermission(session, 'APPROVE', 'OVERTIME');
        const data = await approveOvertime(resolvedTenant, payload.requestId, payload.approvedHourlyRate, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_LEAVE_TYPE': {
        if (session) requirePermission(session, 'CREATE', 'LEAVES');
        const data = await createHrLeaveType(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'CREATE_LEAVE_POLICY': {
        if (session) requirePermission(session, 'CREATE', 'LEAVES');
        const data = await createHrLeavePolicy(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'INITIALIZE_LEAVE_BALANCE': {
        if (session) requirePermission(session, 'MANAGE', 'LEAVES');
        const data = await initializeEmployeeLeaveBalance(
          resolvedTenant,
          payload.employeeId,
          payload.leaveTypeId,
          payload.year,
          payload.quotaDays,
          actor
        );
        return NextResponse.json({ success: true, data });
      }

      case 'APPLY_LEAVE': {
        const data = await applyEmployeeLeave(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'PROCESS_LEAVE_ACTION': {
        if (session) requirePermission(session, 'APPROVE', 'LEAVES');
        const data = await processLeaveAction(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'PROMOTE_EMPLOYEE': {
        if (session) requirePermission(session, 'APPROVE', 'EMPLOYEES');
        const data = await promoteEmployee(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'TRANSFER_EMPLOYEE': {
        if (session) requirePermission(session, 'APPROVE', 'EMPLOYEES');
        const data = await transferEmployee(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'REQUEST_INCREMENT': {
        if (session) requirePermission(session, 'APPROVE', 'EMPLOYEES');
        const data = await requestSalaryIncrement(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_PERFORMANCE_CYCLE': {
        if (session) requirePermission(session, 'CREATE', 'PERFORMANCE');
        const data = await createPerformanceCycle(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'CREATE_GOAL': {
        const data = await createEmployeeGoal(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'SUBMIT_PERFORMANCE_REVIEW': {
        const data = await submitPerformanceReview(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      case 'CREATE_TRAINING_PROGRAM': {
        if (session) requirePermission(session, 'CREATE', 'TRAINING');
        const data = await createTrainingProgram(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'NOMINATE_TRAINING': {
        if (session) requirePermission(session, 'UPDATE', 'TRAINING');
        const data = await nominateEmployeeForTraining(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'RECORD_DISCIPLINARY_CASE': {
        if (session) requirePermission(session, 'CREATE', 'DISCIPLINE');
        const data = await recordEmployeeDisciplinaryCase(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'ISSUE_WARNING': {
        if (session) requirePermission(session, 'CREATE', 'DISCIPLINE');
        const data = await issueEmployeeWarning(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'SUBMIT_GRIEVANCE': {
        const data = await submitEmployeeGrievance(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'REQUEST_SEPARATION': {
        const data = await requestEmployeeSeparation(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      case 'UPDATE_EXIT_CLEARANCE': {
        if (session) requirePermission(session, 'APPROVE', 'SEPARATION');
        const data = await updateExitClearance(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      default:
        throw AppError.validation(`Unsupported HR action: '${action}'`);
    }
  } catch (error: any) {
    console.error('API /api/hr POST Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal error' } },
      { status: error.statusCode || 500 }
    );
  }
}
