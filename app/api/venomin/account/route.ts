import { NextRequest, NextResponse } from 'next/server';
import { validateServiceAuth } from '@/lib/venomin/auth';
import { getAccountSyncData } from '@/lib/venomin/account-sync';
import { getCustomerSafeError, VENOMIN_ERROR_CODES } from '@/lib/venomin/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const venominCustomerId =
    req.nextUrl.searchParams.get('walletmixCustomerId') ||
    req.nextUrl.searchParams.get('venominCustomerId');

  if (!venominCustomerId) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION,
        safeMessage: 'Customer ID query parameter is required for account synchronization.',
      },
      { status: 400 }
    );
  }

  const data = await getAccountSyncData(venominCustomerId);

  if (!data) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        safeMessage: 'No educational institution workspace found linked to this customer identity.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
