import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { VENOMIN_ERROR_CODES } from './errors';
import { ServiceAuthContext, IntegrationEnvironment } from './types';

function getServiceSecret(): Uint8Array {
  const secret =
    process.env.VENOMIN_JWT_SECRET ||
    process.env.WALLETMIX_JWT_SECRET ||
    'wmx_dev_s2s_secret_key_892019481029384756102938';
  return new TextEncoder().encode(secret);
}

/**
 * Validates inbound Service JWT authentication and required scopes for EduERP
 */
export async function validateServiceAuth(
  request: NextRequest,
  requiredScope?: string
): Promise<ServiceAuthContext> {
  // 1. Validate Contract Version Header
  const version =
    request.headers.get('x-venomin-integration-version') ||
    request.headers.get('x-walletmix-integration-version');

  if (version && version !== 'v1') {
    return {
      authenticated: false,
      errorCode: VENOMIN_ERROR_CODES.INVALID_VERSION,
      errorMessage: `Unsupported integration version: ${version}. Required: v1`,
    };
  }

  // 2. Extract Authorization Header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      errorCode: VENOMIN_ERROR_CODES.UNAUTHORIZED,
      errorMessage: 'Missing or malformed Authorization header. Bearer token required.',
    };
  }

  const token = authHeader.substring(7);

  try {
    const expectedAudience =
      process.env.VENOMIN_AUDIENCE ||
      process.env.WALLETMIX_AUDIENCE ||
      'eduerp.us';

    const { payload } = await jwtVerify(token, getServiceSecret(), {
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
        authenticated: false,
        errorCode: VENOMIN_ERROR_CODES.AUTH_FAILED,
        errorMessage: `Audience mismatch for EduERP. Expected ${expectedAudience}, got ${JSON.stringify(payload.aud)}`,
      };
    }

    const env = (payload.environment as IntegrationEnvironment) || 'DEVELOPMENT';

    // 3. Hard Production Block
    const isProductionAllowed = process.env.ENABLE_PRODUCT_PRODUCTION_INTEGRATIONS === 'true';
    if (env === 'PRODUCTION' && !isProductionAllowed) {
      return {
        authenticated: false,
        errorCode: VENOMIN_ERROR_CODES.PRODUCTION_MODE_BLOCKED,
        errorMessage: 'Production product integration is blocked by EduERP security policy.',
      };
    }

    // 4. Scope Validation
    if (requiredScope) {
      const scopes = Array.isArray(payload.scope)
        ? (payload.scope as string[])
        : typeof payload.scope === 'string'
        ? [payload.scope]
        : [];

      if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
        return {
          authenticated: false,
          errorCode: VENOMIN_ERROR_CODES.INSUFFICIENT_SCOPE,
          errorMessage: `Token missing required scope: ${requiredScope}`,
        };
      }
    }

    return {
      authenticated: true,
      claims: {
        sub: payload.sub as string,
        scope: Array.isArray(payload.scope) ? (payload.scope as string[]) : [],
        product: payload.product as string,
        environment: env,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid token';
    return {
      authenticated: false,
      errorCode: VENOMIN_ERROR_CODES.AUTH_FAILED,
      errorMessage: `JWT verification failed: ${errorMsg}`,
    };
  }
}
