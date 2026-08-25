import { db } from '../db';
import { SubscriptionTier } from '@prisma/client';

export interface PlanFeatureDTO {
  featureKey: string;
  name?: string;
  description?: string;
  isEnabled: boolean;
  limitValue?: number;
}

export interface SubscriptionPlanInput {
  code: string;
  name: string;
  slug: string;
  tier?: SubscriptionTier;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency?: string;
  monthlyDiscount?: number;
  annualDiscount?: number;
  trialDays?: number;
  setupFee?: number;
  maxStudents: number;
  maxCampuses: number;
  maxUsers: number;
  maxTeachers: number;
  maxStorageGb: number;
  includedSms: number;
  includedEmails?: number;
  apiAccess?: boolean;
  customDomain?: boolean;
  whiteLabel?: boolean;
  prioritySupport?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  badge?: string;
  buttonText?: string;
  features?: PlanFeatureDTO[];
}

export const INITIAL_SAAS_PLANS: SubscriptionPlanInput[] = [
  {
    code: 'STARTER',
    name: 'Starter',
    slug: 'starter',
    tier: SubscriptionTier.STARTER,
    description: 'Essential operating system for small schools, madrasahs, and coaching institutions.',
    monthlyPrice: 4500,
    annualPrice: 45000,
    currency: 'BDT',
    monthlyDiscount: 0,
    annualDiscount: 16.67,
    trialDays: 14,
    setupFee: 0,
    maxStudents: 500,
    maxCampuses: 1,
    maxUsers: 25,
    maxTeachers: 25,
    maxStorageGb: 20,
    includedSms: 1000,
    includedEmails: 5000,
    apiAccess: false,
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
    isPublic: true,
    isActive: true,
    isFeatured: false,
    displayOrder: 1,
    badge: 'Best for Small Schools',
    buttonText: 'Start Free Trial',
    features: [
      { featureKey: 'SIS', name: 'Student Information System', isEnabled: true },
      { featureKey: 'ATTENDANCE', name: 'Daily Attendance & Leave Tracking', isEnabled: true },
      { featureKey: 'ACADEMICS', name: 'Class & Section Management', isEnabled: true },
      { featureKey: 'EXAMINATION', name: 'Standard Gradebook & Report Cards', isEnabled: true },
      { featureKey: 'PORTAL', name: 'Student & Guardian Web Access', isEnabled: true },
      { featureKey: 'RBAC', name: 'Role-Based Access Control', isEnabled: true },
      { featureKey: 'REPORTS', name: 'Standard PDF/Excel Exports', isEnabled: true },
    ]
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    slug: 'standard',
    tier: SubscriptionTier.STANDARD,
    description: 'Full-featured management platform for established schools, colleges, and medium institutions.',
    monthlyPrice: 9500,
    annualPrice: 95000,
    currency: 'BDT',
    monthlyDiscount: 0,
    annualDiscount: 16.67,
    trialDays: 14,
    setupFee: 0,
    maxStudents: 1500,
    maxCampuses: 2,
    maxUsers: 60,
    maxTeachers: 60,
    maxStorageGb: 60,
    includedSms: 3000,
    includedEmails: 15000,
    apiAccess: false,
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
    isPublic: true,
    isActive: true,
    isFeatured: false,
    displayOrder: 2,
    badge: 'Growing Institutions',
    buttonText: 'Choose Standard',
    features: [
      { featureKey: 'SIS', name: 'Student Information System', isEnabled: true },
      { featureKey: 'ATTENDANCE', name: 'Biometric & Mobile Attendance Sync', isEnabled: true },
      { featureKey: 'ADMISSION', name: 'Online Admission & Test Workflow', isEnabled: true },
      { featureKey: 'FINANCE', name: 'Student Fees, Invoicing & bKash Collection', isEnabled: true },
      { featureKey: 'HR_PAYROLL', name: 'Teacher & Staff Payroll with Bank Advice', isEnabled: true },
      { featureKey: 'FACILITIES', name: 'Library, Hostel, Transport & Inventory', isEnabled: true },
      { featureKey: 'CUSTOM_REPORTS', name: 'Drag-and-Drop Custom Report Builder', isEnabled: true },
    ]
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    slug: 'professional',
    tier: SubscriptionTier.PROFESSIONAL,
    description: 'Advanced multi-campus operating suite for large schools, colleges, and polytechnics.',
    monthlyPrice: 15000,
    annualPrice: 150000,
    currency: 'BDT',
    monthlyDiscount: 0,
    annualDiscount: 16.67,
    trialDays: 14,
    setupFee: 0,
    maxStudents: 3500,
    maxCampuses: 5,
    maxUsers: 150,
    maxTeachers: 150,
    maxStorageGb: 150,
    includedSms: 8000,
    includedEmails: 40000,
    apiAccess: false,
    customDomain: true,
    whiteLabel: false,
    prioritySupport: true,
    isPublic: true,
    isActive: true,
    isFeatured: true,
    displayOrder: 3,
    badge: 'Most Popular',
    buttonText: 'Choose Professional',
    features: [
      { featureKey: 'MULTI_CAMPUS', name: 'Unified Multi-Campus Operations', isEnabled: true },
      { featureKey: 'LMS_COMPLETE', name: 'LMS, Video Classes & Online Question Bank', isEnabled: true },
      { featureKey: 'GOV_COMPLIANCE', name: 'BANBEIS, DSHE, BTEB & UGC Regulatory Exports', isEnabled: true },
      { featureKey: 'ADVANCED_FINANCE', name: 'Double-Entry Accounting & Automated Reconciliation', isEnabled: true },
      { featureKey: 'FACULTY_PORTAL', name: 'Faculty Workload & Research Profile', isEnabled: true },
      { featureKey: 'CUSTOM_DOMAIN', name: 'Custom Domain Mapping (e.g. erp.school.edu.bd)', isEnabled: true },
      { featureKey: 'PRIORITY_SUPPORT', name: 'Priority Support & SLA Assistance', isEnabled: true },
    ]
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    slug: 'enterprise',
    tier: SubscriptionTier.ENTERPRISE,
    description: 'High-scale institutional enterprise solution for universities and large educational groups.',
    monthlyPrice: 30000,
    annualPrice: 300000,
    currency: 'BDT',
    monthlyDiscount: 0,
    annualDiscount: 16.67,
    trialDays: 30,
    setupFee: 0,
    maxStudents: 10000,
    maxCampuses: 20,
    maxUsers: 500,
    maxTeachers: 500,
    maxStorageGb: 500,
    includedSms: 25000,
    includedEmails: 100000,
    apiAccess: true,
    customDomain: true,
    whiteLabel: true,
    prioritySupport: true,
    isPublic: true,
    isActive: true,
    isFeatured: false,
    displayOrder: 4,
    badge: 'University & Group Scale',
    buttonText: 'Choose Enterprise',
    features: [
      { featureKey: 'UNIVERSITY_CREDIT', name: 'Full Semester, Open Credit & Prerequisite Waiver Engine', isEnabled: true },
      { featureKey: 'HIFZ_TRACKING', name: 'Madrasha 30-Para Hifzul Quran Progress Engine', isEnabled: true },
      { featureKey: 'REST_API', name: 'Full Developer API & Webhook Webhooks Access', isEnabled: true },
      { featureKey: 'WHITE_LABEL', name: 'Complete White-Labeling & Institutional Custom Branding', isEnabled: true },
      { featureKey: 'DATA_WAREHOUSE', name: 'Dedicated Analytics Snapshot Engine', isEnabled: true },
      { featureKey: 'DEDICATED_MGR', name: 'Dedicated Technical Account Manager', isEnabled: true },
      { featureKey: 'SLA_999', name: '99.9% Uptime Guarantee & 24/7 Phone Support', isEnabled: true },
    ]
  }
];

