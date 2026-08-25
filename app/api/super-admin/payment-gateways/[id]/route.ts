import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { db } from '@/lib/db';
import { decryptPaymentCredentials, maskPaymentCredentials } from '@/lib/services/payment-crypto';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function GET(
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
    const gateway = await db.paymentGatewayConfig.findUnique({
      where: { id },
      include: {
        healthLogs: {
          take: 10,
          orderBy: { checkedAt: 'desc' }
        }
      }
    });

    if (!gateway) {
      return apiError('GATEWAY_NOT_FOUND', 'Payment gateway configuration not found.', 404);
    }

    const decrypted = decryptPaymentCredentials(gateway.encryptedCredentials);
    const masked = maskPaymentCredentials(decrypted);

    return apiSuccess({
      gateway: {
        ...gateway,
        encryptedCredentials: undefined, // Never expose cipher or plaintext
        maskedCredentials: masked,
        hasCredentials: Object.keys(decrypted).length > 0
      }
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error fetching gateway details', status);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const { id } = await params;
    const body = await request.json();

    const existing = await db.paymentGatewayConfig.findUnique({ where: { id } });
    if (!existing) {
      return apiError('GATEWAY_NOT_FOUND', 'Payment gateway configuration not found.', 404);
    }

    const updated = await PaymentGatewayService.saveGatewayConfig({
      id: existing.id,
      gateway: existing.gateway,
      scope: existing.scope as any,
      tenantId: existing.tenantId,
      data: body,
      actor: {
        userId: session.id || 'system',
        role: session.role || 'PLATFORM_SUPER_ADMIN',
        email: session.email
      }
    });

    return apiSuccess({
      gateway: {
        ...updated,
        encryptedCredentials: undefined
      }
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error updating payment gateway', status);
  }
}
