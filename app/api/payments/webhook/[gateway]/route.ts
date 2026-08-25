import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SaasProvisioningService } from '@/lib/services/saas-provisioning.service';
import { BkashPaymentProvider } from '@/lib/payments/providers/bkash-provider';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params;
  const upperGateway = gateway.toUpperCase();

  try {
    const rawBody = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // not json
    }

    // 1. Process bKash Webhook
    if (upperGateway === 'BKASH') {
      const paymentId = body.paymentID || body.paymentId || request.nextUrl.searchParams.get('paymentID');
      const trxId = body.trxID || body.trxId;
      const status = (body.transactionStatus || body.status || '').toUpperCase();
      const orderId = body.merchantInvoiceNumber || body.orderId || request.nextUrl.searchParams.get('orderId');

      if (!paymentId) {
        return NextResponse.json({ success: false, error: 'Missing paymentID' }, { status: 400 });
      }

      // Check if order exists
      const order = await db.subscriptionOrder.findFirst({
        where: {
          OR: [
            { paymentId },
            ...(orderId ? [{ id: orderId }, { orderNumber: orderId }] : [])
          ]
        },
        include: { tenant: true, signup: true }
      });

      if (order) {
        // Idempotency: if already paid or fulfilled, return 200 OK immediately
        if (order.status === 'PAID' || order.status === 'FULFILLED') {
          return NextResponse.json({ success: true, message: 'Already processed', orderNumber: order.orderNumber });
        }

        // Verify with bKash server-to-server
        const queryRes = await BkashPaymentProvider.queryPayment(paymentId);
        if (queryRes.success && (queryRes.transactionStatus === 'Completed' || queryRes.trxId)) {
          // Amount security validation
          if (Math.abs((queryRes.amount || 0) - order.totalAmount) <= 0.01) {
            await SaasProvisioningService.fulfillPaidOrder(order.id, {
              gateway: 'BKASH',
              paymentId,
              trxId: queryRes.trxId || trxId || `BKASH-WEBHOOK-${Date.now()}`,
              amount: queryRes.amount || order.totalAmount,
              providerReference: queryRes.merchantInvoiceNumber || order.orderNumber
            });

            return NextResponse.json({ success: true, message: 'Fulfillment completed via webhook', orderNumber: order.orderNumber });
          }
        }
      }

      // Check Student Fee Invoice payment by reference
      if (trxId) {
        const existingTx = await db.paymentTransaction.findUnique({
          where: { transactionRef: trxId }
        });
        if (existingTx) {
          return NextResponse.json({ success: true, message: 'Student transaction already recorded', trxId });
        }
      }

      return NextResponse.json({ success: true, message: 'Webhook received and evaluated' });
    }

    // 2. Generic Webhook processing for SSLCommerz / Nagad / ShurjoPay
    return NextResponse.json({
      success: true,
      gateway: upperGateway,
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[PAYMENT_WEBHOOK_ERROR][${upperGateway}]`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
