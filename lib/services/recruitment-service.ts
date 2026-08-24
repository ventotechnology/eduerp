import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  JobRequisitionCreateSchema,
  JobVacancyCreateSchema,
  JobCandidateCreateSchema,
  CandidateInterviewCreateSchema,
  JobOfferCreateSchema,
  CandidateHireConversionSchema,
} from '@/lib/validations/schemas';

export async function createJobRequisition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JobRequisitionCreateSchema.parse(rawData);

  const position = await db.position.findFirst({
    where: { id: validated.positionId, institutionId: tenant.institutionId },
  });
  if (!position) throw AppError.notFound('Position not found in this institution.');

  const count = await db.jobRequisition.count({
    where: { institutionId: tenant.institutionId },
  });
  const requisitionNumber = `REQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const req = await db.jobRequisition.create({
    data: {
      institutionId: tenant.institutionId,
      requisitionNumber,
      positionId: validated.positionId,
      requestedHeadcount: validated.requestedHeadcount,
      reason: validated.reason,
      requiredByDate: new Date(validated.requiredByDate),
      status: 'SUBMITTED',
      requestedBy: actor.name,
    },
    include: { position: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'RECRUITMENT',
    action: 'CREATE',
    resourceId: req.id,
    newState: { requisitionNumber, position: position.title },
  });

  return req;
}

export async function approveJobRequisition(tenantIdentifier: string, requisitionId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const req = await db.jobRequisition.findFirst({
    where: { id: requisitionId, institutionId: tenant.institutionId },
  });
  if (!req) throw AppError.notFound('Job requisition not found.');

  return db.jobRequisition.update({
    where: { id: requisitionId },
    data: {
      status: 'APPROVED',
      approvedBy: actor.name,
    },
  });
}

export async function createJobVacancy(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JobVacancyCreateSchema.parse(rawData);

  const position = await db.position.findFirst({
    where: { id: validated.positionId, institutionId: tenant.institutionId },
  });
  if (!position) throw AppError.notFound('Position not found.');

  const count = await db.jobVacancy.count({
    where: { institutionId: tenant.institutionId },
  });
  const vacancyCode = `VAC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const vacancy = await db.jobVacancy.create({
    data: {
      institutionId: tenant.institutionId,
      vacancyCode,
      positionId: validated.positionId,
      campusId: validated.campusId,
      departmentId: validated.departmentId,
      title: validated.title,
      jobType: validated.jobType,
      employmentType: validated.employmentType,
      responsibilities: validated.responsibilities,
      requirements: validated.requirements,
      closingDate: new Date(validated.closingDate),
      status: 'PUBLISHED',
    },
    include: { position: true, department: true, campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'RECRUITMENT',
    action: 'CREATE',
    resourceId: vacancy.id,
    newState: { vacancyCode, title: vacancy.title },
  });

  return vacancy;
}

export async function registerJobCandidate(tenantIdentifier: string, rawData: unknown) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JobCandidateCreateSchema.parse(rawData);

  const vacancy = await db.jobVacancy.findFirst({
    where: { id: validated.vacancyId, institutionId: tenant.institutionId },
  });
  if (!vacancy) throw AppError.notFound('Job vacancy not found.');

  const count = await db.jobCandidate.count({
    where: { institutionId: tenant.institutionId },
  });
  const applicantNumber = `APP-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.jobCandidate.create({
    data: {
      institutionId: tenant.institutionId,
      vacancyId: validated.vacancyId,
      applicantNumber,
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      phone: validated.phone,
      cvUrl: validated.cvUrl,
      highestQualification: validated.highestQualification,
      experienceYears: validated.experienceYears,
      source: validated.source,
      stage: 'APPLIED',
    },
    include: { vacancy: true },
  });
}

export async function recordCandidateInterview(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CandidateInterviewCreateSchema.parse(rawData);

  const candidate = await db.jobCandidate.findFirst({
    where: { id: validated.candidateId, institutionId: tenant.institutionId },
  });
  if (!candidate) throw AppError.notFound('Candidate not found.');

  const interview = await db.candidateInterview.create({
    data: {
      candidateId: validated.candidateId,
      interviewDate: new Date(validated.interviewDate),
      roundName: validated.roundName,
      interviewers: validated.interviewers,
      criteriaScores: validated.criteriaScores,
      totalScore: validated.totalScore,
      comments: validated.comments,
      recommendation: validated.recommendation,
    },
  });

  // Advance stage to INTERVIEW
  await db.jobCandidate.update({
    where: { id: validated.candidateId },
    data: { stage: 'INTERVIEW' },
  });

  return interview;
}

export async function issueJobOffer(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JobOfferCreateSchema.parse(rawData);

  const candidate = await db.jobCandidate.findFirst({
    where: { id: validated.candidateId, institutionId: tenant.institutionId },
  });
  if (!candidate) throw AppError.notFound('Candidate not found.');

  const position = await db.position.findFirst({
    where: { id: validated.positionId, institutionId: tenant.institutionId },
  });
  if (!position) throw AppError.notFound('Position not found.');

  const count = await db.jobOffer.count({
    where: { institutionId: tenant.institutionId },
  });
  const offerNumber = `OFR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const offer = await db.jobOffer.create({
    data: {
      institutionId: tenant.institutionId,
      candidateId: validated.candidateId,
      positionId: validated.positionId,
      offerNumber,
      employmentType: validated.employmentType,
      proposedJoiningDate: new Date(validated.proposedJoiningDate),
      offeredGrossSalary: validated.offeredGrossSalary,
      expiryDate: new Date(validated.expiryDate),
      status: 'SENT',
      approvedBy: actor.name,
    },
    include: { candidate: true, position: true },
  });

  await db.jobCandidate.update({
    where: { id: validated.candidateId },
    data: { stage: 'OFFERED' },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'RECRUITMENT',
    action: 'CREATE',
    resourceId: offer.id,
    newState: { offerNumber, salary: offer.offeredGrossSalary },
  });

  return offer;
}

