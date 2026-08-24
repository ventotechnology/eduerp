import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  HrShiftCreateSchema,
  EmployeeRosterAssignSchema,
  RawPunchIngestSchema,
  AttendanceCorrectionRequestSchema,
  OvertimeRequestSchema,
} from '@/lib/validations/schemas';

export async function createHrShift(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HrShiftCreateSchema.parse(rawData);

  const existing = await db.hrShift.findFirst({
    where: { institutionId: tenant.institutionId, shiftCode: validated.shiftCode },
  });
  if (existing) throw AppError.conflict(`Shift code '${validated.shiftCode}' already exists.`);

  return db.hrShift.create({
    data: {
      institutionId: tenant.institutionId,
      shiftCode: validated.shiftCode,
      name: validated.name,
      startTime: validated.startTime,
      endTime: validated.endTime,
      graceMinutes: validated.graceMinutes,
      breakMinutes: validated.breakMinutes,
      workingHours: validated.workingHours,
      isNightShift: validated.isNightShift,
      isActive: validated.isActive,
    },
  });
}

export async function assignEmployeeRoster(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeRosterAssignSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const shift = await db.hrShift.findFirst({
    where: { id: validated.shiftId, institutionId: tenant.institutionId },
  });
  if (!shift) throw AppError.notFound('Shift not found.');

  const rosterDate = new Date(validated.rosterDate);
  rosterDate.setHours(0, 0, 0, 0);

  return db.employeeRoster.upsert({
    where: {
      employeeId_rosterDate: {
        employeeId: validated.employeeId,
        rosterDate,
      },
    },
    update: { shiftId: validated.shiftId },
    create: {
      employeeId: validated.employeeId,
      shiftId: validated.shiftId,
      rosterDate,
    },
  });
}

export async function ingestRawPunch(tenantIdentifier: string, rawData: unknown) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RawPunchIngestSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const punchTime = new Date(validated.punchTime);

  // Duplicate punch prevention: If a punch of same type exists within 2 minutes, ignore duplicate
  const twoMinsBefore = new Date(punchTime.getTime() - 2 * 60 * 1000);
  const twoMinsAfter = new Date(punchTime.getTime() + 2 * 60 * 1000);

  const duplicate = await db.employeeRawPunch.findFirst({
    where: {
      employeeId: validated.employeeId,
      punchType: validated.punchType,
      punchTime: { gte: twoMinsBefore, lte: twoMinsAfter },
    },
  });

  if (duplicate) {
    return duplicate; // Idempotent return of existing raw punch
  }

  // Record raw immutable punch
  const punch = await db.employeeRawPunch.create({
    data: {
      institutionId: tenant.institutionId,
      employeeId: validated.employeeId,
      punchTime,
      punchType: validated.punchType,
      deviceSource: validated.deviceSource,
      deviceId: validated.deviceId,
      ipAddress: validated.ipAddress,
    },
  });

  // Automatically recalculate or update Daily Attendance record
  await recalculateDailyAttendance(tenant.institutionId, validated.employeeId, punchTime);

  return punch;
}

