import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { SessionUser } from '@/lib/auth/types';
import {
  getGovernedDatasets,
  getDatasetByCode,
} from '@/lib/services/report-registry-service';
import {
  executeGovernedReportQuery,
} from '@/lib/services/report-query-engine';
import {
  createReportDefinition,
  updateReportDefinition,
  getReportDefinitions,
  getReportDefinitionById,
  duplicateReportDefinition,
  saveReportSnapshot,
} from '@/lib/services/custom-report-service';
import {
  exportReportToCsv,
  exportReportToXlsx,
  exportReportToPdfSummary,
} from '@/lib/services/report-export-service';
import {
  createDashboardDefinition,
  getDashboardDefinitions,
  getExecutiveDashboardKpis,
} from '@/lib/services/dashboard-service';
import {
  getRegulatoryAgencies,
  createRegulatoryTemplate,
  getRegulatoryTemplates,
  startRegulatoryReportRun,
  validateRegulatoryReportRun,
  approveRegulatoryReportRun,
  recordRegulatorySubmission,
} from '@/lib/services/regulatory-engine-service';
import {
  getDataQualityDashboard,
  evaluateDataQualityRules,
} from '@/lib/services/data-governance-service';
import {
  getPlatformSuperAdminAnalytics,
} from '@/lib/services/platform-reporting-service';

function getActor(req: NextRequest, tenantId: string): SessionUser {
  return {
    id: req.headers.get('x-user-id') || 'demo-report-actor-id',
    name: req.headers.get('x-user-name') || 'Demo Compliance Officer',
    email: req.headers.get('x-user-email') || 'compliance@eduerp.us',
    role: (req.headers.get('x-user-role') as any) || 'PRINCIPAL',
    tenantId,
    isPlatformAdmin: req.headers.get('x-is-platform-admin') === 'true',
    status: 'ACTIVE' as any,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenant') || 'dhaka-ideal-school';
    const action = searchParams.get('action') || 'DATASETS';
    const reportId = searchParams.get('reportId');
    const datasetCode = searchParams.get('datasetCode');
    const agencyCode = searchParams.get('agencyCode');
    const reportRunId = searchParams.get('reportRunId');

    const actor = getActor(req, tenantSlug);

    switch (action) {
      case 'DATASETS': {
        const datasets = await getGovernedDatasets(actor.isPlatformAdmin);
        return NextResponse.json({ success: true, data: datasets });
      }
      case 'DATASET_DETAIL': {
        if (!datasetCode) return NextResponse.json({ success: false, error: 'datasetCode required' }, { status: 400 });
        const dataset = await getDatasetByCode(datasetCode);
        return NextResponse.json({ success: true, data: dataset });
      }
      case 'REPORTS_LIST': {
        const list = await getReportDefinitions(tenantSlug, actor);
        return NextResponse.json({ success: true, data: list });
      }
      case 'REPORT_DETAIL': {
        if (!reportId) return NextResponse.json({ success: false, error: 'reportId required' }, { status: 400 });
        const detail = await getReportDefinitionById(tenantSlug, reportId, actor);
        return NextResponse.json({ success: true, data: detail });
      }
      case 'EXECUTIVE_KPIS': {
        const kpis = await getExecutiveDashboardKpis(tenantSlug);
        return NextResponse.json({ success: true, data: kpis });
      }
      case 'DASHBOARDS': {
        const dashboards = await getDashboardDefinitions(tenantSlug);
        return NextResponse.json({ success: true, data: dashboards });
      }
      case 'REGULATORY_AGENCIES': {
        const agencies = await getRegulatoryAgencies();
        return NextResponse.json({ success: true, data: agencies });
      }
      case 'REGULATORY_TEMPLATES': {
        const templates = await getRegulatoryTemplates({ agencyCode: agencyCode || undefined });
        return NextResponse.json({ success: true, data: templates });
      }
      case 'DATA_QUALITY_DASHBOARD': {
        const dq = await getDataQualityDashboard(tenantSlug);
        return NextResponse.json({ success: true, data: dq });
      }
      case 'PLATFORM_ANALYTICS': {
        const platformData = await getPlatformSuperAdminAnalytics(actor);
        return NextResponse.json({ success: true, data: platformData });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown reporting query action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Report fetch error' }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenant') || 'dhaka-ideal-school';
    const action = searchParams.get('action') || 'EXECUTE_QUERY';

    const actor = getActor(req, tenantSlug);
    const body = await req.json();

    let result;
    switch (action) {
      case 'EXECUTE_QUERY':
        result = await executeGovernedReportQuery(tenantSlug, body, actor);
        break;
      case 'CREATE_REPORT':
        result = await createReportDefinition(tenantSlug, body, actor);
        break;
      case 'UPDATE_REPORT':
        result = await updateReportDefinition(tenantSlug, body, actor);
        break;
      case 'DUPLICATE_REPORT':
        result = await duplicateReportDefinition(tenantSlug, body.sourceReportId, body.newName, actor);
        break;
      case 'EXPORT_CSV':
        result = await exportReportToCsv(tenantSlug, body, actor);
        break;
      case 'EXPORT_XLSX':
        result = await exportReportToXlsx(tenantSlug, body, actor);
        break;
      case 'EXPORT_PDF':
        result = await exportReportToPdfSummary(tenantSlug, body, actor);
        break;
      case 'SAVE_SNAPSHOT':
        result = await saveReportSnapshot(tenantSlug, body, actor);
        break;
      case 'CREATE_DASHBOARD':
        result = await createDashboardDefinition(tenantSlug, body, actor);
        break;
      case 'CREATE_REGULATORY_TEMPLATE':
        result = await createRegulatoryTemplate(body, actor);
        break;
      case 'START_REGULATORY_RUN':
        result = await startRegulatoryReportRun(tenantSlug, body, actor);
        break;
      case 'VALIDATE_REGULATORY_RUN':
        result = await validateRegulatoryReportRun(tenantSlug, body.reportRunId, actor);
        break;
      case 'APPROVE_REGULATORY_RUN':
        result = await approveRegulatoryReportRun(tenantSlug, body, actor);
        break;
      case 'SUBMIT_REGULATORY_RECORD':
        result = await recordRegulatorySubmission(tenantSlug, body, actor);
        break;
      case 'EVALUATE_DATA_QUALITY':
        result = await evaluateDataQualityRules(tenantSlug);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Unknown reporting action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Report execution error' }, { status: err.statusCode || 500 });
  }
}
