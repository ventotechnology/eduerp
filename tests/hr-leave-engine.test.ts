import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createEmployee } from '@/lib/services/employee-service';
import {
  createHrLeaveType,
  createHrLeavePolicy,
  initializeEmployeeLeaveBalance,
  applyEmployeeLeave,
  processLeaveAction,
  getEmployeeLeaveSummary,
} from '@/lib/services/leave-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: Real Leave Balances, Ledger Transactions & Approval Engine', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let employeeId: string;
  let casualLeaveTypeId: string;
  let hrUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `leave-inst-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'POLYTECHNIC',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Leave Test Institute ${timestamp}`,
        shortName: `LTI${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'BTEB',
        address: 'Tejgaon, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Tejgaon',
        phone: '01766667777',
        email: `leave-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Technical Campus',
        code: `TC-${timestamp.toString().slice(-4)}`,
        address: 'Tejgaon',
      },
    });
    campusId = campus.id;

    hrUser = {
      id: `USR-HR-${timestamp}`,
      name: 'Leave Incharge',
      email: `leave-officer-${timestamp}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const emp = await createEmployee(
      tenantSlug,
      {
        campusId,
        employeeCode: `EMP-LV-01`,
        firstName: 'Nusrat',
        lastName: 'Jahan',
        designation: 'Senior Instructor',
        category: 'TEACHING',
        status: 'ACTIVE',
        basicSalary: 40000,
        phone: '01733332222',
        email: 'nusrat@lti.edu.bd',
        joiningDate: '2021-01-01',
      },
      hrUser
    );
    employeeId = emp.id;
  });

  it('configures leave type master, policy, and initializes employee balance ledger', async () => {
    const leaveType = await createHrLeaveType(
      tenantSlug,
      {
        code: 'CASUAL',
        name: 'Casual Leave',
        isPaid: true,
        annualQuotaDays: 14,
      },
      hrUser
    );
    casualLeaveTypeId = leaveType.id;
    expect(leaveType.annualQuotaDays).toBe(14);

    await createHrLeavePolicy(
      tenantSlug,
      {
        leaveTypeId: casualLeaveTypeId,
        employmentType: 'PERMANENT',
        category: 'TEACHING',
        annualEntitlement: 14,
        accrualFrequency: 'ANNUAL',
      },
      hrUser
    );

    const balance = await initializeEmployeeLeaveBalance(
      tenantSlug,
      employeeId,
      casualLeaveTypeId,
      2026,
      14,
      hrUser
    );
    expect(balance.closingBalance).toBe(14);
    expect(balance.earned).toBe(14);
  });

  it('applies for leave, checks balance, and deducts from ledger upon approval', async () => {
    // 1. Apply for 3 days Casual Leave
    const application = await applyEmployeeLeave(
      tenantSlug,
      {
        employeeId,
        leaveTypeId: casualLeaveTypeId,
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        totalDays: 3,
        reason: 'Family pilgrimage and personal affairs',
      },
      hrUser
    );

    expect(application.status).toBe('PENDING');
    expect(application.totalDays).toBe(3);

    // 2. Approve Application
    const approved = await processLeaveAction(
      tenantSlug,
      {
        leaveApplicationId: application.id,
        action: 'APPROVE',
      },
      hrUser
    );
    expect(approved.status).toBe('APPROVED');

    // 3. Verify Balance deducted to 11 days (14 - 3)
    const summary = await getEmployeeLeaveSummary(tenantSlug, employeeId, 2026);
    const balance = summary.balances.find((b) => b.leaveTypeId === casualLeaveTypeId);
    expect(balance?.closingBalance).toBe(11);
    expect(balance?.used).toBe(3);

    // 4. Verify Ledger record
    const deductionLedger = summary.ledgers.find((l) => l.transactionType === 'APPLICATION_DEDUCTION');
    expect(deductionLedger).toBeDefined();
    expect(deductionLedger?.days).toBe(-3);
    expect(deductionLedger?.balanceAfter).toBe(11);
  });

  it('cancels approved leave and restores balance through a ledger event', async () => {
    const summaryBefore = await getEmployeeLeaveSummary(tenantSlug, employeeId, 2026);
    const app = summaryBefore.applications.find((a) => a.status === 'APPROVED');
    expect(app).toBeDefined();

    const cancelled = await processLeaveAction(
      tenantSlug,
      {
        leaveApplicationId: app!.id,
        action: 'CANCEL',
      },
      hrUser
    );
    expect(cancelled.status).toBe('CANCELLED');

    // Verify balance restored back to 14
    const summaryAfter = await getEmployeeLeaveSummary(tenantSlug, employeeId, 2026);
    const balance = summaryAfter.balances.find((b) => b.leaveTypeId === casualLeaveTypeId);
    expect(balance?.closingBalance).toBe(14);
    expect(balance?.used).toBe(0);

    const restoreLedger = summaryAfter.ledgers.find((l) => l.transactionType === 'CANCELLATION_RESTORE');
    expect(restoreLedger).toBeDefined();
    expect(restoreLedger?.days).toBe(3);
    expect(restoreLedger?.balanceAfter).toBe(14);
  });

  it('strictly rejects leave application when requested days exceed available balance', async () => {
    await expect(
      applyEmployeeLeave(
        tenantSlug,
        {
          employeeId,
          leaveTypeId: casualLeaveTypeId,
          startDate: '2026-10-01',
          endDate: '2026-10-25',
          totalDays: 20, // Exceeds 14 days quota
          reason: 'Extended vacation',
        },
        hrUser
      )
    ).rejects.toThrow(/Insufficient leave balance/);
  });
});
