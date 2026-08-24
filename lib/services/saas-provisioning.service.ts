import { db } from '../db';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

export interface PaymentFulfillmentInput {
  gateway: string;
  paymentId?: string;
  trxId?: string;
  amount: number;
  providerReference?: string;
}

export class SaasProvisioningService {
  /**
   * Atomically fulfills a paid order, provisions tenant/institution/owner,
   * activates subscription, creates SaaS invoice, and completes onboarding.
   */
  static async fulfillPaidOrder(orderId: string, payment: PaymentFulfillmentInput) {
    return db.$transaction(async (tx) => {
      // 1. Lock and retrieve order
      const order = await tx.subscriptionOrder.findUnique({
        where: { id: orderId },
        include: {
          plan: true,
          signup: true,
          tenant: true
        }
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found.`);
      }

      // Idempotency check: if already fulfilled/paid, return existing tenant
      if (order.status === 'PAID' || order.status === 'FULFILLED') {
        const tenantSlug = order.tenant?.slug || order.signup?.desiredSlug;
        return {
          alreadyFulfilled: true,
          orderNumber: order.orderNumber,
          tenantSlug
        };
      }

      const now = new Date();
      const isAnnual = order.billingCycle === 'ANNUAL';
      const periodDurationDays = isAnnual ? 365 : 30;
      const periodEnd = new Date(now.getTime() + periodDurationDays * 24 * 60 * 60 * 1000);

      // 2. Record/Update payment transaction
      await tx.subscriptionPaymentTransaction.create({
        data: {
          orderId: order.id,
          gateway: payment.gateway,
          paymentId: payment.paymentId || null,
          trxId: payment.trxId || null,
          amount: payment.amount,
          currency: order.currency,
          status: 'SUCCESS',
          initiatedAt: order.createdAt,
          executedAt: now,
          verifiedAt: now,
          providerResponseRef: payment.providerReference || null
        }
      });

      let targetTenantId = order.tenantId;
      let targetTenantSlug = order.tenant?.slug;

      // 3. If this is a new signup, provision the entire institutional tenant stack
      if (order.signupId && order.signup) {
        const signup = order.signup;
        targetTenantSlug = signup.desiredSlug;

        // Check if tenant already exists (idempotent safeguard)
        let tenant = await tx.tenant.findUnique({
          where: { slug: signup.desiredSlug }
        });

        if (!tenant) {
          // Create Tenant
          tenant = await tx.tenant.create({
            data: {
              slug: signup.desiredSlug,
              institutionType: signup.institutionType,
              subscriptionTier: order.plan.tier,
              isActive: true,
              isDemoTenant: false
            }
          });

          // Create Institution
          const instShortName = signup.institutionName
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 6)
            .toUpperCase() || 'INST';

          const institution = await tx.institution.create({
            data: {
              tenantId: tenant.id,
              name: signup.institutionName,
              shortName: instShortName,
              address: signup.address,
              district: 'Dhaka',
              division: 'Dhaka',
              upazilaThana: 'Dhanmondi',
              phone: signup.phone,
              email: signup.email,
            }
          });

          // Create Primary Campus
          const campus = await tx.campus.create({
            data: {
              institutionId: institution.id,
              name: 'Main Campus',
              code: 'MAIN',
              address: signup.address,
              phone: signup.phone,
              email: signup.email,
              isMain: true
            }
          });

          // Create Initial Academic Year
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

          // Create First Owner / Administrator User
          await tx.user.create({
            data: {
              tenantId: tenant.id,
              email: signup.email,
              passwordHash: signup.passwordHash,
              name: signup.contactPerson,
              phone: signup.phone,
              role: UserRole.OWNER,
              status: 'ACTIVE' as any
            }
          });
        }

        targetTenantId = tenant.id;

        // Update signup application
        await tx.signupApplication.update({
          where: { id: signup.id },
          data: {
            status: 'ACTIVE',
            tenantId: tenant.id
          }
        });
      }

      if (!targetTenantId) {
        throw new Error('Tenant could not be resolved for subscription provisioning.');
      }

      // 4. Create or Update Subscription
      await tx.subscription.create({
        data: {
          tenantId: targetTenantId,
          planId: order.planId,
          billingCycle: order.billingCycle,
          startDate: now,
          endDate: periodEnd,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
          status: 'ACTIVE',
          autoRenew: true,
          cancelAtPeriodEnd: false,
          lastBilledAt: now
        }
      });

      // 5. Generate Platform SaaS Invoice
      const invoiceNumber = `EDU-INV-${now.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      await tx.subscriptionInvoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          tenantId: targetTenantId,
          planId: order.planId,
          billingPeriod: `${now.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`,
          billingCycle: order.billingCycle,
          subTotal: order.subtotal,
          discountAmount: order.discount,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          currency: order.currency,
          status: 'PAID',
          paidAt: now,
          paymentMethod: payment.gateway,
          transactionRef: payment.trxId || payment.paymentId || order.orderNumber,
          notes: `Paid for ${order.plan.name} (${order.billingCycle}) plan subscription.`
        }
      });

      // 6. Mark Order as PAID and FULFILLED
      await tx.subscriptionOrder.update({
        where: { id: order.id },
        data: {
          status: 'FULFILLED',
          tenantId: targetTenantId,
          paidAt: now,
          paymentId: payment.paymentId || null,
          trxId: payment.trxId || null,
          gateway: payment.gateway
        }
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: targetTenantId,
          userName: 'System / SaaS Provisioner',
          userRole: 'SYSTEM',
          action: 'SAAS_SUBSCRIPTION_ACTIVATED',
          resourceType: 'Subscription',
          resourceId: order.id,
          newState: JSON.stringify({
            orderNumber: order.orderNumber,
            plan: order.plan.name,
            billingCycle: order.billingCycle,
            amount: order.totalAmount,
            gateway: payment.gateway,
            trxId: payment.trxId
          })
        }
      });

      return {
        success: true,
        orderNumber: order.orderNumber,
        tenantSlug: targetTenantSlug,
        totalAmount: order.totalAmount
      };
    });
  }
}
