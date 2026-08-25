import { db } from '../db';
import { BkashPaymentProvider } from '../payments/providers/bkash-provider';
import { SaasProvisioningService } from './saas-provisioning.service';
import crypto from 'crypto';

export interface RecalculatedPricing {
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  basePrice: number;
  discount: number;
  setupFee: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export class SaasCheckoutService {
  /**
   * Recalculates authoritative pricing directly from the database
   * Never trusts any client-submitted pricing numbers.
   */
  static async recalculateOrderPricing(params: {
    planId: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    promoCode?: string;
  }): Promise<RecalculatedPricing> {
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: params.planId }
    });

    if (!plan || !plan.isActive) {
      throw new Error('Selected subscription plan was not found or is currently inactive.');
    }

    const isAnnual = params.billingCycle === 'ANNUAL';
    const basePrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    let discount = 0;

    // Apply active promo code from database if provided
    if (params.promoCode) {
      const promo = await db.promoCode.findFirst({
        where: {
          code: params.promoCode.trim().toUpperCase(),
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

    // Platform tax settings
    const billingSettings = await db.platformBillingSettings.findFirst();
    const taxRate = billingSettings?.taxEnabled ? billingSettings.taxRate : 0;
    const subtotal = Math.max(0, basePrice - discount);
    const taxAmount = (subtotal * taxRate) / 100;
    const setupFee = plan.setupFee || 0;
    const totalAmount = subtotal + taxAmount + setupFee;

    return {
      planId: plan.id,
      planName: plan.name,
      billingCycle: params.billingCycle,
      basePrice,
      discount,
      setupFee,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: plan.currency || 'BDT'
    };
  }

  /**
   * Initiates a bKash online checkout session for a given subscription order
   * Persists multi-attempt history and links checkout session
   */
  static async initiateBkashCheckout(orderId: string, hostUrl: string) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId },
      include: {
        plan: true,
        signup: true,
        tenant: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status === 'PAID' || order.status === 'FULFILLED') {
      throw new Error('This order has already been paid and processed.');
    }

    if (new Date() > order.expiresAt) {
      throw new Error('This checkout order has expired. Please create a new subscription order.');
    }

    // 1. Enforce Platform Gateway Resolution only
    const bkashConfig = await db.paymentGatewayConfig.findFirst({
      where: { scope: 'PLATFORM', gateway: 'BKASH', tenantId: null }
    });

    if (bkashConfig && !bkashConfig.isEnabled) {
      throw new Error('bKash payment gateway is currently disabled for platform subscriptions.');
    }

    // 2. Validate amount limits
    if (bkashConfig) {
      if (order.totalAmount < bkashConfig.minAmount) {
        throw new Error(`Order total is below bKash minimum threshold (${bkashConfig.minAmount} ${order.currency}).`);
      }
      if (order.totalAmount > bkashConfig.maxAmount) {
        throw new Error(`Order total exceeds bKash maximum transaction limit (${bkashConfig.maxAmount} ${order.currency}).`);
      }
    }

    const callbackUrl = `${hostUrl.replace(/\/$/, '')}/api/payments/bkash/callback?orderId=${order.id}`;

    // 3. Call bKash Payment Provider
    const result = await BkashPaymentProvider.createPayment({
      amount: order.totalAmount,
      currency: order.currency || 'BDT',
      merchantInvoiceNumber: order.orderNumber,
      callbackUrl,
      payerReference: order.signup?.phone || order.tenant?.slug || '01700000000',
      intent: 'sale'
    });

    if (!result.success || !result.paymentId) {
      const attemptNumber = (order.payments.length || 0) + 1;
      await db.subscriptionPaymentTransaction.create({
        data: {
          orderId: order.id,
          attemptNumber,
          gateway: 'BKASH',
          amount: order.totalAmount,
          currency: order.currency,
          status: 'FAILED',
          failureCode: 'INITIATION_FAILED',
          errorMessage: result.statusMessage || 'Failed to initialize bKash checkout session.'
        }
      });

      throw new Error(result.statusMessage || 'Failed to initialize bKash checkout session.');
    }

    const checkoutSessionId = `cs_edu_${crypto.randomUUID().slice(0, 18)}`;

    // 4. Update order with paymentId, session ID, and mark as PROCESSING
    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        gateway: 'BKASH',
        paymentId: result.paymentId,
        checkoutSessionId
      }
    });

    // 5. Record attempt in transaction ledger
    const attemptNumber = (order.payments.length || 0) + 1;
    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order.id,
        attemptNumber,
        gateway: 'BKASH',
        paymentId: result.paymentId,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'INITIATED'
      }
    });

    return {
      success: true,
      checkoutSessionId,
      paymentId: result.paymentId,
      bkashUrl: result.bkashUrl,
      orderNumber: order.orderNumber,
      amount: order.totalAmount
    };
  }

  /**
   * Processes the bKash payment callback, executes server-to-server with bKash,
   * performs strict amount & currency checking, and activates subscription atomically.
   */
  static async handleBkashCallback(params: {
    paymentId: string;
    status: string;
    orderId?: string;
  }) {
    const { paymentId, status, orderId } = params;

    // 1. Find order by orderId or paymentId
    const order = await db.subscriptionOrder.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          { paymentId }
        ]
      },
      include: {
        plan: true,
        signup: true,
        tenant: true,
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!order) {
      return {
        success: false,
        redirectUrl: `/payment/status/error?status=not_found&error=Order+not+found`
      };
    }

    // 2. Idempotency: if already fulfilled or paid, return success immediately without re-executing
    if (order.status === 'FULFILLED' || order.status === 'PAID') {
      return {
        success: true,
        alreadyProcessed: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantSlug: order.tenant?.slug || order.signup?.desiredSlug,
        redirectUrl: `/payment/status/${order.id}?status=success`
      };
    }

    const currentAttempt = (order.payments.length || 0) + 1;

    // 3. Check failure or cancellation
    if (status === 'cancel' || status === 'failure' || status === 'failed') {
      await db.subscriptionPaymentTransaction.create({
        data: {
          orderId: order.id,
          attemptNumber: currentAttempt,
          gateway: 'BKASH',
          paymentId,
          amount: order.totalAmount,
          currency: order.currency,
          status: status === 'cancel' ? 'CANCELLED' : 'FAILED',
          failureCode: status === 'cancel' ? 'USER_CANCELLED' : 'GATEWAY_DECLINED',
          errorMessage: `Payment was ${status} by user or provider.`
        }
      });

      await db.subscriptionOrder.update({
        where: { id: order.id },
        data: { status: 'PENDING' } // Allow customer to retry
      });

      return {
        success: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl: `/payment/status/${order.id}?status=failed&reason=${status}`
      };
    }

    // 4. Status is 'success': Verify and execute server-to-server with bKash
    try {
      const execResult = await BkashPaymentProvider.executePayment(paymentId);

      if (!execResult.success || !execResult.trxId) {
        await db.subscriptionPaymentTransaction.create({
          data: {
            orderId: order.id,
            attemptNumber: currentAttempt,
            gateway: 'BKASH',
            paymentId,
            amount: order.totalAmount,
            currency: order.currency,
            status: 'FAILED',
            failureCode: 'EXECUTION_ERROR',
            errorMessage: execResult.statusMessage || 'bKash payment execution failed'
          }
        });

        return {
          success: false,
          orderId: order.id,
          orderNumber: order.orderNumber,
          redirectUrl: `/payment/status/${order.id}?status=failed&reason=${encodeURIComponent(execResult.statusMessage || 'Execution failed')}`
        };
      }

      // 5. Authoritative Amount Validation: Compare executed amount against order
      const executedAmount = Number(execResult.amount || 0);
      if (Math.abs(executedAmount - order.totalAmount) > 0.01) {
        await db.subscriptionOrder.update({
          where: { id: order.id },
          data: {
            status: 'PAYMENT_AMOUNT_MISMATCH',
            trxId: execResult.trxId
          }
        });

        await db.subscriptionPaymentTransaction.create({
          data: {
            orderId: order.id,
            attemptNumber: currentAttempt,
            gateway: 'BKASH',
            paymentId: execResult.paymentId || paymentId,
            trxId: execResult.trxId,
            amount: executedAmount,
            currency: order.currency,
            status: 'PAYMENT_AMOUNT_MISMATCH',
            failureCode: 'AMOUNT_MISMATCH',
            errorMessage: `Amount mismatch: Expected ${order.totalAmount} ${order.currency}, received ${executedAmount} ${order.currency}.`
          }
        });

        return {
          success: false,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: 'PAYMENT_AMOUNT_MISMATCH',
          redirectUrl: `/payment/status/${order.id}?status=failed&reason=PAYMENT_AMOUNT_MISMATCH`
        };
      }

      // 6. Fulfill order atomically in transaction with recovery handler
      try {
        const fulfillment = await SaasProvisioningService.fulfillPaidOrder(order.id, {
          gateway: 'BKASH',
          paymentId: execResult.paymentId || paymentId,
          trxId: execResult.trxId,
          amount: executedAmount,
          providerReference: execResult.merchantInvoiceNumber || order.orderNumber
        });

        return {
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tenantSlug: fulfillment.tenantSlug,
          redirectUrl: `/payment/status/${order.id}?status=success`
        };
      } catch (fulfillmentError: any) {
        // Critical recovery state: Payment succeeded at bKash, but internal provisioning failed
        await db.subscriptionOrder.update({
          where: { id: order.id },
          data: {
            status: 'PAYMENT_SUCCESS_FULFILLMENT_PENDING',
            trxId: execResult.trxId
          }
        });

        await db.subscriptionPaymentTransaction.create({
          data: {
            orderId: order.id,
            attemptNumber: currentAttempt,
            gateway: 'BKASH',
            paymentId: execResult.paymentId || paymentId,
            trxId: execResult.trxId,
            amount: executedAmount,
            currency: order.currency,
            status: 'PAYMENT_SUCCESS_FULFILLMENT_PENDING',
            failureCode: 'FULFILLMENT_PENDING',
            errorMessage: `bKash payment successful (${execResult.trxId}), but internal fulfillment failed: ${fulfillmentError.message}`
          }
        });

        return {
          success: false,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: 'PAYMENT_SUCCESS_FULFILLMENT_PENDING',
          redirectUrl: `/payment/status/${order.id}?status=fulfillment_pending`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl: `/payment/status/${order.id}?status=failed&reason=${encodeURIComponent(err.message || 'Verification error')}`
      };
    }
  }

  /**
   * Retries fulfillment for orders stuck in PAYMENT_SUCCESS_FULFILLMENT_PENDING
   */
  static async retryOrderFulfillment(orderId: string, actor: string = 'SUPER_ADMIN') {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId },
      include: {
        payments: { where: { status: 'SUCCESS' }, take: 1 }
      }
    });

    if (!order) throw new Error('Order not found.');
    if (order.status === 'FULFILLED' || order.status === 'PAID') {
      return { success: true, message: 'Order is already fulfilled.' };
    }

    const trx = order.payments[0];
    const trxId = order.trxId || trx?.trxId || `RETRY-${Date.now()}`;

    return SaasProvisioningService.fulfillPaidOrder(order.id, {
      gateway: order.gateway || 'BKASH',
      trxId,
      amount: order.totalAmount,
      providerReference: `Retried by ${actor}`
    });
  }

  /**
   * Submits a manual bank transfer payment for administrative review
   */
  static async submitBankTransferPayment(params: {
    orderId: string;
    bankName: string;
    accountNumber: string;
    transactionRef: string;
    depositDate: string;
    notes?: string;
  }) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: params.orderId },
      include: { signup: true, plan: true, payments: true }
    });

    if (!order) throw new Error('Order not found.');
    if (order.status === 'PAID' || order.status === 'FULFILLED') {
      throw new Error('This order is already fulfilled.');
    }

    const attemptNumber = (order.payments?.length || 0) + 1;

    // Record pending transaction
    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order.id,
        attemptNumber,
        gateway: 'BANK_TRANSFER',
        trxId: params.transactionRef.trim(),
        amount: order.totalAmount,
        currency: order.currency,
        status: 'INITIATED',
        providerResponseRef: `Bank: ${params.bankName} | A/C: ${params.accountNumber} | Date: ${params.depositDate} | Notes: ${params.notes || 'None'}`
      }
    });

    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        gateway: 'BANK_TRANSFER',
        trxId: params.transactionRef.trim()
      }
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      status: 'PENDING_REVIEW',
      message: 'Bank transfer reference submitted successfully. Our billing team will verify and activate your subscription.'
    };
  }

  /**
   * Validates if a tenant is allowed to downgrade to a target plan based on current active student usage
   */
  static async validateDowngradeEligibility(tenantId: string, targetPlanId: string) {
    const targetPlan = await db.subscriptionPlan.findUnique({
      where: { id: targetPlanId }
    });

    if (!targetPlan) throw new Error('Target subscription plan not found.');

    const currentStudents = await db.student.count({
      where: {
        campus: {
          institution: {
            tenantId
          }
        },
        status: 'ACTIVE' as any
      }
    });

    if (currentStudents > targetPlan.maxStudents) {
      return {
        allowed: false,
        currentStudents,
        maxStudents: targetPlan.maxStudents,
        reason: 'DOWNGRADE_BLOCKED_BY_USAGE',
        message: `Cannot downgrade to ${targetPlan.name}. Your institution currently has ${currentStudents} active students, which exceeds the limit of ${targetPlan.maxStudents} for this tier. Please archive or graduate students before requesting this plan.`
      };
    }

    return {
      allowed: true,
      currentStudents,
      maxStudents: targetPlan.maxStudents,
      targetPlanName: targetPlan.name
    };
  }

  /**
   * Creates a subscription order for an existing tenant (Self-service Upgrade/Downgrade/Renewal)
   */
  static async createTenantSubscriptionOrder(params: {
    tenantId: string;
    planId: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    gateway?: string;
    promoCode?: string;
  }) {
    const { tenantId, planId, billingCycle, gateway, promoCode } = params;

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1
        }
      }
    });

    if (!tenant) throw new Error('Tenant not found.');

    // Recalculate authoritative pricing from DB
    const pricing = await this.recalculateOrderPricing({
      planId,
      billingCycle,
      promoCode
    });

    // Check downgrade usage guard if downgrading
    const currentSub = tenant.subscriptions[0];
    const targetPlan = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (currentSub && currentSub.plan && targetPlan && targetPlan.maxStudents < currentSub.plan.maxStudents) {
      const eligibility = await this.validateDowngradeEligibility(tenantId, planId);
      if (!eligibility.allowed) {
        throw new Error(eligibility.message);
      }
    }

    const orderNumber = `EDU-ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours window
    const checkoutSessionId = `cs_edu_${crypto.randomUUID().slice(0, 18)}`;

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber,
        checkoutSessionId,
        tenantId: tenant.id,
        planId,
        billingCycle,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        promoCode,
        setupFee: pricing.setupFee,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        currency: pricing.currency,
        status: 'PENDING',
        gateway: gateway || 'BKASH',
        expiresAt
      },
      include: {
        plan: true,
        tenant: true
      }
    });

    return order;
  }

  /**
   * Approves a manual payment (Platform Billing Admin / Super Admin only)
   */
  static async approveManualPayment(orderId: string, verifiedByUserId: string) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Order not found.');

    return SaasProvisioningService.fulfillPaidOrder(order.id, {
      gateway: order.gateway || 'BANK_TRANSFER',
      trxId: order.trxId || `MANUAL-${Date.now()}`,
      amount: order.totalAmount,
      providerReference: `Verified by user ID: ${verifiedByUserId}`
    });
  }

  /**
   * Rejects a manual payment with stated rejection reason
   */
  static async rejectManualPayment(orderId: string, rejectionReason: string, verifiedByUserId: string) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Order not found.');

    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' }
    });

    await db.subscriptionPaymentTransaction.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'REJECTED',
        providerResponseRef: `Rejected by ${verifiedByUserId}. Reason: ${rejectionReason}`
      }
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      status: 'REJECTED',
      rejectionReason
    };
  }

  /**
   * Marks a manual payment as failed
   */
  static async markManualPaymentFailed(orderId: string, failureReason: string, verifiedByUserId: string) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Order not found.');

    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: { status: 'FAILED' }
    });

    await db.subscriptionPaymentTransaction.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'FAILED',
        providerResponseRef: `Failed: ${failureReason} (Inspected by ${verifiedByUserId})`
      }
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      status: 'FAILED',
      failureReason
    };
  }
}
