import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  EmployeePromotionSchema,
  EmployeeTransferSchema,
  EmployeeIncrementSchema,
  PerformanceCycleCreateSchema,
  EmployeeGoalCreateSchema,
  EmployeePerformanceReviewSubmitSchema,
  TrainingProgramCreateSchema,
  EmployeeTrainingNominateSchema,
  EmployeeDisciplinaryCaseSchema,
  EmployeeWarningSchema,
  EmployeeGrievanceSchema,
  EmployeeSeparationRequestSchema,
  ExitClearanceUpdateSchema,
} from '@/lib/validations/schemas';

// ----------------------------------------------------
// 1. Promotions, Transfers & Increments
// ----------------------------------------------------
export async function promoteEmployee(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeePromotionSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.$transaction(async (tx) => {
    // Record history
    const promotion = await tx.employeePromotionHistory.create({
      data: {
        employeeId: employee.id,
        effectiveDate: new Date(validated.effectiveDate),
        previousPositionId: employee.positionId,
        newPositionId: validated.newPositionId,
        previousAcademicRank: employee.academicRank,
        newAcademicRank: validated.newAcademicRank,
        reason: validated.reason,
        approvedBy: actor.name,
      },
    });

    // Update active employee record
    await tx.employee.update({
      where: { id: employee.id },
      data: {
        positionId: validated.newPositionId || employee.positionId,
        academicRank: validated.newAcademicRank || employee.academicRank,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'EMPLOYEES',
      action: 'UPDATE',
      resourceId: employee.id,
      newState: {
        action: 'EMPLOYEE_PROMOTED',
        newPositionId: validated.newPositionId,
        newRank: validated.newAcademicRank,
      },
    });

    return promotion;
  });
}

export async function transferEmployee(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeTransferSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  if (validated.newCampusId) {
    const campus = await db.campus.findFirst({
      where: { id: validated.newCampusId, institutionId: tenant.institutionId },
    });
    if (!campus) throw AppError.validation('Target campus does not belong to this institution.');
  }

  return db.$transaction(async (tx) => {
    const transfer = await tx.employeeTransferHistory.create({
      data: {
        employeeId: employee.id,
        effectiveDate: new Date(validated.effectiveDate),
        previousCampusId: employee.campusId,
        newCampusId: validated.newCampusId,
        previousDepartmentId: employee.departmentId,
        newDepartmentId: validated.newDepartmentId,
        reason: validated.reason,
        approvedBy: actor.name,
      },
    });

    await tx.employee.update({
      where: { id: employee.id },
      data: {
        campusId: validated.newCampusId || employee.campusId,
        departmentId: validated.newDepartmentId || employee.departmentId,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'EMPLOYEES',
      action: 'UPDATE',
      resourceId: employee.id,
      newState: {
        action: 'EMPLOYEE_TRANSFERRED',
        newCampusId: validated.newCampusId,
        newDepartmentId: validated.newDepartmentId,
      },
    });

    return transfer;
  });
}

export async function requestSalaryIncrement(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeIncrementSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
    include: {
      salaryAssignments: {
        where: { status: 'ACTIVE' },
        orderBy: { effectiveDate: 'desc' },
        take: 1,
      },
    },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const currentGross = employee.salaryAssignments[0]?.grossSalary || employee.basicSalary;
  const incrementAmount = validated.newGrossSalary - currentGross;

  return db.employeeIncrementRequest.create({
    data: {
      employeeId: employee.id,
      effectiveDate: new Date(validated.effectiveDate),
      previousGrossSalary: currentGross,
      newGrossSalary: validated.newGrossSalary,
      incrementAmount,
      reason: validated.reason,
      status: 'APPROVED',
      approvedBy: actor.name,
    },
  });
}

// ----------------------------------------------------
// 2. Performance Management
// ----------------------------------------------------
export async function createPerformanceCycle(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PerformanceCycleCreateSchema.parse(rawData);

  const existing = await db.performanceCycle.findFirst({
    where: { institutionId: tenant.institutionId, name: validated.name },
  });
  if (existing) throw AppError.conflict(`Performance cycle '${validated.name}' already exists.`);

  return db.performanceCycle.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      status: 'ACTIVE',
    },
  });
}

export async function createEmployeeGoal(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeGoalCreateSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.employeeGoal.create({
    data: {
      employeeId: validated.employeeId,
      cycleId: validated.cycleId,
      title: validated.title,
      weightagePercentage: validated.weightagePercentage,
      targetMetric: validated.targetMetric,
      status: 'IN_PROGRESS',
    },
  });
}

export async function submitPerformanceReview(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeePerformanceReviewSubmitSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.employeePerformanceReview.create({
    data: {
      employeeId: validated.employeeId,
      cycleId: validated.cycleId,
      reviewerId: actor.id,
      teachingScore: validated.teachingScore,
      researchScore: validated.researchScore,
      serviceScore: validated.serviceScore,
      overallScore: validated.overallScore,
      rating: validated.rating,
      selfReviewSummary: validated.selfReviewSummary,
      managerReviewSummary: validated.managerReviewSummary,
      status: validated.status,
    },
  });
}

// ----------------------------------------------------
// 3. Training & Development
// ----------------------------------------------------
export async function createTrainingProgram(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TrainingProgramCreateSchema.parse(rawData);

  return db.trainingProgram.create({
    data: {
      institutionId: tenant.institutionId,
      title: validated.title,
      provider: validated.provider,
      trainingType: validated.trainingType,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      capacity: validated.capacity,
      cost: validated.cost,
    },
  });
}

