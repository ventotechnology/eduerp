import { db } from '../db';
import { BkashPaymentProvider } from '../payments/providers/bkash-provider';
import { SaasProvisioningService } from './saas-provisioning.service';

export class SaasCheckoutService {
  /**
   * Initiates a bKash online checkout session for a given subscription order
   */
  static async initiateBkashCheckout(orderId: string, hostUrl: string) {
    const order = await db.subscriptionOrder.findUnique({
      where: { id: orderId },
      include: {
        plan: true,
        signup: true,
        tenant: true
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

    // Verify bKash gateway is enabled
    const bkashConfig = await db.paymentGatewayConfig.findUnique({
      where: { gateway: 'BKASH' }
    });

    if (bkashConfig && !bkashConfig.isEnabled) {
      throw new Error('bKash payment gateway is currently disabled.');
    }

    const callbackUrl = `${hostUrl.replace(/\/$/, '')}/api/payments/bkash/callback?orderId=${order.id}`;

    // Call bKash Payment Provider
    const result = await BkashPaymentProvider.createPayment({
      amount: order.totalAmount,
      currency: order.currency || 'BDT',
      merchantInvoiceNumber: order.orderNumber,
      callbackUrl,
      payerReference: order.signup?.phone || '01700000000',
      intent: 'sale'
    });

    if (!result.success || !result.paymentId) {
      throw new Error(result.statusMessage || 'Failed to initialize bKash checkout session.');
    }

    // Update order with paymentID and mark as PROCESSING
    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        gateway: 'BKASH',
        paymentId: result.paymentId
      }
    });

    // Record initial transaction
    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: 'BKASH',
        paymentId: result.paymentId,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'INITIATED'
      }
    });

    return {
      success: true,
      paymentId: result.paymentId,
      bkashUrl: result.bkashUrl,
      orderNumber: order.orderNumber,
      amount: order.totalAmount
    };
  }

  /**
   * Processes the bKash payment callback, verifies server-to-server with bKash,
   * checks amount matching, and activates the subscription atomically.
   */
  static async handleBkashCallback(params: {
    paymentId: string;
    status: string;
    orderId?: string;
  }) {
    const { paymentId, status, orderId } = params;

    // Find order by orderId or paymentId
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
        tenant: true
      }
    });

    if (!order) {
      return {
        success: false,
        redirectUrl: `/payment/status/error?status=not_found&error=Order+not+found`
      };
    }

    // Idempotency: if already fulfilled, return success immediately
    if (order.status === 'FULFILLED' || order.status === 'PAID') {
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantSlug: order.tenant?.slug || order.signup?.desiredSlug,
        redirectUrl: `/payment/status/${order.id}?status=success`
      };
    }

    // Check failure or cancellation
    if (status === 'cancel' || status === 'failure' || status === 'failed') {
      await db.subscriptionPaymentTransaction.create({
        data: {
          orderId: order.id,
          gateway: 'BKASH',
          paymentId,
          amount: order.totalAmount,
          currency: order.currency,
          status: status === 'cancel' ? 'CANCELLED' : 'FAILED',
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

    // Status is 'success': ALWAYS execute and verify server-to-server with bKash!
    try {
      const execResult = await BkashPaymentProvider.executePayment(paymentId);

      if (!execResult.success || !execResult.trxId) {
        await db.subscriptionPaymentTransaction.create({
          data: {
            orderId: order.id,
            gateway: 'BKASH',
            paymentId,
            amount: order.totalAmount,
            currency: order.currency,
            status: 'FAILED',
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

      // Security validation: Amount must match expected order amount
      if (Math.abs((execResult.amount || 0) - order.totalAmount) > 0.01) {
        throw new Error(`Payment amount mismatch: expected ${order.totalAmount} BDT, but received ${execResult.amount} BDT.`);
      }

      // Fulfill order atomically in transaction
      const fulfillment = await SaasProvisioningService.fulfillPaidOrder(order.id, {
        gateway: 'BKASH',
        paymentId: execResult.paymentId || paymentId,
        trxId: execResult.trxId,
        amount: execResult.amount || order.totalAmount,
        providerReference: execResult.merchantInvoiceNumber || order.orderNumber
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantSlug: fulfillment.tenantSlug,
        redirectUrl: `/payment/status/${order.id}?status=success`
      };
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
      include: { signup: true, plan: true }
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status === 'PAID' || order.status === 'FULFILLED') {
      throw new Error('This order is already fulfilled.');
    }

    // Record pending transaction
    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order.id,
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

    if (!targetPlan) {
      throw new Error('Target subscription plan not found.');
    }

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
   * Creates a subscription order for an existing tenant (Self-service Upgrade/Downgrade)
   */
  static async createTenantSubscriptionOrder(params: {
    tenantId: string;
    planId: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    gateway?: string;
  }) {
    const { tenantId, planId, billingCycle, gateway } = params;

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

    const targetPlan = await db.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!targetPlan) throw new Error('Subscription plan not found.');

    // Check downgrade usage guard
    const currentSub = tenant.subscriptions[0];
    if (currentSub && currentSub.plan && targetPlan.maxStudents < currentSub.plan.maxStudents) {
      const eligibility = await this.validateDowngradeEligibility(tenantId, planId);
      if (!eligibility.allowed) {
        throw new Error(eligibility.message);
      }
    }

    const isAnnual = billingCycle === 'ANNUAL';
    const subtotal = isAnnual ? targetPlan.annualPrice : targetPlan.monthlyPrice;
    const discount = 0;
    const totalAmount = subtotal - discount;

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours window

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber,
        tenantId: tenant.id,
        planId: targetPlan.id,
        billingCycle,
        subtotal,
        discount,
        totalAmount,
        currency: targetPlan.currency || 'BDT',
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

    if (!order) {
      throw new Error('Order not found.');
    }

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

    if (!order) {
      throw new Error('Order not found.');
    }

    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED'
      }
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

    if (!order) {
      throw new Error('Order not found.');
    }

    await db.subscriptionOrder.update({
      where: { id: order.id },
      data: {
        status: 'FAILED'
      }
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
