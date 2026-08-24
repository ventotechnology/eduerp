import { db } from '../db';
import { hashPassword } from '../auth/password';
import { InstitutionType, UserRole } from '@prisma/client';
import crypto from 'crypto';
import { TenantOnboardingService } from './tenant-onboarding.service';

export const RESERVED_TENANT_SLUGS = new Set([
  'admin',
  'super-admin',
  'superadmin',
  'login',
  'signup',
  'pricing',
  'api',
  'results',
  'verify',
  'site',
  'www',
  'support',
  'billing',
  'checkout',
  'payment',
  'payments',
  'auth',
  'dashboard',
  'settings',
  'academics',
  'students',
  'finance',
  'reports',
  'lms',
  'hr',
  'facilities',
  'hifz',
  'admissions',
  'exams',
  'timetable',
  'health',
  'ready',
  'public',
  'root',
  'system',
  'demo'
]);

export interface SignupInput {
  institutionName: string;
  institutionType: InstitutionType;
  contactPerson: string;
  email: string;
  phone: string;
  country?: string;
  address: string;
  desiredSlug: string;
  password: string;
  planIdOrCode: string;
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'TRIAL';
  promoCode?: string;
  isTrial?: boolean;
}

export interface SlugValidationResult {
  valid: boolean;
  slug: string;
  message?: string;
}

export class SaasSignupService {
  /**
   * Normalizes and strictly validates a desired tenant slug
   */
  static async validateSlug(rawSlug: string): Promise<SlugValidationResult> {
    if (!rawSlug || typeof rawSlug !== 'string') {
      return { valid: false, slug: '', message: 'Tenant slug is required.' };
    }

    const trimmed = rawSlug.trim().toLowerCase();

    if (trimmed.length < 3) {
      return { valid: false, slug: trimmed, message: 'Tenant slug must be at least 3 characters long.' };
    }

    if (trimmed.length > 50) {
      return { valid: false, slug: trimmed, message: 'Tenant slug cannot exceed 50 characters.' };
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed)) {
      return { valid: false, slug: trimmed, message: 'Tenant slug may only contain lowercase letters, numbers, and single hyphens.' };
    }

    if (RESERVED_TENANT_SLUGS.has(trimmed)) {
      return { valid: false, slug: trimmed, message: `The slug "${trimmed}" is reserved for system use. Please choose another.` };
    }

    // Check if tenant already exists
    const existingTenant = await db.tenant.findUnique({
      where: { slug: trimmed }
    });

    if (existingTenant) {
      return { valid: false, slug: trimmed, message: `The domain "${trimmed}.eduerp.us" is already registered.` };
    }

    // Check if pending signup exists within 24 hours
    const existingPending = await db.signupApplication.findFirst({
      where: {
        desiredSlug: trimmed,
        status: { in: ['PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PROVISIONING', 'PAID'] },
        expiresAt: { gt: new Date() }
      }
    });

    if (existingPending) {
      return { valid: false, slug: trimmed, message: `The domain "${trimmed}.eduerp.us" is currently reserved by a pending checkout.` };
    }

