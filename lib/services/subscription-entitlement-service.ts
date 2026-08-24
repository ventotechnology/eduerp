import { db } from '../db';
import { AppError } from '../errors/app-error';

export type LimitMetric = 'STUDENTS' | 'CAMPUSES' | 'TEACHERS' | 'USERS' | 'STORAGE_GB' | 'SMS' | 'MONTHLY_EMAILS';

export interface LimitCheckResult {
  allowed: boolean;
  metric: LimitMetric;
  currentUsage: number;
  maxLimit: number;
  planName: string;
  isGracePeriod?: boolean;
  message?: string;
}

export interface DowngradeCheckResult {
  allowed: boolean;
  blockers: {
    metric: string;
    current: number;
    targetLimit: number;
    message: string;
  }[];
}

const FEATURE_KEY_ALIASES: Record<string, string[]> = {
  ATTENDANCE: ['ATTENDANCE', 'SIS', 'ACADEMICS'],
  SIS: ['SIS', 'STUDENTS'],
  ACADEMICS: ['ACADEMICS'],
  EXAMINATION: ['EXAMINATION', 'EXAMS'],
  PAYROLL: ['PAYROLL', 'HR_PAYROLL', 'FINANCE', 'HR'],
  HR: ['HR', 'HR_PAYROLL', 'TEACHERS'],
  LMS: ['LMS', 'LMS_COMPLETE'],
  HIFZ: ['HIFZ', 'HIFZ_TRACKING'],
  UNIVERSITY: ['UNIVERSITY', 'UNIVERSITY_CREDIT', 'FACULTY_PORTAL'],
  FACILITIES: ['FACILITIES', 'TRANSPORT', 'HOSTEL', 'LIBRARY', 'INVENTORY'],
  CUSTOM_REPORTS: ['CUSTOM_REPORTS', 'REPORTING'],
  ADVANCED_FINANCE: ['ADVANCED_FINANCE', 'FINANCE'],
  GOV_COMPLIANCE: ['GOV_COMPLIANCE', 'REGULATORY'],
  API_ACCESS: ['API_ACCESS', 'REST_API', 'API'],
  CUSTOM_DOMAIN: ['CUSTOM_DOMAIN'],
  WHITE_LABEL: ['WHITE_LABEL'],
  PRIORITY_SUPPORT: ['PRIORITY_SUPPORT']
};

const CORE_TIER_FEATURES = new Set(['SIS', 'ATTENDANCE', 'ACADEMICS', 'EXAMINATION', 'PORTAL', 'RBAC', 'REPORTS']);
const STANDARD_TIER_FEATURES = new Set([...CORE_TIER_FEATURES, 'ADMISSION', 'FINANCE', 'HR', 'HR_PAYROLL', 'PAYROLL', 'FACILITIES', 'CUSTOM_REPORTS']);
const PRO_TIER_FEATURES = new Set([...STANDARD_TIER_FEATURES, 'MULTI_CAMPUS', 'LMS', 'LMS_COMPLETE', 'GOV_COMPLIANCE', 'ADVANCED_FINANCE', 'FACULTY_PORTAL', 'CUSTOM_DOMAIN', 'PRIORITY_SUPPORT']);

export class SubscriptionEntitlementService {
  /**
   * Retrieves the active subscription and plan for a given tenant
   */
  static async getTenantSubscription(tenantId: string) {
    const sub = await db.subscription.findFirst({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'GRACE_PERIOD'] }
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

      case 'MONTHLY_EMAILS':
        maxLimit = plan.includedEmails || 5000;
        const emailRecord = await db.usageRecord.findFirst({
          where: { tenantId, metric: 'EMAILS_SENT' }
        });
        currentUsage = emailRecord ? emailRecord.quantity : 0;
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
   * Checks if a specific feature is enabled in the tenant's current plan or active feature override
   */
  static async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.isDemoTenant) return true; // Demo tenants have full functional access for evaluation

