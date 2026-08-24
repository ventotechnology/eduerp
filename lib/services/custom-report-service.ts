import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  ReportDefinitionCreateSchema,
  ReportDefinitionUpdateSchema,
  } from '@/lib/validations/schemas';
import { getDatasetByCode } from './report-registry-service';

export async function createReportDefinition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ReportDefinitionCreateSchema.parse(rawData);

  const dataset = await getDatasetByCode(validated.datasetCode);

  const report = await db.reportDefinition.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId || null,
      datasetId: dataset.id,
      datasetCode: dataset.code,
      code: validated.code,
      name: validated.name,
      description: validated.description,
      ownerUserId: actor.id,
      visibility: validated.visibility,
      isStandard: validated.isStandard,
      columns: {
        create: validated.columns.map((c) => ({
          fieldKey: c.fieldKey,
          displayLabel: c.displayLabel,
          sequenceOrder: c.sequenceOrder,
          columnWidth: c.columnWidth,
          formattingJson: c.formattingJson,
          aggregateType: c.aggregateType,
        })),
      },
      filters: {
        create: validated.filters.map((f) => ({
          fieldKey: f.fieldKey,
          operator: f.operator,
          valueJson: f.valueJson,
          sequenceOrder: f.sequenceOrder,
          isLocked: f.isLocked,
        })),
      },
      sorts: {
        create: validated.sorts.map((s) => ({
          fieldKey: s.fieldKey,
          direction: s.direction,
          priority: s.priority,
        })),
      },
      groups: {
        create: validated.groups.map((g) => ({
          fieldKey: g.fieldKey,
          sequenceOrder: g.sequenceOrder,
        })),
      },
      calculatedFields: {
        create: validated.calculatedFields.map((cf) => ({
          fieldKey: cf.fieldKey,
          label: cf.label,
          formulaExpression: cf.formulaExpression,
          dataType: cf.dataType,
        })),
      },
    },
    include: {
      columns: { orderBy: { sequenceOrder: 'asc' } },
      filters: { orderBy: { sequenceOrder: 'asc' } },
      sorts: { orderBy: { priority: 'asc' } },
      groups: { orderBy: { sequenceOrder: 'asc' } },
      calculatedFields: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'REPORT',
    resourceId: report.id,
    newState: { name: report.name, dataset: report.datasetCode, visibility: report.visibility },
  });

  return report;
}

export async function updateReportDefinition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ReportDefinitionUpdateSchema.parse(rawData);

  const report = await db.reportDefinition.findFirst({
    where: { id: validated.reportDefinitionId, institutionId: tenant.institutionId },
  });
  if (!report) throw AppError.notFound('Report definition not found.');

  // Access check: Only owner or admin can edit private reports
  if (report.ownerUserId !== actor.id && !actor.isPlatformAdmin && actor.role !== 'SUPER_ADMIN' && actor.role !== 'OWNER') {
    throw AppError.forbidden('You are not authorized to modify this report definition.');
  }

  const updated = await db.reportDefinition.update({
    where: { id: report.id },
    data: {
      name: validated.name || report.name,
      description: validated.description !== undefined ? validated.description : report.description,
      visibility: validated.visibility || report.visibility,
      status: validated.status || report.status,
      isFavorite: validated.isFavorite !== undefined ? validated.isFavorite : report.isFavorite,
      version: report.version + 1,
    },
    include: { columns: true, filters: true, sorts: true, groups: true },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'REPORT',
    resourceId: updated.id,
    newState: { version: updated.version, name: updated.name },
  });

  return updated;
}

