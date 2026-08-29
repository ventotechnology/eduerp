import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateServiceAuth } from '@/lib/venomin/auth';
import { getCustomerSafeError, VENOMIN_ERROR_CODES } from '@/lib/venomin/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authContext = await validateServiceAuth(req, 'eduerp:read');
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

  const { id } = await params;

  const record = await db.venominProvisioningRequest.findFirst({
    where: {
      OR: [{ requestId: id }, { idempotencyKey: id }, { venominCustomerId: id }],
    },
  });

  if (!record) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        safeMessage: `Provisioning record not found for ID: ${id}`,
      },
      { status: 404 }
    );
  }

  let tenantSlug = 'dashboard';
  if (record.tenantId) {
    const tenant = await db.tenant.findUnique({ where: { id: record.tenantId } });
    if (tenant) tenantSlug = tenant.slug;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduerp.us';

  return NextResponse.json({
    requestId: record.requestId,
    status: record.status,
    tenantId: record.tenantId,
    institutionId: record.institutionId,
    externalUserId: record.userId,
    tenantSlug,
    launchUrl: `${appUrl}/${tenantSlug}/dashboard`,
    safeMessage:
      record.status === 'SUCCESS'
        ? 'EduERP educational institution workspace is active and ready.'
        : 'Provisioning is pending or failed.',
    completedAt: record.completedAt?.toISOString(),
  });
}