    // 1. Check Super Admin temporary Feature Overrides
    const override = await db.tenantFeatureOverride.findFirst({
      where: {
        tenantId,
        featureKey: { in: FEATURE_KEY_ALIASES[featureKey] || [featureKey] },
        isEnabled: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });

    if (override) return true;

    // 2. Check Active Subscription Plan
    const sub = await this.getTenantSubscription(tenantId);
    if (!sub) return false;

    // Check Plan Boolean flags
    if ((featureKey === 'API_ACCESS' || featureKey === 'REST_API') && sub.plan.apiAccess) return true;
    if (featureKey === 'CUSTOM_DOMAIN' && sub.plan.customDomain) return true;
    if (featureKey === 'WHITE_LABEL' && sub.plan.whiteLabel) return true;
    if (featureKey === 'PRIORITY_SUPPORT' && sub.plan.prioritySupport) return true;

    // Check Plan Tier Hierarchy
    const tier = (sub.plan.tier || sub.plan.code || '').toUpperCase();
    if (tier === 'ENTERPRISE') return true;

    const normKey = featureKey.toUpperCase();
    if (CORE_TIER_FEATURES.has(normKey)) return true;
    if (['STANDARD', 'PROFESSIONAL'].includes(tier) && STANDARD_TIER_FEATURES.has(normKey)) return true;
    if (tier === 'PROFESSIONAL' && PRO_TIER_FEATURES.has(normKey)) return true;

    // Check PlanFeature records with alias resolution
    const searchKeys = new Set(FEATURE_KEY_ALIASES[featureKey] || [featureKey]);
    return sub.plan.features.some(f => searchKeys.has(f.featureKey) && f.isEnabled);
  }

  /**
   * Validates if a tenant can safely downgrade to a lower plan without exceeding limits
   */
  static async checkDowngradeEligibility(tenantId: string, targetPlanId: string): Promise<DowngradeCheckResult> {
    const targetPlan = await db.subscriptionPlan.findUnique({
      where: { id: targetPlanId }
    });

    if (!targetPlan) {
      throw AppError.notFound(`Target plan ${targetPlanId} not found.`);
    }

    const [studentsCount, campusesCount, teachersCount, usersCount] = await Promise.all([
      db.student.count({ where: { campus: { institution: { tenantId } } } }),
      db.campus.count({ where: { institution: { tenantId } } }),
      db.teacher.count({ where: { employee: { campus: { institution: { tenantId } } } } }),
      db.user.count({ where: { tenantId } })
    ]);

    const blockers: DowngradeCheckResult['blockers'] = [];

    if (studentsCount > targetPlan.maxStudents) {
      blockers.push({
        metric: 'STUDENTS',
        current: studentsCount,
        targetLimit: targetPlan.maxStudents,
        message: `Your institution currently has ${studentsCount} students, but the ${targetPlan.name} plan allows a maximum of ${targetPlan.maxStudents} students.`
      });
    }

    if (campusesCount > targetPlan.maxCampuses) {
      blockers.push({
        metric: 'CAMPUSES',
        current: campusesCount,
        targetLimit: targetPlan.maxCampuses,
        message: `Your institution currently has ${campusesCount} campuses, but the ${targetPlan.name} plan allows a maximum of ${targetPlan.maxCampuses} campus(es).`
      });
    }

    if (teachersCount > targetPlan.maxTeachers) {
      blockers.push({
        metric: 'TEACHERS',
        current: teachersCount,
        targetLimit: targetPlan.maxTeachers,
        message: `Your institution currently has ${teachersCount} teachers, but the ${targetPlan.name} plan allows a maximum of ${targetPlan.maxTeachers} teachers.`
      });
    }

    if (usersCount > targetPlan.maxUsers) {
      blockers.push({
        metric: 'USERS',
        current: usersCount,
        targetLimit: targetPlan.maxUsers,
        message: `Your institution currently has ${usersCount} users, but the ${targetPlan.name} plan allows a maximum of ${targetPlan.maxUsers} users.`
      });
    }

    return {
      allowed: blockers.length === 0,
      blockers
    };
  }

