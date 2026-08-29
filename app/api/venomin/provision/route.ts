import { NextRequest, NextResponse } from 'next/server';
import { validateServiceAuth } from '@/lib/venomin/auth';
import { ProvisionRequestSchema } from '@/lib/venomin/schemas';
import { provisionEduerpTenant } from '@/lib/venomin/provisioning';
import { getCustomerSafeError, VENOMIN_ERROR_CODES } from '@/lib/venomin/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Validate Service JWT and Scope
  const authContext = await validateServiceAuth(req, 'eduerp:provision');
  if (!authContext.authenticated) {
    const errorDetails = getCustomerSafeError(authContext.errorCode || VENOMIN_ERROR_CODES.UNAUTHORIZED);
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: authContext.errorCode || VENOMIN_ERROR_CODES.UNAUTHORIZED,
        safeMessage: errorDetails.safeMessage,
        details: authContext.errorMessage,
      },
      { status: errorDetails.status }
    );
  }

  // 2. Parse & Validate Payload Schema
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION,
        safeMessage: 'Invalid JSON request payload.',
      },
      { status: 400 }
    );
  }

  const parseResult = ProvisionRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        status: 'FAILED',
        errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION,
        safeMessage: 'Provisioning request parameters failed validation.',
        errors: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  // 3. Execute Multi-Tenant Provisioning
  const response = await provisionEduerpTenant(parseResult.data);

  if (response.status === 'FAILED') {
    const errorDetails = getCustomerSafeError(response.errorCode || VENOMIN_ERROR_CODES.TENANT_CREATION_FAILED);
    return NextResponse.json(response, { status: errorDetails.status });
  }

  return NextResponse.json(response, { status: 200 });
}