export async function nominateEmployeeForTraining(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeTrainingNominateSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.employeeTrainingEnrollment.create({
    data: {
      employeeId: validated.employeeId,
      trainingProgramId: validated.trainingProgramId,
      status: 'NOMINATED',
    },
  });
}

// ----------------------------------------------------
// 4. Employee Relations, Discipline & Grievance
// ----------------------------------------------------
export async function recordEmployeeDisciplinaryCase(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeDisciplinaryCaseSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const count = await db.employeeDisciplinaryCase.count({
    where: { institutionId: tenant.institutionId },
  });
  const caseNumber = `DIS-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const disc = await db.employeeDisciplinaryCase.create({
    data: {
      institutionId: tenant.institutionId,
      employeeId: validated.employeeId,
      caseNumber,
      incidentDate: new Date(validated.incidentDate),
      allegation: validated.allegation,
      evidenceUrls: validated.evidenceUrls,
      status: 'OPEN',
      investigatedBy: actor.name,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'DISCIPLINE',
    action: 'CREATE',
    resourceId: disc.id,
    newState: { caseNumber, employeeCode: employee.employeeCode },
  });

  return disc;
}

export async function issueEmployeeWarning(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeWarningSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.employeeWarning.create({
    data: {
      employeeId: validated.employeeId,
      warningLevel: validated.warningLevel,
      issueDate: new Date(validated.issueDate),
      reason: validated.reason,
      issuedBy: actor.name,
    },
  });
}

export async function submitEmployeeGrievance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeGrievanceSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const count = await db.employeeGrievance.count({
    where: { institutionId: tenant.institutionId },
  });
  const ticketNumber = `GRV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const grievance = await db.employeeGrievance.create({
    data: {
      institutionId: tenant.institutionId,
      employeeId: validated.employeeId,
      ticketNumber,
      subject: validated.subject,
      details: validated.details,
      isConfidential: validated.isConfidential,
      status: 'SUBMITTED',
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'GRIEVANCE',
    action: 'CREATE',
    resourceId: grievance.id,
    newState: { ticketNumber, isConfidential: grievance.isConfidential },
  });

  return grievance;
}

// ----------------------------------------------------
// 5. Separation & Exit Clearance
// ----------------------------------------------------
export async function requestEmployeeSeparation(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeSeparationRequestSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  return db.$transaction(async (tx) => {
    const separation = await tx.employeeSeparation.create({
      data: {
        institutionId: tenant.institutionId,
        employeeId: validated.employeeId,
        separationType: validated.separationType,
        lastWorkingDate: new Date(validated.lastWorkingDate),
        reason: validated.reason,
        noticePeriodDays: validated.noticePeriodDays,
        status: 'SUBMITTED',
      },
    });

    // Create exit clearance checklist
    await tx.employeeExitClearance.create({
      data: {
        separationId: separation.id,
        overallStatus: 'PENDING',
      },
    });

    // Update employee status to NOTICE_PERIOD
    await tx.employee.update({
      where: { id: employee.id },
      data: { status: 'NOTICE_PERIOD' },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'SEPARATION',
      action: 'CREATE',
      resourceId: separation.id,
      newState: { separationType: validated.separationType, lastWorkingDate: validated.lastWorkingDate },
    });

    return separation;
  });
}

export async function updateExitClearance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ExitClearanceUpdateSchema.parse(rawData);

  const clearance = await db.employeeExitClearance.findUnique({
    where: { separationId: validated.separationId },
    include: { separation: true },
  });
  if (!clearance || clearance.separation.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Clearance record not found.');
  }

  const deptCleared = validated.departmentCleared !== undefined ? validated.departmentCleared : clearance.departmentCleared;
  const libCleared = validated.libraryCleared !== undefined ? validated.libraryCleared : clearance.libraryCleared;
  const finCleared = validated.financeCleared !== undefined ? validated.financeCleared : clearance.financeCleared;
  const itCleared = validated.itEquipmentCleared !== undefined ? validated.itEquipmentCleared : clearance.itEquipmentCleared;
  const hostCleared = validated.hostelCleared !== undefined ? validated.hostelCleared : clearance.hostelCleared;

  const isFullyCleared = deptCleared && libCleared && finCleared && itCleared && hostCleared;

  return db.$transaction(async (tx) => {
    const updated = await tx.employeeExitClearance.update({
      where: { separationId: validated.separationId },
      data: {
        departmentCleared: deptCleared,
        libraryCleared: libCleared,
        financeCleared: finCleared,
        itEquipmentCleared: itCleared,
        hostelCleared: hostCleared,
        overallStatus: isFullyCleared ? 'FULLY_CLEARED' : 'PENDING',
        finalPayrollInputData: validated.finalPayrollInputData,
        clearedBy: isFullyCleared ? actor.name : undefined,
        clearedAt: isFullyCleared ? new Date() : undefined,
      },
    });

    if (isFullyCleared) {
      await tx.employeeSeparation.update({
        where: { id: clearance.separationId },
        data: { status: 'COMPLETED' },
      });

      await tx.employee.update({
        where: { id: clearance.separation.employeeId },
        data: { status: 'RESIGNED' },
      });
    }

    return updated;
  });
}
