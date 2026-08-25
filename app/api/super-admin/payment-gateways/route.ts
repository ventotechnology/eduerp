import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    requirePlatformPermission(session, 'GATEWAY_VIEW');

    const [gateways, metrics] = await Promise.all([
      PaymentGatewayService.getPlatformGateways(),
      PaymentGatewayService.getPaymentDashboardMetrics()
    ]);

    return apiSuccess({
      gateways,
      metrics
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error fetching payment gateways', status);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { gateway, data } = body;

    if (!gateway) {
      return apiError('INVALID_INPUT', 'Gateway code is required.', 400);
    }

    const saved = await PaymentGatewayService.saveGatewayConfig({
      gateway,
      scope: 'PLATFORM',
      tenantId: null,
      data: data || body,
      actor: {
        userId: session.id || 'system',
        role: session.role || 'PLATFORM_SUPER_ADMIN',
        email: session.email
      }
    });

    return apiSuccess({ gateway: saved });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error creating payment gateway', status);
  }
}