  /**
   * Grants a temporary feature override for pilot or support purposes
   */
  static async setFeatureOverride(
    tenantId: string,
    featureKey: string,
    isEnabled: boolean,
    expiresAt?: Date | null,
    reason?: string,
    grantedBy?: string
  ) {
    const override = await db.tenantFeatureOverride.upsert({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey
        }
      },
      create: {
        tenantId,
        featureKey,
        isEnabled,
        expiresAt: expiresAt || null,
        reason: reason || null,
        grantedBy: grantedBy || 'Super Admin'
      },
      update: {
        isEnabled,
        expiresAt: expiresAt || null,
        reason: reason || null,
        grantedBy: grantedBy || 'Super Admin',
        updatedAt: new Date()
      }
    });

    await db.auditLog.create({
      data: {
        tenantId,
        userName: grantedBy || 'Super Admin',
        userRole: 'PLATFORM_SUPER_ADMIN',
        action: 'FEATURE_OVERRIDE_UPDATED',
        resourceType: 'TenantFeatureOverride',
        resourceId: override.id,
        newState: JSON.stringify({ featureKey, isEnabled, expiresAt, reason })
      }
    });

    return override;
  }

  /**
   * Removes a feature override
   */
  static async removeFeatureOverride(tenantId: string, featureKey: string, removedBy?: string) {
    await db.tenantFeatureOverride.deleteMany({
      where: { tenantId, featureKey }
    });

    await db.auditLog.create({
      data: {
        tenantId,
        userName: removedBy || 'Super Admin',
        userRole: 'PLATFORM_SUPER_ADMIN',
        action: 'FEATURE_OVERRIDE_REMOVED',
        resourceType: 'TenantFeatureOverride',
        resourceId: `${tenantId}:${featureKey}`,
        newState: JSON.stringify({ featureKey, removed: true })
      }
    });
  }

  /**
   * Returns comprehensive billing status and metrics for tenant customer billing portal
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
        },
        featureOverrides: {
          where: {
            isEnabled: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          }
        }
      }
    });

    const [studentsCount, teachersCount, usersCount, campusesCount] = await Promise.all([
      db.student.count({ where: { campus: { institution: { tenantId } }, status: 'ACTIVE' as any } }),
      db.teacher.count({ where: { employee: { campus: { institution: { tenantId } } } } }),
      db.user.count({ where: { tenantId, status: 'ACTIVE' as any } }),
      db.campus.count({ where: { institution: { tenantId } } })
    ]);

    const invoices = await db.subscriptionInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const availablePlansRaw = await db.subscriptionPlan.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        features: {
          where: { isEnabled: true }
        }
      }
    });

    // Normalize plan features and calculate annual discount percent directly from DB prices
    const availablePlans = availablePlansRaw.map((p) => {
      const calculatedDiscount = p.monthlyPrice > 0 && p.annualPrice > 0
        ? Math.max(0, Math.round(((p.monthlyPrice * 12 - p.annualPrice) / (p.monthlyPrice * 12)) * 100))
        : 0;

      return {
        ...p,
        annualDiscountPercent: p.annualDiscount || calculatedDiscount,
        featureList: (p.features || []).map((f) => f.name || f.description || f.featureKey)
      };
    });

    // Calculate real SMS quota
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const smsUsage = await db.smsUsageLedger.aggregate({
      where: {
        tenantId,
        billingPeriod: currentPeriod,
        source: { in: ['INCLUDED_QUOTA', 'ADDON_CREDIT', 'BONUS_CREDIT'] }
      },
      _sum: { quantity: true }
    });

    const smsConfig = await db.tenantSmsConfig.findUnique({ where: { tenantId } });
    const includedSms = sub?.plan?.includedSms ?? 0;
    const extraSms = (smsConfig?.purchasedSmsCredits || 0) + (smsConfig?.bonusSmsCredits || 0);
    const totalSmsAvailable = includedSms + extraSms;
    const usedSmsThisPeriod = smsUsage._sum.quantity || 0;

    const smsPackages = await db.smsAddonPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    return {
      tenant,
      subscription: sub ? {
        ...sub,
        status: sub.status,
        plan: sub.plan ? {
          ...sub.plan,
          featureList: (sub.plan.features || []).map((f) => f.name || f.description || f.featureKey)
        } : null
      } : null,
      usage: {
        students: { current: studentsCount, max: sub?.plan.maxStudents ?? null },
        campuses: { current: campusesCount, max: sub?.plan.maxCampuses ?? null },
        teachers: { current: teachersCount, max: sub?.plan.maxTeachers ?? null },
        users: { current: usersCount, max: sub?.plan.maxUsers ?? null },
        storageGb: { current: 0, max: sub?.plan.maxStorageGb ?? null },
        sms: {
          current: usedSmsThisPeriod,
          max: totalSmsAvailable,
          remaining: Math.max(0, totalSmsAvailable - usedSmsThisPeriod),
          isUnlimited: sub?.plan?.includedSms === -1
        }
      },
      invoices,
      availablePlans,
      smsPackages
    };
  }
}
