import { db } from '@/lib/db';

export type LimitMetric = 'STUDENTS' | 'CAMPUSES' | 'TEACHERS' | 'USERS' | 'STORAGE_GB' | 'SMS';

export interface LimitCheckResult {
  allowed: boolean;
  metric: LimitMetric;
  currentUsage: number;
  maxLimit: number;
  planName: string;
  isGracePeriod?: boolean;
  message?: string;
}

export class SubscriptionEntitlementService {
  /**
   * Retrieves the active subscription and plan for a given tenant
   */
  static async getTenantSubscription(tenantId: string) {
    const sub = await db.subscription.findFirst({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }
      },
      include: {
        plan: {
          include: {
            features: {
              where: { isEnabled: true }
            }
          }
        },
        tenant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return sub;
  }

  /**
   * Checks whether an action that consumes an entitlement is allowed under the tenant's current plan
   */
  static async checkLimit(tenantId: string, metric: LimitMetric): Promise<LimitCheckResult> {
    const sub = await this.getTenantSubscription(tenantId);

    // If no subscription found, check if tenant is active demo
    if (!sub) {
      const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
      if (tenant?.isDemoTenant) {
        return {
          allowed: true,
          metric,
          currentUsage: 0,
          maxLimit: 10000,
          planName: 'Demo Plan'
        };
      }

      return {
        allowed: false,
        metric,
        currentUsage: 0,
        maxLimit: 0,
        planName: 'None',
        message: 'Your institution does not have an active EduERP subscription. Please subscribe to continue.'
      };
    }

    const now = new Date();
    const plan = sub.plan;

    // Check expiration and grace period
    if (sub.currentPeriodEnd < now) {
      const settings = await db.platformBillingSettings.findFirst();
      const graceDays = settings?.gracePeriodDays ?? 3;
      const graceEnd = new Date(sub.currentPeriodEnd.getTime() + graceDays * 24 * 60 * 60 * 1000);

      if (now > graceEnd) {
        return {
          allowed: false,
          metric,
          currentUsage: 0,
          maxLimit: 0,
          planName: plan.name,
          message: `Your ${plan.name} subscription expired on ${sub.currentPeriodEnd.toLocaleDateString()}. Please renew your subscription to perform this action.`
        };
      }
    }

    let currentUsage = 0;
    let maxLimit = 0;

    switch (metric) {
      case 'STUDENTS':
        maxLimit = plan.maxStudents;
        currentUsage = await db.student.count({
          where: {
            campus: {
              institution: {
                tenantId
              }
            }
          }
        });
        break;

      case 'CAMPUSES':
        maxLimit = plan.maxCampuses;
        currentUsage = await db.campus.count({
          where: {
            institution: {
              tenantId
            }
          }
        });
        break;

      case 'TEACHERS':
        maxLimit = plan.maxTeachers;
        currentUsage = await db.teacher.count({
          where: {
            employee: {
              campus: {
                institution: {
                  tenantId
                }
              }
            }
          }
        });
        break;

      case 'USERS':
        maxLimit = plan.maxUsers;
        currentUsage = await db.user.count({
          where: {
            tenantId
          }
        });
        break;

      case 'STORAGE_GB':
        maxLimit = plan.maxStorageGb;
        const storageRecord = await db.usageRecord.findFirst({
          where: { tenantId, metric: 'STORAGE_BYTES' }
        });
        currentUsage = storageRecord ? storageRecord.quantity / (1024 * 1024 * 1024) : 0;
        break;

      case 'SMS':
        maxLimit = plan.includedSms;
        const smsRecord = await db.usageRecord.findFirst({
          where: { tenantId, metric: 'SMS_SENT' }
        });
        currentUsage = smsRecord ? smsRecord.quantity : 0;
        break;
    }

    const allowed = currentUsage < maxLimit;

    return {
      allowed,
      metric,
      currentUsage,
      maxLimit,
      planName: plan.name,
      message: allowed
        ? undefined
        : `Limit reached: Your ${plan.name} plan allows up to ${maxLimit} ${metric.toLowerCase()} (current: ${currentUsage}). Please upgrade your subscription to add more.`
    };
  }

  /**
   * Checks if a specific feature is enabled in the tenant's current plan
   */
  static async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const sub = await this.getTenantSubscription(tenantId);
    if (!sub) return false;

    // Check plan flags
    if (featureKey === 'API_ACCESS' && sub.plan.apiAccess) return true;
    if (featureKey === 'CUSTOM_DOMAIN' && sub.plan.customDomain) return true;
    if (featureKey === 'WHITE_LABEL' && sub.plan.whiteLabel) return true;
    if (featureKey === 'PRIORITY_SUPPORT' && sub.plan.prioritySupport) return true;

    // Check PlanFeature entries
    return sub.plan.features.some(f => f.featureKey === featureKey && f.isEnabled);
  }

  /**
   * Returns comprehensive billing status and metrics for the tenant customer billing portal
   */
  static async getTenantBillingSummary(tenantId: string) {
    const sub = await this.getTenantSubscription(tenantId);
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        institution: {
          include: {
            campuses: true
          }
        }
      }
    });

    const [studentsCount, teachersCount, usersCount, campusesCount] = await Promise.all([
      db.student.count({ where: { campus: { institution: { tenantId } } } }),
      db.teacher.count({ where: { employee: { campus: { institution: { tenantId } } } } }),
      db.user.count({ where: { tenantId } }),
      db.campus.count({ where: { institution: { tenantId } } })
    ]);

    const invoices = await db.subscriptionInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const availablePlans = await db.subscriptionPlan.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    return {
      tenant,
      subscription: sub,
      usage: {
        students: { current: studentsCount, max: sub?.plan.maxStudents ?? 500 },
        campuses: { current: campusesCount, max: sub?.plan.maxCampuses ?? 1 },
        teachers: { current: teachersCount, max: sub?.plan.maxTeachers ?? 50 },
        users: { current: usersCount, max: sub?.plan.maxUsers ?? 50 },
        storageGb: { current: 1.2, max: sub?.plan.maxStorageGb ?? 20 },
        sms: { current: 340, max: sub?.plan.includedSms ?? 1000 }
      },
      invoices,
      availablePlans
    };
  }
}
