import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { executeGovernedReportQuery, ExecuteReportQueryParams } from './report-query-engine';

/**
 * Escapes CSV values and wraps in quotes if commas, quotes, or newlines exist
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates UTF-8 encoded, Bangla-compatible CSV content with BOM header
 */
export async function exportReportToCsv(
  tenantIdentifier: string,
  params: ExecuteReportQueryParams & { reportDefinitionId?: string },
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  // Execute query with pagination bypassed to fetch all matched rows for export
  const queryResult = await executeGovernedReportQuery(
    tenantIdentifier,
    { ...params, bypassPagination: true },
    actor
  );

  const headerLine = queryResult.columns.map((c) => escapeCsvValue(c.label)).join(',');
  const rowLines = queryResult.rows.map((row) => {
    return queryResult.columns.map((col) => escapeCsvValue(row[col.key])).join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel and text readers render Bangla characters perfectly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  // Log export in database and audit trail
  await db.reportExport.create({
    data: {
      institutionId: tenant.institutionId,
      reportDefinitionId: params.reportDefinitionId || null,
      exportFormat: 'CSV',
      rowCount: queryResult.rows.length,
      fileSize: Buffer.byteLength(csvContent, 'utf8'),
      exportedByUserId: actor.id,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXPORT',
    resourceType: 'REPORT_EXPORT',
    newState: { format: 'CSV', dataset: params.datasetCode, rowCount: queryResult.rows.length },
  });

  return {
    filename: `${params.datasetCode.toLowerCase()}_export_${Date.now()}.csv`,
    contentType: 'text/csv; charset=utf-8',
    content: csvContent,
    rowCount: queryResult.rows.length,
  };
}

/**
 * Generates XLSX structure metadata for reports
 */
export async function exportReportToXlsx(
  tenantIdentifier: string,
  params: ExecuteReportQueryParams & { reportDefinitionId?: string },
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const queryResult = await executeGovernedReportQuery(
    tenantIdentifier,
    { ...params, bypassPagination: true },
    actor
  );

  // Structured dataset payload for spreadsheet serialization
  const workbookPayload = {
    sheetName: params.datasetCode,
    columns: queryResult.columns,
    rows: queryResult.rows,
    aggregates: queryResult.aggregates,
    generatedAt: new Date().toISOString(),
    institution: tenant.name,
    exportedBy: actor.name,
  };

  await db.reportExport.create({
    data: {
      institutionId: tenant.institutionId,
      reportDefinitionId: params.reportDefinitionId || null,
      exportFormat: 'XLSX',
      rowCount: queryResult.rows.length,
      exportedByUserId: actor.id,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXPORT',
    resourceType: 'REPORT_EXPORT',
    newState: { format: 'XLSX', dataset: params.datasetCode, rowCount: queryResult.rows.length },
  });

  return {
    filename: `${params.datasetCode.toLowerCase()}_export_${Date.now()}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    payload: workbookPayload,
    rowCount: queryResult.rows.length,
  };
}

/**
 * Generates printable PDF summary sheet metadata
 */
export async function exportReportToPdfSummary(
  tenantIdentifier: string,
  params: ExecuteReportQueryParams & { reportDefinitionId?: string },
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const queryResult = await executeGovernedReportQuery(
    tenantIdentifier,
    { ...params, pageSize: 100 },
    actor
  );

  const summarySheet = {
    title: `${params.datasetCode} Official Report Summary`,
    institution: tenant.name,
    generatedDate: new Date().toLocaleDateString('en-GB'),
    generatedBy: `${actor.name} (${actor.role})`,
    confidentiality: 'INTERNAL USE ONLY - NOT FOR PUBLIC DISSEMINATION',
    columns: queryResult.columns,
    rows: queryResult.rows,
    aggregates: queryResult.aggregates,
    totalRecords: queryResult.pagination.totalCount,
  };

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXPORT',
    resourceType: 'REPORT_EXPORT',
    newState: { format: 'PDF', dataset: params.datasetCode, rowCount: queryResult.rows.length },
  });

  return summarySheet;
}