export async function recalculateDailyAttendance(
  institutionId: string,
  employeeId: string,
  targetDate: Date
) {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Fetch all punches for the day
  const punches = await db.employeeRawPunch.findMany({
    where: {
      employeeId,
      punchTime: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { punchTime: 'asc' },
  });

  if (punches.length === 0) return null;

  const firstEntry = punches.find((p) => p.punchType === 'ENTRY') || punches[0];
  const lastExit = [...punches].reverse().find((p) => p.punchType === 'EXIT') || punches[punches.length - 1];

  const checkInTime = firstEntry.punchTime;
  const checkOutTime = punches.length > 1 ? lastExit.punchTime : null;

  // Check shift roster for this date
  const roster = await db.employeeRoster.findFirst({
    where: { employeeId, rosterDate: dayStart },
    include: { shift: true },
  });

  let shiftId: string | null = null;
  let status = 'PRESENT';
  let lateMinutes = 0;
  let earlyDepartureMinutes = 0;
  let actualWorkingHours = 0;
  let overtimeHours = 0;

  if (checkOutTime && checkInTime) {
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    actualWorkingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  }

  if (roster && roster.shift) {
    shiftId = roster.shift.id;
    const shift = roster.shift;

    const [shStartHour, shStartMin] = shift.startTime.split(':').map(Number);
    const [shEndHour, shEndMin] = shift.endTime.split(':').map(Number);

    const scheduledStart = new Date(dayStart);
    scheduledStart.setHours(shStartHour, shStartMin, 0, 0);

    const scheduledEnd = new Date(dayStart);
    scheduledEnd.setHours(shEndHour, shEndMin, 0, 0);

    // Calculate Late
    const graceEnd = new Date(scheduledStart.getTime() + shift.graceMinutes * 60 * 1000);
    if (checkInTime > graceEnd) {
      status = 'LATE';
      lateMinutes = Math.max(0, Math.floor((checkInTime.getTime() - scheduledStart.getTime()) / (1000 * 60)));
    }

    // Calculate Early Departure
    if (checkOutTime && checkOutTime < scheduledEnd) {
      earlyDepartureMinutes = Math.max(0, Math.floor((scheduledEnd.getTime() - checkOutTime.getTime()) / (1000 * 60)));
    }

    // Calculate Overtime
    if (actualWorkingHours > shift.workingHours) {
      overtimeHours = Math.round((actualWorkingHours - shift.workingHours) * 10) / 10;
    }
  }

  return db.employeeDailyAttendance.upsert({
    where: {
      employeeId_attendanceDate: {
        employeeId,
        attendanceDate: dayStart,
      },
    },
    update: {
      shiftId,
      checkInTime,
      checkOutTime,
      status,
      lateMinutes,
      earlyDepartureMinutes,
      actualWorkingHours,
      overtimeHours,
      source: firstEntry.deviceSource,
    },
    create: {
      institutionId,
      employeeId,
      attendanceDate: dayStart,
      shiftId,
      checkInTime,
      checkOutTime,
      status,
      lateMinutes,
      earlyDepartureMinutes,
      actualWorkingHours,
      overtimeHours,
      source: firstEntry.deviceSource,
    },
  });
}

// ----------------------------------------------------
// Attendance Correction Request
// ----------------------------------------------------
export async function requestAttendanceCorrection(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AttendanceCorrectionRequestSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const attDate = new Date(validated.attendanceDate);
  attDate.setHours(0, 0, 0, 0);

  const existingDaily = await db.employeeDailyAttendance.findFirst({
    where: { employeeId: validated.employeeId, attendanceDate: attDate },
  });

  return db.attendanceCorrectionRequest.create({
    data: {
      employeeId: validated.employeeId,
      attendanceDate: attDate,
      originalStatus: existingDaily?.status || 'ABSENT',
      requestedStatus: validated.requestedStatus,
      requestedCheckIn: validated.requestedCheckIn ? new Date(validated.requestedCheckIn) : null,
      requestedCheckOut: validated.requestedCheckOut ? new Date(validated.requestedCheckOut) : null,
      reason: validated.reason,
      status: 'REQUESTED',
    },
  });
}

export async function approveAttendanceCorrection(
  tenantIdentifier: string,
  requestId: string,
  action: 'APPROVE' | 'REJECT',
  comment: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const req = await db.attendanceCorrectionRequest.findUnique({
    where: { id: requestId },
    include: { employee: { include: { campus: true } } },
  });
  if (!req || req.employee.campus.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Correction request not found.');
  }

  if (action === 'REJECT') {
    return db.attendanceCorrectionRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedBy: actor.name, reviewComment: comment },
    });
  }

  // If approved, update daily attendance and record audit
  return db.$transaction(async (tx) => {
    await tx.employeeDailyAttendance.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId: req.employeeId,
          attendanceDate: req.attendanceDate,
        },
      },
      update: {
        status: req.requestedStatus,
        checkInTime: req.requestedCheckIn || undefined,
        checkOutTime: req.requestedCheckOut || undefined,
        remarks: `Manual correction approved: ${req.reason}`,
      },
      create: {
        institutionId: tenant.institutionId,
        employeeId: req.employeeId,
        attendanceDate: req.attendanceDate,
        status: req.requestedStatus,
        checkInTime: req.requestedCheckIn,
        checkOutTime: req.requestedCheckOut,
        source: 'MANUAL',
        remarks: `Manual correction approved: ${req.reason}`,
      },
    });

    const updated = await tx.attendanceCorrectionRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', reviewedBy: actor.name, reviewComment: comment },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'ATTENDANCE_HR',
      action: 'UPDATE',
      resourceId: req.employeeId,
      newState: {
        action: 'ATTENDANCE_CORRECTION_APPROVED',
        attendanceDate: req.attendanceDate,
        newStatus: req.requestedStatus,
      },
    });

    return updated;
  });
}

// ----------------------------------------------------
// Overtime
// ----------------------------------------------------
export async function requestOvertime(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = OvertimeRequestSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.overtimeRequest.create({
    data: {
      employeeId: validated.employeeId,
      overtimeDate: new Date(validated.overtimeDate),
      hours: validated.hours,
      reason: validated.reason,
      status: 'REQUESTED',
    },
  });
}

export async function approveOvertime(
  tenantIdentifier: string,
  requestId: string,
  approvedHourlyRate: number,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const req = await db.overtimeRequest.findUnique({
    where: { id: requestId },
    include: { employee: { include: { campus: true } } },
  });
  if (!req || req.employee.campus.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Overtime request not found.');
  }

  return db.overtimeRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      approvedBy: actor.name,
      approvedHourlyRate,
    },
  });
}
