import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { SessionUser } from '@/lib/auth/types';
import { DashboardDefinitionCreateSchema } from '@/lib/validations/schemas';

export async function createDashboardDefinition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = DashboardDefinitionCreateSchema.parse(rawData);

  return db.dashboardDefinition.create({
    data: {
      institutionId: tenant.institutionId,
      code: validated.code,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      isStandard: validated.isStandard,
      createdByUserId: actor.id,
      widgets: {
        create: validated.widgets.map((w) => ({
          title: w.title,
          widgetType: w.widgetType,
          datasetCode: w.datasetCode,
          reportDefinitionId: w.reportDefinitionId,
          queryConfigJson: w.queryConfigJson,
          gridPositionJson: w.gridPositionJson,
          refreshIntervalSec: w.refreshIntervalSec,
        })),
      },
    },
    include: { widgets: true },
  });
}

export async function getDashboardDefinitions(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.dashboardDefinition.findMany({
    where: { OR: [{ institutionId: tenant.institutionId }, { isStandard: true }] },
    include: { widgets: true },
  });
}

/**
 * Computes live, database-backed executive KPI metrics for management dashboards
 */
export async function getExecutiveDashboardKpis(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const institutionId = tenant.institutionId;

  // 1. Student Metrics
  const totalStudents = await db.student.count({
    where: { campus: { institutionId }, status: 'ACTIVE' },
  });

  const totalAdmissions = await db.admissionApplication.count({
    where: { institutionId },
  });

  // 2. Academic & Exam Metrics
  const totalMarksEntries = await db.marksEntry.count({
    where: { exam: { institutionId } },
  });
  const passedMarksEntries = await db.marksEntry.count({
    where: { exam: { institutionId }, status: 'PASS' },
  });
  const examPassRatePercent = totalMarksEntries > 0
    ? Math.round((passedMarksEntries / totalMarksEntries) * 100)
    : 100;

  // 3. Finance Metrics
  const invoices = await db.invoice.findMany({
    where: { student: { campus: { institutionId } } },
    select: { totalAmount: true, paidAmount: true, dueAmount: true, waiverAmount: true },
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const totalWaivers = invoices.reduce((sum, inv) => sum + inv.waiverAmount, 0);

  const collectionRatePercent = totalInvoiced > 0
    ? Math.round((totalCollected / totalInvoiced) * 100)
    : 0;

  // 4. HR Metrics
  const totalEmployees = await db.employee.count({
    where: { campus: { institutionId }, status: 'ACTIVE' },
  });

  const totalCampuses = await db.campus.count({
    where: { institutionId },
  });

  return {
    institution: {
      id: institutionId,
      name: tenant.name,
      institutionType: tenant.institutionType,
    },
    students: {
      totalActiveStudents: totalStudents,
      totalAdmissionsApplications: totalAdmissions,
    },
    academics: {
      totalExamsEvaluated: totalMarksEntries,
      examPassRatePercent,
    },
    finance: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalWaivers,
      collectionRatePercent,
    },
    hr: {
      totalActiveEmployees: totalEmployees,
      totalCampuses,
    },
    generatedAt: new Date().toISOString(),
  };
}
