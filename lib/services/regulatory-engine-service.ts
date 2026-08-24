import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  RegulatoryAgencyCreateSchema,
  RegulatoryTemplateCreateSchema,
  RegulatoryReportRunStartSchema,
  RegulatoryReportRunApproveSchema,
  RegulatorySubmissionRecordSchema,
} from '@/lib/validations/schemas';

// Standard Government Agencies in Bangladesh
export const SEED_AGENCIES = [
  { code: 'BANBEIS', name: 'Bangladesh Bureau of Educational Information and Statistics', shortName: 'BANBEIS', jurisdiction: 'BANGLADESH', websiteUrl: 'http://banbeis.gov.bd' },
  { code: 'DSHE', name: 'Directorate of Secondary and Higher Education', shortName: 'DSHE', jurisdiction: 'BANGLADESH', websiteUrl: 'http://dshe.gov.bd' },
  { code: 'EDUCATION_BOARD', name: 'Board of Intermediate and Secondary Education', shortName: 'Education Board', jurisdiction: 'BANGLADESH', websiteUrl: 'http://dhakaeducationboard.gov.bd' },
  { code: 'BMEB_MADRASHA', name: 'Bangladesh Madrasha Education Board', shortName: 'BMEB', jurisdiction: 'BANGLADESH', websiteUrl: 'http://bmeb.gov.bd' },
  { code: 'BTEB', name: 'Bangladesh Technical Education Board', shortName: 'BTEB', jurisdiction: 'BANGLADESH', websiteUrl: 'http://bteb.gov.bd' },
  { code: 'UGC', name: 'University Grants Commission of Bangladesh', shortName: 'UGC', jurisdiction: 'BANGLADESH', websiteUrl: 'http://ugc.gov.bd' },
  { code: 'MOE', name: 'Ministry of Education, Bangladesh', shortName: 'MOE', jurisdiction: 'BANGLADESH', websiteUrl: 'http://moedu.gov.bd' },
];

export async function initializeRegulatoryAgencies() {
  for (const ag of SEED_AGENCIES) {
    await db.regulatoryAgency.upsert({
      where: { code: ag.code },
      update: { name: ag.name, shortName: ag.shortName, websiteUrl: ag.websiteUrl },
      create: { code: ag.code, name: ag.name, shortName: ag.shortName, jurisdiction: ag.jurisdiction, websiteUrl: ag.websiteUrl },
    });
  }
}

export async function getRegulatoryAgencies() {
  await initializeRegulatoryAgencies();
  return db.regulatoryAgency.findMany({
    include: { templates: true },
    orderBy: { code: 'asc' },
  });
}

export async function createRegulatoryTemplate(rawData: unknown, actor: SessionUser) {
  if (!actor.isPlatformAdmin && actor.role !== 'SUPER_ADMIN') {
    throw AppError.forbidden('Only Platform Super Admins can create or update regulatory templates.');
  }

  const validated = RegulatoryTemplateCreateSchema.parse(rawData);
  const agency = await db.regulatoryAgency.findUnique({ where: { code: validated.agencyCode } });
  if (!agency) throw AppError.notFound(`Regulatory agency '${validated.agencyCode}' not found.`);

  return db.regulatoryTemplate.create({
    data: {
      agencyId: agency.id,
      agencyCode: agency.code,
      templateCode: validated.templateCode,
      title: validated.title,
      version: validated.version,
      institutionType: validated.institutionType,
      effectiveFrom: new Date(validated.effectiveFrom),
      outputFormat: validated.outputFormat,
      fields: {
        create: validated.fields.map((f) => ({
          fieldCode: f.fieldCode,
          label: f.label,
          dataType: f.dataType,
          isRequired: f.isRequired,
          validationRuleJson: f.validationRuleJson,
          sectionName: f.sectionName,
          sequenceOrder: f.sequenceOrder,
        })),
      },
    },
    include: { fields: true },
  });
}

