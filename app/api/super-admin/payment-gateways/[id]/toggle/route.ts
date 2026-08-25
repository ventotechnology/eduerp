import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
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

    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const { id } = await params;
    const body = await request.json();
    const { field, value } = body; // field: 'isEnabled' | 'isSandbox' | 'checkoutEnabled'

    const gateway = await db.paymentGatewayConfig.findUnique({ where: { id } });
    if (!gateway) {
      return apiError('GATEWAY_NOT_FOUND', 'Payment gateway configuration not found.', 404);
    }

    const updateData: any = {};
    if (field === 'isEnabled') {
      updateData.isEnabled = Boolean(value);
      if (!value) {
        updateData.healthStatus = 'DISABLED';
      }
    } else if (field === 'isSandbox') {
      updateData.isSandbox = Boolean(value);
    } else if (field === 'checkoutEnabled') {
      updateData.checkoutEnabled = Boolean(value);
    }

    const updated = await db.paymentGatewayConfig.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.email || session.id
      }
    });

    await db.auditLog.create({
      data: {
        action: `PAYMENT_GATEWAY_${field.toUpperCase()}_TOGGLED`,
        resourceType: 'PAYMENT_GATEWAY',
        resourceId: id,
        userId: session.id,
        userName: session.email || session.id,
        userRole: session.role,
        newState: JSON.stringify({
          gateway: gateway.gateway,
          field,
          newValue: value
        })
      }
    });

    return apiSuccess({ gateway: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError('TOGGLE_FAILED', error.message || 'Error toggling gateway state', status);
  }
}