export async function convertCandidateToEmployee(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CandidateHireConversionSchema.parse(rawData);

  const candidate = await db.jobCandidate.findFirst({
    where: { id: validated.candidateId, institutionId: tenant.institutionId },
    include: { vacancy: true },
  });
  if (!candidate) throw AppError.notFound('Candidate not found.');

  // Guard against duplicate conversion
  if (candidate.convertedEmployeeId || candidate.stage === 'HIRED') {
    throw AppError.conflict('Candidate has already been hired and converted into an employee.');
  }

  const offer = await db.jobOffer.findFirst({
    where: { id: validated.offerId, candidateId: validated.candidateId, institutionId: tenant.institutionId },
    include: { position: true },
  });
  if (!offer) throw AppError.notFound('Valid job offer not found for this candidate.');

  return db.$transaction(async (tx) => {
    // 1. Create Employee
    const employee = await tx.employee.create({
      data: {
        campusId: validated.campusId,
        employeeCode: validated.employeeCode,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        designation: offer.position.title,
        departmentId: offer.position.departmentId,
        positionId: offer.positionId,
        category: offer.position.category,
        status: 'PROBATION',
        joiningDate: new Date(validated.joiningDate),
        employmentType: offer.employmentType,
        basicSalary: validated.basicSalary,
        phone: candidate.phone,
        email: candidate.email,
      },
    });

    // 2. Create Initial Employment Contract
    const contractNumber = `CON-${new Date().getFullYear()}-${employee.employeeCode}`;
    await tx.employmentContract.create({
      data: {
        employeeId: employee.id,
        contractNumber,
        contractType: offer.employmentType,
        startDate: new Date(validated.joiningDate),
        grossSalaryReference: offer.offeredGrossSalary,
        status: 'ACTIVE',
      },
    });

    // 3. Create Standard Onboarding Checklist
    const defaultTasks = [
      { id: '1', title: 'Submit original educational certificates', owner: 'EMPLOYEE', isCompleted: false },
      { id: '2', title: 'Issue institutional ID card & email account', owner: 'IT_ADMIN', isCompleted: false },
      { id: '3', title: 'Collect bank account details for payroll', owner: 'HR_MANAGER', isCompleted: false },
      { id: '4', title: 'Department introduction & workstation setup', owner: 'HOD', isCompleted: false },
      { id: '5', title: 'Biometric / RFID attendance registration', owner: 'ADMIN', isCompleted: false },
    ];

    await tx.employeeOnboarding.create({
      data: {
        employeeId: employee.id,
        templateName: 'Standard Faculty & Staff Onboarding',
        tasks: JSON.stringify(defaultTasks),
        status: 'IN_PROGRESS',
      },
    });

    // 4. Update Offer & Candidate
    await tx.jobOffer.update({
      where: { id: offer.id },
      data: { status: 'ACCEPTED' },
    });

    await tx.jobCandidate.update({
      where: { id: candidate.id },
      data: {
        stage: 'HIRED',
        convertedEmployeeId: employee.id,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'EMPLOYEES',
      action: 'CREATE',
      resourceId: employee.id,
      newState: {
        convertedFromCandidate: candidate.applicantNumber,
        employeeCode: employee.employeeCode,
      },
    });

    return employee;
  });
}