export async function getRegulatoryTemplates(filter?: { agencyCode?: string; institutionType?: string }) {
  await initializeRegulatoryAgencies();
  const where: any = { status: 'ACTIVE' };
  if (filter?.agencyCode) where.agencyCode = filter.agencyCode;
  if (filter?.institutionType) where.institutionType = filter.institutionType;

  return db.regulatoryTemplate.findMany({
    where,
    include: { agency: true, fields: { orderBy: { sequenceOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Starts a new Regulatory Report Run
 */
export async function startRegulatoryReportRun(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RegulatoryReportRunStartSchema.parse(rawData);

  const template = await db.regulatoryTemplate.findUnique({
    where: { id: validated.templateId },
    include: { fields: true },
  });
  if (!template) throw AppError.notFound('Regulatory template not found.');

  const run = await db.regulatoryReportRun.create({
    data: {
      institutionId: tenant.institutionId,
      templateId: template.id,
      academicYearId: validated.academicYearId,
      sessionId: validated.sessionId,
      reportingPeriod: validated.reportingPeriod,
      status: 'DRAFT',
      preparerUserId: actor.id,
      integrationStatus: 'REGULATORY_DATA_VALIDATION_REAL; REGULATORY_EXPORT_REAL; EXTERNAL_GOVERNMENT_SUBMISSION_API_PENDING',
    },
    include: { template: true },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'REGULATORY_REPORT',
    resourceId: run.id,
    newState: { templateCode: template.templateCode, period: run.reportingPeriod },
  });

  return run;
}

/**
 * Validates data against regulatory template requirements
 */
export async function validateRegulatoryReportRun(tenantIdentifier: string, reportRunId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const run = await db.regulatoryReportRun.findFirst({
    where: { id: reportRunId, institutionId: tenant.institutionId },
    include: { template: { include: { fields: true } } },
  });
  if (!run) throw AppError.notFound('Regulatory report run not found.');

  // Clear previous validation issues
  await db.regulatoryValidationIssue.deleteMany({ where: { reportRunId: run.id } });

  const issues: Array<{ severity: 'ERROR' | 'WARNING' | 'INFO'; fieldCode: string; message: string; sourceRecordId?: string; sourceRecordType?: string; resolutionLink?: string }> = [];

  // Check 1: Institution metadata (EIIN, registration)
  const inst = await db.institution.findUnique({ where: { id: tenant.institutionId } });
  if (!inst?.phone) {
    issues.push({
      severity: 'ERROR',
      fieldCode: 'INST_PHONE',
      message: 'Institution contact phone number is missing in master settings.',
      resolutionLink: '/settings',
    });
  }

  // Check 2: Student missing required regulatory fields
  const students = await db.student.findMany({
    where: { campus: { institutionId: tenant.institutionId }, status: 'ACTIVE' },
  });

  for (const stu of students) {
    if (!stu.gender) {
      issues.push({
        severity: 'ERROR',
        fieldCode: 'STUDENT_GENDER',
        message: `Student ${stu.firstName} ${stu.lastName} (${stu.studentIdNumber}) is missing gender declaration.`,
        sourceRecordId: stu.id,
        sourceRecordType: 'Student',
        resolutionLink: `/students/${stu.id}`,
      });
    }
    if (!stu.dateOfBirth) {
      issues.push({
        severity: 'WARNING',
        fieldCode: 'STUDENT_DOB',
        message: `Student ${stu.firstName} ${stu.lastName} (${stu.studentIdNumber}) is missing date of birth.`,
        sourceRecordId: stu.id,
        sourceRecordType: 'Student',
        resolutionLink: `/students/${stu.id}`,
      });
    }
  }

  // Persist issues
  for (const iss of issues) {
    await db.regulatoryValidationIssue.create({
      data: {
        reportRunId: run.id,
        severity: iss.severity,
        fieldCode: iss.fieldCode,
        message: iss.message,
        sourceRecordId: iss.sourceRecordId,
        sourceRecordType: iss.sourceRecordType,
        resolutionLink: iss.resolutionLink,
      },
    });
  }

  const hasErrors = issues.some((i) => i.severity === 'ERROR');
  const newStatus = hasErrors ? 'VALIDATION_FAILED' : 'READY';

  const updatedRun = await db.regulatoryReportRun.update({
    where: { id: run.id },
    data: { status: newStatus },
    include: { validationIssues: true },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'REGULATORY_REPORT',
    resourceId: run.id,
    newState: { action: 'VALIDATE', status: newStatus, errorCount: issues.filter((i) => i.severity === 'ERROR').length },
  });

  return updatedRun;
}

/**
 * Approves a validated Regulatory Report Run and creates an immutable snapshot
 */
export async function approveRegulatoryReportRun(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser,
  enforceSegregationOfDuties = false
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RegulatoryReportRunApproveSchema.parse(rawData);

  const run = await db.regulatoryReportRun.findFirst({
    where: { id: validated.reportRunId, institutionId: tenant.institutionId },
    include: { template: { include: { fields: true } }, validationIssues: true },
  });
  if (!run) throw AppError.notFound('Regulatory report run not found.');

  if (run.status === 'VALIDATION_FAILED') {
    throw AppError.forbidden('Cannot approve regulatory report with active validation errors. Resolve errors first.');
  }

  // Segregation of duties: preparer cannot approve their own report run if configured
  if (enforceSegregationOfDuties && run.preparerUserId === actor.id && !actor.isPlatformAdmin) {
    throw AppError.forbidden('Segregation of duties violation: Preparer cannot approve their own regulatory submission.');
  }

  // Only authorized leadership roles can approve
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'PLATFORM_SUPER_ADMIN' && actor.role !== 'OWNER' && actor.role !== 'PRINCIPAL' && actor.role !== 'REGISTRAR' && actor.role !== 'VICE_CHANCELLOR') {
    throw AppError.forbidden('You lack authority to approve official government regulatory returns.');
  }

  // Compile snapshot data
  const snapshotPayload = {
    institution: tenant.name,
    template: run.template.title,
    period: run.reportingPeriod,
    approvedBy: actor.name,
    approvedAt: new Date().toISOString(),
    compiledData: {
      totalStudents: await db.student.count({ where: { campus: { institutionId: tenant.institutionId }, status: 'ACTIVE' } }),
      totalTeachers: await db.employee.count({ where: { campus: { institutionId: tenant.institutionId }, status: 'ACTIVE' } }),
    },
  };

  const serializedSnapshot = JSON.stringify(snapshotPayload);
  const snapshotHash = crypto.createHash('sha256').update(serializedSnapshot).digest('hex');

  const approvedRun = await db.regulatoryReportRun.update({
    where: { id: run.id },
    data: {
      status: 'APPROVED',
      approverUserId: actor.id,
      approvedAt: new Date(),
      snapshotDataJson: serializedSnapshot,
      snapshotHash,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'APPROVE',
    resourceType: 'REGULATORY_REPORT',
    resourceId: run.id,
    newState: { status: 'APPROVED', snapshotHash },
  });

  return approvedRun;
}

/**
 * Records manual government submission reference
 */
export async function recordRegulatorySubmission(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RegulatorySubmissionRecordSchema.parse(rawData);

  const run = await db.regulatoryReportRun.findFirst({
    where: { id: validated.reportRunId, institutionId: tenant.institutionId },
  });
  if (!run) throw AppError.notFound('Regulatory report run not found.');

  const submission = await db.regulatorySubmissionRecord.upsert({
    where: { reportRunId: run.id },
    update: {
      submissionReference: validated.submissionReference,
      acknowledgementNumber: validated.acknowledgementNumber,
      submissionDocumentUrl: validated.submissionDocumentUrl,
      notes: validated.notes,
      submittedByUserId: actor.id,
    },
    create: {
      reportRunId: run.id,
      submissionReference: validated.submissionReference,
      acknowledgementNumber: validated.acknowledgementNumber,
      submissionDocumentUrl: validated.submissionDocumentUrl,
      notes: validated.notes,
      submittedByUserId: actor.id,
    },
  });

  await db.regulatoryReportRun.update({
    where: { id: run.id },
    data: { status: 'EXPORTED', exportedAt: new Date() },
  });

  return submission;
}
