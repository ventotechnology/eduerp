import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { SessionUser } from '@/lib/auth/types';
import { DataQualityRuleCreateSchema } from '@/lib/validations/schemas';

export async function createDataQualityRule(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = DataQualityRuleCreateSchema.parse(rawData);

  return db.dataQualityRule.create({
    data: {
      institutionId: tenant.institutionId,
      datasetCode: validated.datasetCode,
      ruleCode: validated.ruleCode,
      title: validated.title,
      severity: validated.severity,
      checkType: validated.checkType,
      ruleConfigJson: validated.ruleConfigJson,
      isActive: true,
    },
  });
}

/**
 * Runs enterprise data quality scan across institutional datasets
 */
export async function evaluateDataQualityRules(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const institutionId = tenant.institutionId;

  // Clear previous issues
  await db.dataQualityIssue.deleteMany({ where: { institutionId } });

  const issues: Array<{ datasetCode: string; recordId: string; recordTitle: string; severity: string; details: string }> = [];

  // Check 1: Students missing mandatory contact/guardian details
  const students = await db.student.findMany({
    where: { campus: { institutionId }, status: 'ACTIVE' },
  });

  for (const s of students) {
    if (!s.phone && !s.email) {
      issues.push({
        datasetCode: 'STUDENTS',
        recordId: s.id,
        recordTitle: `${s.firstName} ${s.lastName} (${s.studentIdNumber})`,
        severity: 'ERROR',
        details: 'Missing all primary student contact information (both phone and email null).',
      });
    }
  }

  // Check 2: Unbalanced invoices (total != paid + balance + waiver)
  const invoices = await db.invoice.findMany({
    where: { student: { campus: { institutionId } } },
  });

  for (const inv of invoices) {
    const calculatedSum = inv.paidAmount + inv.dueAmount + inv.waiverAmount;
    if (Math.abs(calculatedSum - inv.totalAmount) > 0.01) {
      issues.push({
        datasetCode: 'FEES',
        recordId: inv.id,
        recordTitle: `Invoice #${inv.invoiceNumber}`,
        severity: 'ERROR',
        details: `Invoice balance mismatch: Total (${inv.totalAmount}) != Paid (${inv.paidAmount}) + Balance (${inv.dueAmount}) + Waiver (${inv.waiverAmount}).`,
      });
    }
  }

  return {
    totalScanned: students.length + invoices.length,
    issuesFound: issues.length,
    issues,
    scannedAt: new Date().toISOString(),
  };
}

export async function getDataQualityDashboard(tenantIdentifier: string) {
  const scanResult = await evaluateDataQualityRules(tenantIdentifier);

  const errorsCount = scanResult.issues.filter((i) => i.severity === 'ERROR').length;
  const warningsCount = scanResult.issues.filter((i) => i.severity === 'WARNING').length;
  const cleanlinessPercent = scanResult.totalScanned > 0
    ? Math.round(((scanResult.totalScanned - scanResult.issuesFound) / scanResult.totalScanned) * 100)
    : 100;

  return {
    metrics: {
      cleanlinessScorePercent: Math.max(0, cleanlinessPercent),
      totalRecordsAudited: scanResult.totalScanned,
      errorsCount,
      warningsCount,
    },
    issues: scanResult.issues,
  };
}