export async function getReportDefinitions(tenantIdentifier: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  // Return standard reports + reports visible to actor
  return db.reportDefinition.findMany({
    where: {
      OR: [
        { isStandard: true },
        { institutionId: tenant.institutionId, ownerUserId: actor.id },
        { institutionId: tenant.institutionId, visibility: 'INSTITUTION_SHARED' },
      ],
      status: { not: 'ARCHIVED' },
    },
    include: {
      columns: { orderBy: { sequenceOrder: 'asc' } },
      filters: { orderBy: { sequenceOrder: 'asc' } },
      sorts: { orderBy: { priority: 'asc' } },
      groups: { orderBy: { sequenceOrder: 'asc' } },
      calculatedFields: true,
    },
    orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
  });
}

export async function getReportDefinitionById(tenantIdentifier: string, reportId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const report = await db.reportDefinition.findFirst({
    where: { id: reportId, OR: [{ institutionId: tenant.institutionId }, { isStandard: true }] },
    include: {
      columns: { orderBy: { sequenceOrder: 'asc' } },
      filters: { orderBy: { sequenceOrder: 'asc' } },
      sorts: { orderBy: { priority: 'asc' } },
      groups: { orderBy: { sequenceOrder: 'asc' } },
      calculatedFields: true,
    },
  });
  if (!report) throw AppError.notFound('Report definition not found.');
  return report;
}

export async function duplicateReportDefinition(tenantIdentifier: string, sourceReportId: string, newName: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const source = await db.reportDefinition.findFirst({
    where: { id: sourceReportId, OR: [{ institutionId: tenant.institutionId }, { isStandard: true }] },
    include: { columns: true, filters: true, sorts: true, groups: true, calculatedFields: true },
  });
  if (!source) throw AppError.notFound('Source report definition not found.');

  const duplicated = await db.reportDefinition.create({
    data: {
      institutionId: tenant.institutionId,
      datasetId: source.datasetId,
      datasetCode: source.datasetCode,
      name: newName,
      description: `Copy of ${source.name}`,
      ownerUserId: actor.id,
      visibility: 'PRIVATE',
      isStandard: false,
      columns: {
        create: source.columns.map((c) => ({
          fieldKey: c.fieldKey,
          displayLabel: c.displayLabel,
          sequenceOrder: c.sequenceOrder,
          columnWidth: c.columnWidth,
          formattingJson: c.formattingJson,
          aggregateType: c.aggregateType,
        })),
      },
      filters: {
        create: source.filters.map((f) => ({
          fieldKey: f.fieldKey,
          operator: f.operator,
          valueJson: f.valueJson,
          sequenceOrder: f.sequenceOrder,
          isLocked: f.isLocked,
        })),
      },
      sorts: {
        create: source.sorts.map((s) => ({
          fieldKey: s.fieldKey,
          direction: s.direction,
          priority: s.priority,
        })),
      },
      groups: {
        create: source.groups.map((g) => ({
          fieldKey: g.fieldKey,
          sequenceOrder: g.sequenceOrder,
        })),
      },
    },
    include: { columns: true, filters: true, sorts: true, groups: true },
  });

  return duplicated;
}

/**
 * Creates an immutable historical snapshot of report execution
 */
export async function saveReportSnapshot(
  tenantIdentifier: string,
  params: { reportDefinitionId: string; datasetCode: string; rowCount: number; dataJson: any; parameters?: any },
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const serializedData = typeof params.dataJson === 'string' ? params.dataJson : JSON.stringify(params.dataJson);
  const dataHash = crypto.createHash('sha256').update(serializedData).digest('hex');

  const snapshot = await db.reportSnapshot.create({
    data: {
      institutionId: tenant.institutionId,
      reportDefinitionId: params.reportDefinitionId,
      datasetCode: params.datasetCode,
      parametersJson: params.parameters ? JSON.stringify(params.parameters) : null,
      rowCount: params.rowCount,
      dataHash,
      snapshotDataJson: serializedData,
      generatedByUserId: actor.id,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'REPORT_SNAPSHOT',
    resourceId: snapshot.id,
    newState: { reportId: params.reportDefinitionId, rowCount: params.rowCount, dataHash },
  });

  return snapshot;
}
