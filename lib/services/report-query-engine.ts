import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { getDatasetByCode } from './report-registry-service';

export interface ExecuteReportQueryParams {
  datasetCode: string;
  columns?: string[];
  filters?: Array<{
    fieldKey: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'IS_NULL' | 'IS_NOT_NULL';
    value: any;
  }>;
  sorts?: Array<{ fieldKey: string; direction: 'ASC' | 'DESC' }>;
  groups?: string[];
  aggregates?: Array<{ fieldKey: string; aggregateType: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT_COUNT' }>;
  page?: number;
  pageSize?: number;
  bypassPagination?: boolean;
}

/**
 * Mask sensitive PII data unless user has explicit permission
 */
export function maskPiiValue(value: any, maskingType: string): string {
  if (value === null || value === undefined) return '';
  const str = String(value);

  if (maskingType === 'PHONE') {
    if (str.length <= 5) return '***';
    return `${str.slice(0, 3)}******${str.slice(-2)}`;
  }
  if (maskingType === 'EMAIL') {
    const parts = str.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const maskedName = name.length > 2 ? `${name[0]}***${name.slice(-1)}` : '***';
      return `${maskedName}@${parts[1]}`;
    }
    return '***@***.***';
  }
  if (maskingType === 'BANK_ACCOUNT' || maskingType === 'NID') {
    if (str.length <= 4) return '****';
    return `****${str.slice(-4)}`;
  }
  return str;
}

/**
 * Executes a governed query against the database with strict metadata validation,
 * automatic tenant boundary injection, campus scoping, and PII masking.
 */
