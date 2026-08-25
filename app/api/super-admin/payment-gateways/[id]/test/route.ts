import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    requirePlatformPermission(session, 'GATEWAY_VIEW');

    const { id } = await params;
    const gateway = await db.paymentGatewayConfig.findUnique({ where: { id } });

    if (!gateway) {
      return apiError('GATEWAY_NOT_FOUND', 'Payment gateway configuration not found.', 404);
    }

    const testResult = await PaymentGatewayService.testGatewayConnection({
      gatewayId: gateway.id,
      gateway: gateway.gateway,
      scope: gateway.scope as any,
      tenantId: gateway.tenantId,
      actor: {
        userId: session.id || 'system',
        email: session.email
      }
    });

    return apiSuccess(testResult);
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError('TEST_FAILED', error.message || 'Error testing gateway ping', status);
  }
}
