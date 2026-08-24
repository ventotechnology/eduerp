import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  HrLeaveTypeCreateSchema,
  HrLeavePolicyCreateSchema,
  EmployeeLeaveApplySchema,
  LeaveActionSchema,
} from '@/lib/validations/schemas';

export async function createHrLeaveType(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HrLeaveTypeCreateSchema.parse(rawData);

  const existing = await db.hrLeaveType.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Leave type code '${validated.code}' already exists.`);

  return db.hrLeaveType.create({
    data: {
      institutionId: tenant.institutionId,
      code: validated.code,
      name: validated.name,
      isPaid: validated.isPaid,
      annualQuotaDays: validated.annualQuotaDays,
      carryForwardMaxDays: validated.carryForwardMaxDays,
      requiresProof: validated.requiresProof,
    },
  });
}

export async function createHrLeavePolicy(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HrLeavePolicyCreateSchema.parse(rawData);

  const leaveType = await db.hrLeaveType.findFirst({
    where: { id: validated.leaveTypeId, institutionId: tenant.institutionId },
  });
  if (!leaveType) throw AppError.notFound('Leave type not found.');

  return db.hrLeavePolicy.create({
    data: {
      institutionId: tenant.institutionId,
      leaveTypeId: validated.leaveTypeId,
      employmentType: validated.employmentType,
      category: validated.category,
      annualEntitlement: validated.annualEntitlement,
      accrualFrequency: validated.accrualFrequency,
    },
  });
}

export async function initializeEmployeeLeaveBalance(
  tenantIdentifier: string,
  employeeId: string,
  leaveTypeId: string,
  year: number,
  quotaDays: number,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const emp = await db.employee.findFirst({
    where: { id: employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  return db.$transaction(async (tx) => {
    const balance = await tx.employeeLeaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
      update: {
        earned: quotaDays,
        closingBalance: quotaDays,
      },
      create: {
        employeeId,
        leaveTypeId,
        year,
        openingBalance: 0,
        earned: quotaDays,
        used: 0,
        adjusted: 0,
        carriedForward: 0,
        closingBalance: quotaDays,
      },
    });

    await tx.employeeLeaveLedger.create({
      data: {
        employeeId,
        leaveTypeId,
        transactionType: 'ACCRUAL',
        days: quotaDays,
        balanceAfter: quotaDays,
        reason: `Annual quota allocation for year ${year}`,
      },
    });

    return balance;
  });
}

export async function applyEmployeeLeave(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeLeaveApplySchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  const leaveType = await db.hrLeaveType.findFirst({
    where: { id: validated.leaveTypeId, institutionId: tenant.institutionId },
  });
  if (!leaveType) throw AppError.notFound('Leave type not found.');

  const startDate = new Date(validated.startDate);
  const endDate = new Date(validated.endDate);
  const year = startDate.getFullYear();

  // Check date overlap with existing approved or pending leaves
  const overlap = await db.employeeLeaveApplication.findFirst({
    where: {
      employeeId: validated.employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
  });
  if (overlap) {
    throw AppError.conflict('You already have an active or pending leave application covering these dates.');
  }

  // Check leave balance if paid leave
  if (leaveType.isPaid) {
    const balance = await db.employeeLeaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: validated.employeeId,
          leaveTypeId: validated.leaveTypeId,
          year,
        },
      },
    });

    const available = balance ? balance.closingBalance : leaveType.annualQuotaDays;
    if (available < validated.totalDays) {
      throw AppError.conflict(
        `Insufficient leave balance. Available: ${available} days, Requested: ${validated.totalDays} days.`
      );
    }
  }

  const application = await db.employeeLeaveApplication.create({
    data: {
      employeeId: validated.employeeId,
      leaveTypeId: validated.leaveTypeId,
      startDate,
      endDate,
      totalDays: validated.totalDays,
      isHalfDay: validated.isHalfDay,
      halfDayType: validated.halfDayType,
      reason: validated.reason,
      attachmentUrl: validated.attachmentUrl,
      status: 'PENDING',
    },
    include: { leaveType: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'LEAVES',
    action: 'CREATE',
    resourceId: application.id,
    newState: { leaveType: leaveType.name, days: application.totalDays },
  });

  return application;
}

export async function processLeaveAction(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LeaveActionSchema.parse(rawData);
  const action = validated.statusAction || validated.action;

  const application = await db.employeeLeaveApplication.findUnique({
    where: { id: validated.leaveApplicationId },
    include: { employee: { include: { campus: true } }, leaveType: true },
  });
  if (!application || application.employee.campus.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Leave application not found.');
  }

  const year = application.startDate.getFullYear();

  return db.$transaction(async (tx) => {
    if (action === 'REJECT') {
      return tx.employeeLeaveApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          approvedBy: actor.name,
          rejectionReason: validated.rejectionReason,
        },
      });
    }

    if (action === 'APPROVE') {
      if (application.status === 'APPROVED') {
        throw AppError.conflict('Leave application is already approved.');
      }

      // 1. Update Balance & Create Ledger entry if paid leave
      if (application.leaveType.isPaid) {
        let currentBalance = await tx.employeeLeaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: application.employeeId,
              leaveTypeId: application.leaveTypeId,
              year,
            },
          },
        });

        if (!currentBalance) {
          currentBalance = await tx.employeeLeaveBalance.create({
            data: {
              employeeId: application.employeeId,
              leaveTypeId: application.leaveTypeId,
              year,
              openingBalance: 0,
              earned: application.leaveType.annualQuotaDays,
              used: 0,
              adjusted: 0,
              carriedForward: 0,
              closingBalance: application.leaveType.annualQuotaDays,
            },
          });
        }

        const newClosing = currentBalance.closingBalance - application.totalDays;
        const newUsed = currentBalance.used + application.totalDays;

        await tx.employeeLeaveBalance.update({
          where: { id: currentBalance.id },
          data: { used: newUsed, closingBalance: newClosing },
        });

        await tx.employeeLeaveLedger.create({
          data: {
            employeeId: application.employeeId,
            leaveTypeId: application.leaveTypeId,
            transactionType: 'APPLICATION_DEDUCTION',
            days: -application.totalDays,
            balanceAfter: newClosing,
            referenceId: application.id,
            reason: `Approved leave application from ${application.startDate.toISOString().slice(0, 10)} to ${application.endDate.toISOString().slice(0, 10)}`,
          },
        });
      }

      const approved = await tx.employeeLeaveApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          approvedBy: actor.name,
          approvedAt: new Date(),
        },
      });

      await logAuditEvent({
        actor,
        tenantId: tenant.tenantId,
        resourceType: 'LEAVES',
        action: 'APPROVE',
        resourceId: application.id,
        newState: { action: 'LEAVE_APPROVED', employeeId: application.employeeId, days: application.totalDays },
      });

      return approved;
    }

    if (action === 'CANCEL') {
      if (application.status !== 'APPROVED') {
        return tx.employeeLeaveApplication.update({
          where: { id: application.id },
          data: { status: 'CANCELLED' },
        });
      }

      // Restore balance via Ledger entry if previously approved paid leave
      if (application.leaveType.isPaid) {
        const currentBalance = await tx.employeeLeaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: application.employeeId,
              leaveTypeId: application.leaveTypeId,
              year,
            },
          },
        });

        if (currentBalance) {
          const newClosing = currentBalance.closingBalance + application.totalDays;
          const newUsed = Math.max(0, currentBalance.used - application.totalDays);

          await tx.employeeLeaveBalance.update({
            where: { id: currentBalance.id },
            data: { used: newUsed, closingBalance: newClosing },
          });

          await tx.employeeLeaveLedger.create({
            data: {
              employeeId: application.employeeId,
              leaveTypeId: application.leaveTypeId,
              transactionType: 'CANCELLATION_RESTORE',
              days: application.totalDays,
              balanceAfter: newClosing,
              referenceId: application.id,
              reason: `Leave cancellation restored balance`,
            },
          });
        }
      }

      const cancelled = await tx.employeeLeaveApplication.update({
        where: { id: application.id },
        data: { status: 'CANCELLED' },
      });

      await logAuditEvent({
        actor,
        tenantId: tenant.tenantId,
        resourceType: 'LEAVES',
        action: 'UPDATE',
        resourceId: application.id,
        newState: { action: 'LEAVE_CANCELLED', employeeId: application.employeeId, days: application.totalDays },
      });

      return cancelled;
    }

    throw AppError.validation('Invalid leave action.');
  });
}

export async function getEmployeeLeaveSummary(tenantIdentifier: string, employeeId: string, year: number = new Date().getFullYear()) {
  const tenant = await requireTenant(tenantIdentifier);

  const [balances, applications, ledgers] = await Promise.all([
    db.employeeLeaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    }),
    db.employeeLeaveApplication.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.employeeLeaveLedger.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { transactionDate: 'desc' },
    }),
  ]);

  return {
    year,
    balances,
    applications,
    ledgers,
  };
}
