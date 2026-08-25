import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    // Role verification: only ACCOUNTANT, ADMIN, HEADMASTER, PRINCIPAL, OWNER or PLATFORM_SUPER_ADMIN
    const allowedRoles = ['PLATFORM_SUPER_ADMIN', 'OWNER', 'PRINCIPAL', 'HEADMASTER', 'ADMIN', 'ACCOUNTANT'];
    if (!allowedRoles.includes(session.role)) {
      return apiError('FORBIDDEN', 'Insufficient permissions to verify offline payments.', 403);
    }

    const body = await request.json();
    const { recordId, action, rejectionReason } = body;

    if (!recordId) {
      return apiError('INVALID_INPUT', 'Record ID is required.', 400);
    }

    if (action !== 'VERIFY' && action !== 'REJECT') {
      return apiError('INVALID_ACTION', 'Action must be either VERIFY or REJECT.', 400);
    }

    const result = await PaymentGatewayService.verifyOfflinePayment({
      recordId,
      action,
      rejectionReason,
      actor: {
        userId: session.id || 'system',
        email: session.email,
        role: session.role
      }
    });

    return apiSuccess(result);
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'VERIFICATION_FAILED', error.message || 'Error processing offline payment verification', status);
  }
}
