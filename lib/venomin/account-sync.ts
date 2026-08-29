import { db } from '@/lib/db';
import { AccountSyncData } from './types';
import { TenantProvisioningStatus } from '@prisma/client';

/**
 * Returns privacy-safe aggregated educational telemetry and account metrics for Venomin Sync
 * CRITICAL MINOR & STUDENT PRIVACY GUARANTEE: Zero student names, emails, phone numbers,
 * guardian details, birth dates, exam grades, attendance, or salaries are exposed.
 */
export async function getAccountSyncData(
  venominCustomerId: string
): Promise<AccountSyncData | null> {
  const link = await db.venominIdentityLink.findUnique({
    where: { walletmixCustomerId: venominCustomerId },
    include: {
      tenant: true,
      institution: true,
    },
  });

  if (!link || !link.tenant || !link.institution) {
    return null;
  }

  const tenant = link.tenant;
  const inst = link.institution;

  // Query aggregate numerical counters only — Never query student/minor identities
  const [
    campusesCount,
    studentsCount,
    teachersCount,
    staffCount,
    classesCount,
    sectionsCount,
    programsCount,
    departmentsCount,
  ] = await Promise.all([
    db.campus.count({ where: { institutionId: inst.id } }).catch(() => 1),
    db.student.count({ where: { campus: { institutionId: inst.id } } }).catch(() => 0),
    db.user.count({ where: { tenantId: tenant.id, role: { in: ['TEACHER', 'FACULTY'] } } }).catch(() => 0),
    db.employee.count({ where: { campus: { institutionId: inst.id } } }).catch(() => 1),
    db.class.count({ where: { institutionId: inst.id } }).catch(() => 0),
    db.section.count({ where: { class: { institutionId: inst.id } } }).catch(() => 0),
    db.curriculum.count({ where: { institutionId: inst.id } }).catch(() => 0),
    db.department.count({ where: { institutionId: inst.id } }).catch(() => 0),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduerp.us';

  return {
    walletmixCustomerId: venominCustomerId,
    tenantId: tenant.id,
    institutionId: inst.id,
    institutionName: inst.name,
    institutionType: tenant.institutionType,
    status:
      tenant.status === TenantProvisioningStatus.SUSPENDED
        ? 'SUSPENDED'
        : tenant.status === TenantProvisioningStatus.ACTIVE_TRIAL
        ? 'TRIAL'
        : 'ACTIVE',
    planCode: tenant.subscriptionTier,
    subscriptionStatus: tenant.status,
    launchUrl: `${appUrl}/${tenant.slug}/dashboard`,
    usageSummary: {
      campusesCount: Math.max(campusesCount, 1),
      studentsCount,
      teachersCount,
      staffCount: Math.max(staffCount, 1),
      classesCount,
      sectionsCount,
      programsCount,
      departmentsCount,
    },
  };
}
