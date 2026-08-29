import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateServiceAuth } from '@/lib/venomin/auth';
import { SuspendRequestSchema } from '@/lib/venomin/schemas';
import { dispatchVenominWebhook } from '@/lib/venomin/webhooks';
import { logVenominIntegrationEvent } from '@/lib/venomin/logger';
import { getCustomerSafeError, VENOMIN_ERROR_CODES } from '@/lib/venomin/errors';
import { TenantProvisioningStatus } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authContext = await validateServiceAuth(req, 'eduerp:suspend');
  if (!authContext.authenticated) {
    const errorDetails = getCustomerSafeError(authContext.errorCode || VENOMIN_ERROR_CODES.UNAUTHORIZED);
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: authContext.errorCode || VENOMIN_ERROR_CODES.UNAUTHORIZED,
        safeMessage: errorDetails.safeMessage,
      },
      { status: errorDetails.status }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: 'FAILED', errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION, safeMessage: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const parseResult = SuspendRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION,
        safeMessage: 'Invalid suspension parameters.',
      },
      { status: 400 }
    );
  }

  const { walletmixCustomerId, reason, tenantId } = parseResult.data;

  const link = await db.venominIdentityLink.findUnique({
    where: { walletmixCustomerId },
    include: { tenant: true },
  });

  const targetTenantId = tenantId || link?.tenantId;

  if (!targetTenantId) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        safeMessage: 'No educational institution workspace found for this customer identity.',
      },
      { status: 404 }
    );
  }

  // Non-destructive suspension: updates status only, preserves all student and academic data
  await db.tenant.update({
    where: { id: targetTenantId },
    data: {
      status: TenantProvisioningStatus.SUSPENDED,
      isActive: false,
    },
  });

  if (link) {
    await db.venominIdentityLink.update({
      where: { id: link.id },
      data: { status: 'SUSPENDED' },
    });
  }

  await logVenominIntegrationEvent({
    operation: 'SUSPEND_TENANT',
    status: 'SUCCESS',
    safeMessage: `Suspended EduERP tenant ${targetTenantId} for customer ${walletmixCustomerId}. Reason: ${reason || 'None provided'}`,
  });

  // Dispatch signed webhook to Venomin
  await dispatchVenominWebhook({
    eventId: `evt_eduerp_susp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    eventType: 'tenant.suspended',
    timestamp: Math.floor(Date.now() / 1000),
    productSlug: 'eduerp',
    tenantId: targetTenantId,
    walletmixCustomerId,
    environment: authContext.claims?.environment || 'STAGING',
    payload: {
      tenantId: targetTenantId,
      status: 'SUSPENDED',
      reason: reason || 'Commercial subscription suspended',
    },
  });

  return NextResponse.json({
    status: 'SUCCESS',
    tenantId: targetTenantId,
    safeMessage: 'Educational institution workspace suspended successfully.',
  });
}
