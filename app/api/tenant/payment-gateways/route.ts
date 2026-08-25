import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenantSlug') || session.tenantSlug;

    if (!tenantSlug) {
      return apiError('TENANT_REQUIRED', 'Tenant identifier is required.', 400);
    }

    const tenant = await requireTenant(tenantSlug);
    const gateways = await PaymentGatewayService.getTenantGateways(tenant.tenantId);

    // Also fetch offline payments awaiting review
    const pendingOffline = await db.offlinePaymentRecord.findMany({
      where: { tenantId: tenant.tenantId },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return apiSuccess({
      tenantSlug: tenant.slug,
      gateways,
      offlinePayments: pendingOffline
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error fetching tenant payment gateways', status);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    const body = await request.json();
    const { tenantSlug, gateway, data } = body;

    const resolvedSlug = tenantSlug || session.tenantSlug;
    if (!resolvedSlug) {
      return apiError('TENANT_REQUIRED', 'Tenant identifier is required.', 400);
    }

    const tenant = await requireTenant(resolvedSlug);

    // Verify tenant permission: only OWNER, PRINCIPAL, HEADMASTER or PLATFORM_SUPER_ADMIN can configure tenant merchant credentials
    const allowedRoles = ['PLATFORM_SUPER_ADMIN', 'OWNER', 'PRINCIPAL', 'HEADMASTER', 'ADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return apiError('FORBIDDEN', 'Only institution administrators can update payment gateway credentials.', 403);
    }

    // Verify if platform policy allows tenant overrides for this gateway
    const platformGateway = await db.paymentGatewayConfig.findFirst({
      where: { scope: 'PLATFORM', gateway, tenantId: null }
    });

    if (platformGateway && !platformGateway.allowTenantOverride && session.role !== 'PLATFORM_SUPER_ADMIN') {
      return apiError('OVERRIDE_NOT_PERMITTED', 'Platform policy does not permit custom merchant override for this gateway.', 403);
    }

    const saved = await PaymentGatewayService.saveGatewayConfig({
      gateway,
      scope: 'TENANT',
      tenantId: tenant.tenantId,
      data,
      actor: {
        userId: session.id || 'system',
        role: session.role,
        email: session.email
      }
    });

    return apiSuccess({
      gateway: {
        ...saved,
        encryptedCredentials: undefined // Never expose ciphertext
      }
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error updating tenant gateway settings', status);
  }
}
