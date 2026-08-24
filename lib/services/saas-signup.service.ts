import { db } from '../db';
import { hashPassword } from '../auth/password';
import { InstitutionType } from '@prisma/client';
import crypto from 'crypto';

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
  billingCycle: 'MONTHLY' | 'ANNUAL';
  promoCode?: string;
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
   * Creates a pre-payment SignupApplication and SubscriptionOrder
   */
  static async createSignupApplication(input: SignupInput) {
    const slugCheck = await this.validateSlug(input.desiredSlug);
    if (!slugCheck.valid) {
      throw new Error(slugCheck.message);
    }
    const cleanSlug = slugCheck.slug;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error('Please provide a valid email address.');
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

    // Calculate server-verified pricing
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

    const passwordHash = await hashPassword(input.password);
    const checkoutToken = crypto.randomUUID();
    const orderNumber = `EDU-ORD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

    // Atomic creation of SignupApplication and SubscriptionOrder
    const [signup, order] = await db.$transaction(async (tx) => {
      const createdSignup = await tx.signupApplication.create({
        data: {
          institutionName: input.institutionName.trim(),
          institutionType: input.institutionType,
          contactPerson: input.contactPerson.trim(),
          email: input.email.toLowerCase().trim(),
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