    return { valid: true, slug: trimmed };
  }

  /**
   * Creates a pre-payment SignupApplication and SubscriptionOrder, OR directly provisions a Free Trial
   */
  static async createSignupApplication(input: SignupInput) {
    const slugCheck = await this.validateSlug(input.desiredSlug);
    if (!slugCheck.valid) {
      throw new Error(slugCheck.message);
    }
    const cleanSlug = slugCheck.slug;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = input.email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Please provide a valid email address.');
    }

    // Check if user account already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw new Error('An account with this email address already exists. Please sign in or use account recovery.');
    }

    // Check password strength
    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Resolve Plan from DB
    const plan = await db.subscriptionPlan.findFirst({
      where: {
        OR: [
          { id: input.planIdOrCode },
          { code: input.planIdOrCode.toUpperCase() },
          { slug: input.planIdOrCode.toLowerCase() }
        ],
        isActive: true
      }
    });

    if (!plan) {
      throw new Error('The selected subscription package was not found or is inactive.');
    }

    const passwordHash = await hashPassword(input.password);
    const now = new Date();

    // -------------------------------------------------------------
    // INSTANT FREE TRIAL PROVISIONING PATH
    // -------------------------------------------------------------
    if (input.billingCycle === 'TRIAL' || input.isTrial) {
      const trialDays = plan.trialDays || 14;
      const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const trialResult = await db.$transaction(async (tx) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            slug: cleanSlug,
            institutionType: input.institutionType,
            subscriptionTier: plan.tier,
            status: 'ACTIVE_TRIAL',
            isActive: true,
            isDemoTenant: false,
            provisioningKey: `TRIAL-${cleanSlug}-${now.getTime()}`
          }
        });

        // 2. Create Institution
        const shortName = input.institutionName
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 6)
          .toUpperCase() || 'INST';

        const institution = await tx.institution.create({
          data: {
            tenantId: tenant.id,
            name: input.institutionName.trim(),
            shortName,
            address: input.address.trim(),
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: input.phone.trim(),
            email: normalizedEmail,
            currencyCode: plan.currency || 'BDT',
            currencySymbol: '৳'
          }
        });

        // 3. Create Main Campus
        await tx.campus.create({
          data: {
            institutionId: institution.id,
            name: 'Main Campus',
            code: 'MAIN',
            address: input.address.trim(),
            phone: input.phone.trim(),
            email: normalizedEmail,
            isMain: true
          }
        });

        // 4. Create Academic Year
        const year = now.getFullYear();
        await tx.academicYear.create({
          data: {
            institutionId: institution.id,
            name: `Academic Year ${year}`,
            code: `AY-${year}`,
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
            isCurrent: true,
            status: 'ACTIVE'
          }
        });

        // 5. Create Owner User
        const ownerRole = input.institutionType === 'UNIVERSITY' ? UserRole.VICE_CHANCELLOR : UserRole.PRINCIPAL;
        await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: normalizedEmail,
            passwordHash,
            name: input.contactPerson.trim(),
            phone: input.phone.trim(),
            role: ownerRole as any,
            status: 'ACTIVE' as any,
            forcePasswordChange: false
          }
        });

        // 6. Create Trial Subscription
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            billingCycle: 'MONTHLY',
            startDate: now,
            endDate: trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd: trialEndsAt,
            nextBillingDate: trialEndsAt,
            trialEndsAt,
            status: 'TRIALING',
            autoRenew: false
          }
        });

        // 7. Initialize Onboarding Progress
        await tx.tenantOnboardingProgress.create({
          data: {
            tenantId: tenant.id,
            currentStep: 1,
            completedSteps: [1, 3, 4], // Profile, Academic Year, Campus initialized
            isCompleted: false
          }
        });

        // 8. Audit Log
        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            userName: input.contactPerson,
            userRole: 'OWNER',
            action: 'TRIAL_PROVISIONED',
            resourceType: 'Tenant',
            resourceId: tenant.id,
            newState: JSON.stringify({
              plan: plan.name,
              trialDays,
              trialEndsAt: trialEndsAt.toISOString()
            })
          }
        });

        return {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          planName: plan.name,
          trialDays,
          trialEndsAt
        };
      });

      return {
        success: true,
        isTrial: true,
        tenantSlug: trialResult.tenantSlug,
        plan: {
          name: plan.name,
          code: plan.code
        },
        trialDays,
        message: `Your ${trialDays}-day free trial for ${plan.name} has been activated. Please sign in to access your workspace.`
      };
    }

    // -------------------------------------------------------------
    // PAID ORDER CHECKOUT PATH
    // -------------------------------------------------------------
    const isAnnual = input.billingCycle === 'ANNUAL';
    let basePrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    let discount = 0;

    // Check Promo Code if provided
    if (input.promoCode) {
      const promo = await db.promoCode.findFirst({
        where: {
          code: input.promoCode.toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }]
        }
      });

      if (promo) {
        if (promo.discountType === 'PERCENTAGE') {
          discount = (basePrice * promo.discountValue) / 100;
          if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
          }
        } else {
          discount = Math.min(promo.discountValue, basePrice);
        }
      }
    }

    // Fetch tax settings
    const taxSettings = await db.platformBillingSettings.findFirst();
    const taxRate = taxSettings?.taxEnabled ? taxSettings.taxRate : 0;
    const subtotal = Math.max(0, basePrice - discount);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount + (plan.setupFee || 0);

    const checkoutToken = crypto.randomUUID();
    const orderNumber = `EDU-ORD-${now.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours validity

    const [signup, order] = await db.$transaction(async (tx) => {
      const createdSignup = await tx.signupApplication.create({
        data: {
          institutionName: input.institutionName.trim(),
          institutionType: input.institutionType,
          contactPerson: input.contactPerson.trim(),
          email: normalizedEmail,
          phone: input.phone.trim(),
          country: input.country || 'Bangladesh',
          address: input.address.trim(),
          desiredSlug: cleanSlug,
          passwordHash,
          planId: plan.id,
          billingCycle: input.billingCycle,
          amount: totalAmount,
          currency: plan.currency || 'BDT',
          checkoutToken,
          status: 'PENDING_PAYMENT',
          expiresAt
        }
      });

      const createdOrder = await tx.subscriptionOrder.create({
        data: {
          orderNumber,
          signupId: createdSignup.id,
          planId: plan.id,
          billingCycle: input.billingCycle,
          subtotal: basePrice,
          discount,
          promoCode: input.promoCode?.toUpperCase() || null,
          setupFee: plan.setupFee || 0,
          taxRate,
          taxAmount,
          totalAmount,
          currency: plan.currency || 'BDT',
          status: 'PENDING',
          expiresAt
        }
      });

      return [createdSignup, createdOrder];
    });

    return {
      success: true,
      isTrial: false,
      signupId: signup.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutToken: signup.checkoutToken,
      desiredSlug: cleanSlug,
      totalAmount: order.totalAmount,
      currency: order.currency,
      expiresAt: order.expiresAt,
      plan: {
        name: plan.name,
        code: plan.code,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice
      }
    };
  }

  /**
   * Retrieves an existing order and its signup details
   */
  static async getOrderDetails(orderIdOrNumber: string) {
    const order = await db.subscriptionOrder.findFirst({
      where: {
        OR: [
          { id: orderIdOrNumber },
          { orderNumber: orderIdOrNumber }
        ]
      },
      include: {
        plan: {
          include: {
            features: {
              where: { isEnabled: true }
            }
          }
        },
        signup: true,
        tenant: true,
        invoices: true,
        payments: {
          orderBy: { initiatedAt: 'desc' }
        }
      }
    });

    if (!order) {
      return null;
    }

    // Also fetch available active payment gateways
    const gateways = await db.paymentGatewayConfig.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        gateway: true,
        name: true,
        displayName: true,
        isSandbox: true,
        minAmount: true,
        maxAmount: true,
        instructions: true
      }
    });

    return {
      order,
      gateways
    };
  }
}
