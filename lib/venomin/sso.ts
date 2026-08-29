import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { createSessionToken } from '@/lib/auth/session';
import { VENOMIN_ERROR_CODES } from './errors';
import { SSOResult } from './types';
import { logVenominIntegrationEvent } from './logger';
import { TenantProvisioningStatus } from '@prisma/client';

function getSSOSecret(): Uint8Array {
  const secret =
    process.env.SSO_SIGNING_KEY ||
    process.env.VENOMIN_JWT_SECRET ||
    process.env.WALLETMIX_JWT_SECRET ||
    'walletmix_sso_development_signing_key_2026';
  return new TextEncoder().encode(secret);
}

/**
 * Exchanges short-lived Venomin SSO token for native EduERP session
 */
export async function exchangeSSOToken(token: string): Promise<SSOResult> {
  const startTime = Date.now();

  try {
    const expectedAudience =
      process.env.VENOMIN_AUDIENCE ||
      process.env.WALLETMIX_AUDIENCE ||
      'eduerp.us';

    const { payload } = await jwtVerify(token, getSSOSecret(), {
      issuer: ['https://venomin.com', 'https://walletmix.com'],
    });

    const aud = payload.aud;
    const audArray = Array.isArray(aud) ? aud : [aud];
    const audienceMatch = audArray.some(
      (a) =>
        a === expectedAudience ||
        a === 'eduerp.us' ||
        a === 'eduerp.staging.walletmix.com' ||
        a === 'eduerp.staging.venomin.com' ||
        a === 'localhost:3000' ||
        a === 'localhost:3001' ||
        a === 'localhost:3002'
    );

    if (!audienceMatch) {
      return {
        success: false,
        errorCode: VENOMIN_ERROR_CODES.SSO_INVALID,
        errorMessage: `Audience mismatch for EduERP SSO. Found: ${JSON.stringify(payload.aud)}`,
      };
    }

    const venominCustomerId = payload.sub as string;

    if (!venominCustomerId) {
      return {
        success: false,
        errorCode: VENOMIN_ERROR_CODES.SSO_INVALID,
        errorMessage: 'Missing customer identity in SSO token.',
      };
    }

    // 1. Resolve Identity Link
    const link = await db.venominIdentityLink.findUnique({
      where: { walletmixCustomerId: venominCustomerId },
      include: {
        tenant: true,
        institution: true,
        user: true,
      },
    });

    if (!link || !link.userId || !link.tenantId) {
      await logVenominIntegrationEvent({
        operation: 'SSO_EXCHANGE',
        status: 'FAILURE',
        safeMessage: `Identity link not found for customer ${venominCustomerId}`,
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
      });

      return {
        success: false,
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        errorMessage: `Educational institution workspace not provisioned for Venomin customer ID: ${venominCustomerId}.`,
      };
    }

    // 2. Verify User and Tenant
    const user = link.user;
    if (!user || user.status !== 'ACTIVE') {
      return {
        success: false,
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        errorMessage: 'Associated institution administrator account is inactive or not found.',
      };
    }

    const tenant = link.tenant;
    if (!tenant) {
      return {
        success: false,
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        errorMessage: 'Associated institution tenant not found.',
      };
    }

    if (tenant.status === TenantProvisioningStatus.SUSPENDED || tenant.status === TenantProvisioningStatus.CANCELLED) {
      return {
        success: false,
        errorCode: 'TENANT_SUSPENDED',
        errorMessage: 'Educational institution workspace is suspended.',
      };
    }

    // 3. Create Native EduERP Session Token
    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });

    const durationMs = Date.now() - startTime;
    await logVenominIntegrationEvent({
      operation: 'SSO_EXCHANGE',
      status: 'SUCCESS',
      actorId: user.id,
      safeMessage: `SSO session established for user ${user.id} in tenant ${tenant.slug} (${durationMs}ms)`,
      metadata: {
        tenantId: tenant.id,
        durationMs,
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      sessionToken,
      redirectUrl: `/${tenant.slug}/dashboard`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'SSO token exchange failed';
    return {
      success: false,
      errorCode: VENOMIN_ERROR_CODES.SSO_INVALID,
      errorMessage: errorMsg,
    };
  }
}