export class SaasPlanService {
  static async seedDefaultPlans() {
    return this.seedInitialPlans();
  }

  /**
   * Initializes or refreshes the default SaaS plans in the database
   */
  static async seedInitialPlans() {
    for (const planData of INITIAL_SAAS_PLANS) {
      const { features, tier, ...scalarFields } = planData;
      
      const plan = await db.subscriptionPlan.upsert({
        where: { code: planData.code },
        update: {
          ...scalarFields,
          tier: tier || SubscriptionTier.STARTER,
        },
        create: {
          ...scalarFields,
          tier: tier || SubscriptionTier.STARTER,
        }
      });

      if (features && features.length > 0) {
        for (const feat of features) {
          await db.planFeature.upsert({
            where: {
              planId_featureKey: {
                planId: plan.id,
                featureKey: feat.featureKey
              }
            },
            update: {
              name: feat.name,
              description: feat.description,
              isEnabled: feat.isEnabled,
              limitValue: feat.limitValue
            },
            create: {
              planId: plan.id,
              featureKey: feat.featureKey,
              name: feat.name,
              description: feat.description,
              isEnabled: feat.isEnabled,
              limitValue: feat.limitValue
            }
          });
        }
      }
    }

    // Seed default Payment Gateway configurations
    const defaultGateways = [
      {
        gateway: 'BKASH',
        name: 'bKash Checkout',
        displayName: 'bKash',
        provider: 'bKash Limited',
        isEnabled: true,
        isSandbox: process.env.BKASH_IS_SANDBOX === 'true' || process.env.NODE_ENV !== 'production',
        displayOrder: 1,
        minAmount: 1,
        maxAmount: 500000,
        instructions: 'Pay instantly and securely using your personal bKash account or PIN.'
      },
      {
        gateway: 'NAGAD',
        name: 'Nagad Direct',
        displayName: 'Nagad',
        provider: 'Nagad',
        isEnabled: false,
        isSandbox: true,
        displayOrder: 2,
        minAmount: 10,
        maxAmount: 250000,
        instructions: 'Nagad gateway undergoing integration testing.'
      },
      {
        gateway: 'ROCKET',
        name: 'DBBL Rocket',
        displayName: 'Rocket',
        provider: 'Dutch-Bangla Bank',
        isEnabled: false,
        isSandbox: true,
        displayOrder: 3,
        minAmount: 10,
        maxAmount: 200000,
        instructions: 'Rocket gateway integration pending provider approval.'
      },
      {
        gateway: 'CARD',
        name: 'Debit / Credit Cards',
        displayName: 'Cards',
        provider: 'Card Processor',
        isEnabled: false,
        isSandbox: true,
        displayOrder: 4,
        minAmount: 100,
        maxAmount: 500000,
        instructions: 'Credit and debit card processing.'
      },
      {
        gateway: 'BANK_TRANSFER',
        name: 'Direct Bank Wire / EFT',
        displayName: 'Bank Transfer',
        provider: 'Corporate Banking',
        isEnabled: true,
        isSandbox: false,
        displayOrder: 5,
        minAmount: 500,
        maxAmount: 1000000,
        instructions: 'Deposit subscription payment to City Bank A/C: 1102948192001 (Vento Technology). Submit transaction reference after payment.'
      }
    ];

    // Seed default Payment Gateways via PaymentGatewayService
    const { PaymentGatewayService } = await import('./payment-gateway.service');
    await PaymentGatewayService.ensureDefaultGateways();

    // Seed default Platform Billing Settings
    await db.platformBillingSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 0,
        taxRegistrationReference: 'BIN-002910481-0101',
        taxInclusive: true,
        gracePeriodDays: 3,
        currency: 'BDT'
      }
    });

    console.log('✅ Seeded 4 SaaS packages, payment gateways, and billing settings.');
  }

  /**
   * Retrieves all active public plans for the public pricing page
   */
  static async getPublicPlans() {
    return db.subscriptionPlan.findMany({
      where: {
        isPublic: true,
        isActive: true
      },
      include: {
        features: {
          where: { isEnabled: true },
          orderBy: { featureKey: 'asc' }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });
  }

  /**
   * Retrieves all plans (including private / inactive) for Super Admin management
   */
  static async getAllPlansAdmin() {
    return db.subscriptionPlan.findMany({
      include: {
        features: true,
        _count: {
          select: {
            subscriptions: true,
            orders: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });
  }

  /**
   * Get plan by code or slug or id
   */
  static async getPlanByIdOrCode(identifier: string) {
    return db.subscriptionPlan.findFirst({
      where: {
        OR: [
          { id: identifier },
          { code: identifier.toUpperCase() },
          { slug: identifier.toLowerCase() }
        ]
      },
      include: {
        features: true
      }
    });
  }

  /**
   * Update plan pricing and configuration (Super Admin only)
   */
  static async updatePlan(id: string, data: Partial<SubscriptionPlanInput>) {
    const {
      features,
      tier,
      _count,
      id: _id,
      createdAt,
      updatedAt,
      subscriptions,
      orders,
      invoices,
      ...scalarData
    } = data as any;

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: {
        ...scalarData,
        ...(tier ? { tier } : {})
      },
      include: {
        features: true
      }
    });

    if (features && Array.isArray(features)) {
      for (const feat of features) {
        await db.planFeature.upsert({
          where: {
            planId_featureKey: {
              planId: id,
              featureKey: feat.featureKey
            }
          },
          update: {
            name: feat.name,
            description: feat.description,
            isEnabled: feat.isEnabled,
            limitValue: feat.limitValue
          },
          create: {
            planId: id,
            featureKey: feat.featureKey,
            name: feat.name,
            description: feat.description,
            isEnabled: feat.isEnabled,
            limitValue: feat.limitValue
          }
        });
      }
    }

    return updated;
  }

  /**
   * Create a new custom subscription plan
   */
  static async createPlan(data: SubscriptionPlanInput) {
    const { features, tier, ...scalarData } = data;
    const plan = await db.subscriptionPlan.create({
      data: {
        ...scalarData,
        tier: tier || SubscriptionTier.STARTER
      },
      include: { features: true }
    });

    if (features && Array.isArray(features)) {
      for (const feat of features) {
        await db.planFeature.create({
          data: {
            planId: plan.id,
            featureKey: feat.featureKey,
            name: feat.name,
            description: feat.description,
            isEnabled: feat.isEnabled,
            limitValue: feat.limitValue
          }
        });
      }
    }

    return db.subscriptionPlan.findUnique({
      where: { id: plan.id },
      include: { features: true }
    });
  }

  /**
   * Clones an existing subscription plan
   */
  static async clonePlan(sourcePlanId: string, newCode: string, newName: string) {
    const source = await db.subscriptionPlan.findUnique({
      where: { id: sourcePlanId },
      include: { features: true }
    });
    if (!source) throw new Error('Source plan not found');

    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { id, createdAt, updatedAt, features, ...sourceData } = source;

    const cloned = await db.subscriptionPlan.create({
      data: {
        ...sourceData,
        code: newCode.toUpperCase(),
        name: newName,
        slug: newSlug,
        displayOrder: source.displayOrder + 1,
        isPublic: false
      }
    });

    for (const feat of features) {
      await db.planFeature.create({
        data: {
          planId: cloned.id,
          featureKey: feat.featureKey,
          name: feat.name,
          description: feat.description,
          isEnabled: feat.isEnabled,
          limitValue: feat.limitValue
        }
      });
    }

    return db.subscriptionPlan.findUnique({
      where: { id: cloned.id },
      include: { features: true }
    });
  }

  /**
   * Delete or archive plan safely
   */
  static async deletePlan(id: string) {
    const subCount = await db.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      return db.subscriptionPlan.update({
        where: { id },
        data: { isActive: false, isPublic: false }
      });
    }
    return db.subscriptionPlan.delete({
      where: { id }
    });
  }
}
