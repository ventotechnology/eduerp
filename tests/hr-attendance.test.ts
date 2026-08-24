import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createEmployee } from '@/lib/services/employee-service';
import {
  createHrShift,
  assignEmployeeRoster,
  ingestRawPunch,
  requestAttendanceCorrection,
  approveAttendanceCorrection,
  requestOvertime,
  approveOvertime,
} from '@/lib/services/attendance-hr-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: Time & Attendance, Biometric Ingestion & Shift Roster Engine', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let employeeId: string;
  let shiftId: string;
  let hrUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `att-inst-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Attendance Test Academy ${timestamp}`,
        shortName: `ATA${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Mirpur, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01755556666',
        email: `att-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp.toString().slice(-4)}`,
        address: 'Mirpur',
      },
    });
    campusId = campus.id;

    hrUser = {
      id: `USR-HR-${timestamp}`,
      name: 'Attendance Officer',
      email: `att-officer-${timestamp}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const emp = await createEmployee(
      tenantSlug,
      {
        campusId,
        employeeCode: `EMP-ATT-01`,
        firstName: 'Kamrul',
        lastName: 'Hasan',
        designation: 'Senior Teacher',
        category: 'TEACHING',
        status: 'ACTIVE',
        basicSalary: 35000,
        phone: '01712344321',
        email: 'kamrul@ata.edu.bd',
        joiningDate: '2023-01-01',
      },
      hrUser
    );
    employeeId = emp.id;
  });

  it('configures standard working shift and assigns employee roster', async () => {
    const shift = await createHrShift(
      tenantSlug,
      {
        shiftCode: 'SHIFT-MORNING',
        name: 'Standard Morning Shift',
        startTime: '08:00',
        endTime: '16:00',
        graceMinutes: 15,
        breakMinutes: 60,
        workingHours: 8.0,
      },
      hrUser
    );
    shiftId = shift.id;
    expect(shift.shiftCode).toBe('SHIFT-MORNING');

    const todayStr = '2026-08-24';
    const roster = await assignEmployeeRoster(
      tenantSlug,
      {
        employeeId,
        shiftId,
        rosterDate: todayStr,
      },
      hrUser
    );
    expect(roster.shiftId).toBe(shiftId);
  });

  it('ingests raw biometric punches, detects late entry, and calculates working hours', async () => {
    // 1. Employee punches in at 08:25 AM (Late by 25 mins, beyond 15m grace)
    const entryPunch = await ingestRawPunch(tenantSlug, {
      employeeId,
      punchTime: '2026-08-24T08:25:00.000Z',
      punchType: 'ENTRY',
      deviceSource: 'BIOMETRIC',
      deviceId: 'ZKTECO-GATE-01',
    });
    expect(entryPunch.punchType).toBe('ENTRY');

    // 2. Test duplicate punch within 2 minutes: should return existing punch idempotently
    const dupPunch = await ingestRawPunch(tenantSlug, {
      employeeId,
      punchTime: '2026-08-24T08:26:00.000Z',
      punchType: 'ENTRY',
      deviceSource: 'BIOMETRIC',
      deviceId: 'ZKTECO-GATE-01',
    });
    expect(dupPunch.id).toBe(entryPunch.id);

    // 3. Employee punches out at 17:00 PM (Working 08:25 to 17:00 ~ 8.6 hours)
    const exitPunch = await ingestRawPunch(tenantSlug, {
      employeeId,
      punchTime: '2026-08-24T17:00:00.000Z',
      punchType: 'EXIT',
      deviceSource: 'BIOMETRIC',
      deviceId: 'ZKTECO-GATE-01',
    });
    expect(exitPunch.punchType).toBe('EXIT');

    // 4. Verify calculated Daily Attendance record
    const attDate = new Date('2026-08-24');
    attDate.setHours(0, 0, 0, 0);

    const daily = await db.employeeDailyAttendance.findFirst({
      where: { employeeId, attendanceDate: attDate },
    });

    expect(daily).toBeDefined();
    expect(daily?.status).toBe('LATE');
    expect(daily?.lateMinutes).toBeGreaterThanOrEqual(20);
    expect(daily?.actualWorkingHours).toBeGreaterThanOrEqual(8.0);
  });

  it('processes attendance correction request and updates authoritative attendance status', async () => {
    const correction = await requestAttendanceCorrection(
      tenantSlug,
      {
        employeeId,
        attendanceDate: '2026-08-24',
        requestedStatus: 'PRESENT',
        requestedCheckIn: '2026-08-24T08:00:00.000Z',
        requestedCheckOut: '2026-08-24T17:00:00.000Z',
        reason: 'Biometric optical sensor delay during early morning entry rush',
      },
      hrUser
    );

    expect(correction.status).toBe('REQUESTED');

    const approved = await approveAttendanceCorrection(
      tenantSlug,
      correction.id,
      'APPROVE',
      'Verified by CCTV footage at Main Gate',
      hrUser
    );

    expect(approved.status).toBe('APPROVED');

    // Verify daily attendance was updated
    const attDate = new Date('2026-08-24');
    attDate.setHours(0, 0, 0, 0);
    const updatedDaily = await db.employeeDailyAttendance.findFirst({
      where: { employeeId, attendanceDate: attDate },
    });
    expect(updatedDaily?.status).toBe('PRESENT');
  });

  it('submits and approves employee overtime hours', async () => {
    const ot = await requestOvertime(
      tenantSlug,
      {
        employeeId,
        overtimeDate: '2026-08-24',
        hours: 3.5,
        reason: 'Supervision of evening examination hall preparation',
      },
      hrUser
    );

    expect(ot.hours).toBe(3.5);
    expect(ot.status).toBe('REQUESTED');

    const approvedOt = await approveOvertime(tenantSlug, ot.id, 250, hrUser);
    expect(approvedOt.status).toBe('APPROVED');
    expect(approvedOt.approvedHourlyRate).toBe(250);
  });
});