export async function executeGovernedReportQuery(
  tenantIdentifier: string,
  params: ExecuteReportQueryParams,
  actor: SessionUser
) {
  // 1. Resolve Tenant Boundary
  let tenant: any = null;
  let institutionId: string | null = null;

  const dataset = await getDatasetByCode(params.datasetCode);

  // Platform dataset check: only Platform Admins can query Platform datasets
  if (dataset.isPlatformDataset) {
    if (!actor.isPlatformAdmin) {
      throw AppError.forbidden('Only SaaS Platform Super Admins can access platform datasets.');
    }
  } else {
    tenant = await requireTenant(tenantIdentifier);
    institutionId = tenant.institutionId;
  }

  // 2. Validate Selected Columns
  const fieldMap = new Map<string, any>(dataset.fields.map((f) => [f.fieldKey, f]));
  const requestedColumns = params.columns && params.columns.length > 0
    ? params.columns
    : dataset.fields.filter((f) => f.classification !== 'RESTRICTED').map((f) => f.fieldKey);

  for (const col of requestedColumns) {
    if (!fieldMap.has(col)) {
      throw AppError.badRequest(`Unknown or unapproved column '${col}' in dataset '${params.datasetCode}'.`);
    }
    const fDef = fieldMap.get(col)!;
    if (fDef.requiredPermission) {
      // If actor role does not allow this restricted field, reject or omit
      if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'PLATFORM_SUPER_ADMIN' && actor.role !== 'OWNER' && actor.role !== 'ACCOUNTANT' && actor.role !== 'HR_MANAGER') {
        throw AppError.forbidden(`You lack permission to query restricted field '${fDef.label}'.`);
      }
    }
  }

  // 3. Build Prisma Where Clause from Validated Filters
  const whereClause: any = {};
  if (institutionId) {
    // Check if model belongs directly to institution or campus
    if (params.datasetCode === 'STUDENTS') {
      whereClause.campus = { institutionId };
    } else if (params.datasetCode === 'EMPLOYEES') {
      whereClause.campus = { institutionId };
    } else if (params.datasetCode === 'ENROLLMENTS') {
      whereClause.student = { campus: { institutionId } };
    } else if (params.datasetCode === 'FEES') {
      whereClause.student = { campus: { institutionId } };
    } else if (params.datasetCode === 'EXAM_RESULTS') {
      whereClause.exam = { institutionId };
    }
  }

  if (params.filters) {
    for (const flt of params.filters) {
      if (!fieldMap.has(flt.fieldKey)) {
        throw AppError.badRequest(`Unknown or unapproved filter field '${flt.fieldKey}'.`);
      }
      const fDef = fieldMap.get(flt.fieldKey)!;
      if (!fDef.isFilterable) {
        throw AppError.badRequest(`Field '${fDef.label}' is not configured as filterable.`);
      }

      const key = fDef.sourceField;
      if (flt.operator === 'EQUALS') {
        whereClause[key] = flt.value;
      } else if (flt.operator === 'NOT_EQUALS') {
        whereClause[key] = { not: flt.value };
      } else if (flt.operator === 'CONTAINS') {
        whereClause[key] = { contains: flt.value };
      } else if (flt.operator === 'STARTS_WITH') {
        whereClause[key] = { startsWith: flt.value };
      } else if (flt.operator === 'GREATER_THAN') {
        whereClause[key] = { gt: flt.value };
      } else if (flt.operator === 'LESS_THAN') {
        whereClause[key] = { lt: flt.value };
      } else if (flt.operator === 'BETWEEN' && Array.isArray(flt.value) && flt.value.length === 2) {
        whereClause[key] = { gte: flt.value[0], lte: flt.value[1] };
      } else if (flt.operator === 'IN' && Array.isArray(flt.value)) {
        whereClause[key] = { in: flt.value };
      } else if (flt.operator === 'IS_NULL') {
        whereClause[key] = null;
      } else if (flt.operator === 'IS_NOT_NULL') {
        whereClause[key] = { not: null };
      }
    }
  }

  // 4. Build Sort Order
  const orderBy: any[] = [];
  if (params.sorts && params.sorts.length > 0) {
    for (const s of params.sorts) {
      if (fieldMap.has(s.fieldKey)) {
        const fDef = fieldMap.get(s.fieldKey)!;
        orderBy.push({ [fDef.sourceField]: s.direction.toLowerCase() });
      }
    }
  } else {
    orderBy.push({ createdAt: 'desc' });
  }

  // 5. Query Execution
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const skip = (page - 1) * pageSize;

  let rows: any[] = [];
  let totalCount = 0;

  if (params.datasetCode === 'STUDENTS') {
    totalCount = await db.student.count({ where: whereClause });
    rows = await db.student.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  } else if (params.datasetCode === 'ENROLLMENTS') {
    totalCount = await db.enrollment.count({ where: whereClause });
    rows = await db.enrollment.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  } else if (params.datasetCode === 'FEES') {
    totalCount = await db.invoice.count({ where: whereClause });
    rows = await db.invoice.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  } else if (params.datasetCode === 'EMPLOYEES') {
    totalCount = await db.employee.count({ where: whereClause });
    rows = await db.employee.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  } else if (params.datasetCode === 'EXAM_RESULTS') {
    totalCount = await db.marksEntry.count({ where: whereClause });
    rows = await db.marksEntry.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  } else if (params.datasetCode === 'PLATFORM_TENANTS') {
    totalCount = await db.tenant.count({ where: whereClause });
    rows = await db.tenant.findMany({
      where: whereClause,
      orderBy,
      skip: params.bypassPagination ? undefined : skip,
      take: params.bypassPagination ? undefined : pageSize,
    });
  }

  // 6. Format Columns and Apply PII Masking
  const formattedRows = rows.map((row) => {
    const formatted: Record<string, any> = {};
    for (const col of requestedColumns) {
      const fDef = fieldMap.get(col)!;
      let val = row[fDef.sourceField];

      // Format Date
      if (val instanceof Date) {
        val = val.toISOString();
      }

      // PII Masking
      if (fDef.piiMaskingType && fDef.piiMaskingType !== 'NONE') {
        const canViewUnmasked = actor.isPlatformAdmin || actor.role === 'OWNER' || actor.role === 'PRINCIPAL';
        if (!canViewUnmasked) {
          val = maskPiiValue(val, fDef.piiMaskingType);
        }
      }

      formatted[col] = val;
    }
    return formatted;
  });

  // 7. Calculate Aggregates if requested
  const computedAggregates: Record<string, number> = {};
  if (params.aggregates && params.aggregates.length > 0) {
    for (const agg of params.aggregates) {
      if (fieldMap.has(agg.fieldKey)) {
        const values = formattedRows.map((r) => Number(r[agg.fieldKey])).filter((n) => !isNaN(n));
        if (agg.aggregateType === 'COUNT') {
          computedAggregates[`${agg.fieldKey}_count`] = values.length;
        } else if (agg.aggregateType === 'SUM') {
          computedAggregates[`${agg.fieldKey}_sum`] = values.reduce((sum, v) => sum + v, 0);
        } else if (agg.aggregateType === 'AVG') {
          computedAggregates[`${agg.fieldKey}_avg`] = values.length > 0
            ? Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100
            : 0;
        } else if (agg.aggregateType === 'MIN') {
          computedAggregates[`${agg.fieldKey}_min`] = values.length > 0 ? Math.min(...values) : 0;
        } else if (agg.aggregateType === 'MAX') {
          computedAggregates[`${agg.fieldKey}_max`] = values.length > 0 ? Math.max(...values) : 0;
        }
      }
    }
  }

  return {
    dataset: { code: dataset.code, name: dataset.name },
    columns: requestedColumns.map((col) => {
      const f = fieldMap.get(col)!;
      return { key: f.fieldKey, label: f.label, dataType: f.dataType };
    }),
    rows: formattedRows,
    aggregates: computedAggregates,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}
