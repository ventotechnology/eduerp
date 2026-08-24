import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantSlug, planId, billingCycle = 'MONTHLY', gateway = 'BKASH' } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID is required.' }, { status: 400 });
    }

    // Resolve tenant
    let targetTenantId = session.tenantId;
    if (session.isPlatformAdmin && tenantSlug) {
      const t = await db.tenant.findUnique({ where: { slug: tenantSlug } });
      if (t) targetTenantId = t.id;
    } else if (!targetTenantId && tenantSlug) {
      const t = await db.tenant.findUnique({ where: { slug: tenantSlug } });
      if (t) targetTenantId = t.id;
    }

    if (!targetTenantId) {
      return NextResponse.json({ success: false, error: 'Target tenant could not be resolved.' }, { status: 400 });
    }

    const order = await SaasCheckoutService.createTenantSubscriptionOrder({
      tenantId: targetTenantId,
      planId,
      billingCycle,
      gateway
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        planName: order.plan.name,
        billingCycle: order.billingCycle,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create subscription order.'
    }, { status: 400 });
  }
}
