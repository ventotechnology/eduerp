import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { BkashPaymentProvider } from '@/lib/payments/providers/bkash-provider';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.isPlatformAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    // 1. Calculate Real Commercial Metrics from Database
    const [
      activeSubscriptions,
      allSubscriptions,
      recentOrders,
      recentInvoices,
      plans,
      gateways,
      billingSettings
    ] = await Promise.all([
      db.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }),
      db.subscription.count(),
      db.subscriptionOrder.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { plan: true, signup: true, tenant: true }
      }),
      db.subscriptionInvoice.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { plan: true, tenant: true }
      }),
      db.subscriptionPlan.findMany({
        include: {
          features: true,
          _count: { select: { subscriptions: true, orders: true } }
        },
        orderBy: { displayOrder: 'asc' }
      }),
      db.paymentGatewayConfig.findMany({
        orderBy: { displayOrder: 'asc' }
      }),
      db.platformBillingSettings.findFirst()
    ]);

    let mrr = 0;
    let arr = 0;

    for (const sub of activeSubscriptions) {
      if (sub.billingCycle === 'ANNUAL') {
        arr += sub.plan.annualPrice;
        mrr += sub.plan.annualPrice / 12;
      } else {
        mrr += sub.plan.monthlyPrice;
        arr += sub.plan.monthlyPrice * 12;
      }
    }

    const totalCollected = recentInvoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    // Test bKash gateway connection health
    const bkashHealth = await BkashPaymentProvider.testConnection();

    return NextResponse.json({
      success: true,
      metrics: {
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        activeSubscribers: activeSubscriptions.length,
        totalSubscriptions: allSubscriptions,
        totalCollected
      },
      plans,
      recentOrders,
      recentInvoices,
      gateways,
      billingSettings,
      gatewayHealth: {
        bkash: bkashHealth
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.isPlatformAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, gateway, gatewayData, billingSettings } = body;

    if (action === 'TOGGLE_GATEWAY' && gateway) {
      const updated = await db.paymentGatewayConfig.update({
        where: { gateway },
        data: gatewayData
      });
      return NextResponse.json({ success: true, gateway: updated });
    }

    if (action === 'UPDATE_BILLING_SETTINGS' && billingSettings) {
      const updated = await db.platformBillingSettings.upsert({
        where: { id: 'default' },
        update: billingSettings,
        create: { id: 'default', ...billingSettings }
      });
      return NextResponse.json({ success: true, billingSettings: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
