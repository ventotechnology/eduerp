import crypto from 'crypto';
import { ENV } from '../env';
import { AuthSessionPayload, SessionUser } from './types';

export const SESSION_COOKIE_NAME = 'eduerp_session';

/**
 * Creates an HMAC-signed session token.
 */
export function createSessionToken(payload: Omit<AuthSessionPayload, 'issuedAt' | 'expiresAt'>): string {
  const now = Date.now();
  const expiresAt = now + ENV.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const fullPayload: AuthSessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt
  };

  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ENV.AUTH_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-signed session token.
 */
export function verifySessionToken(token: string): AuthSessionPayload | null {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [data, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', ENV.AUTH_SECRET)
    .update(data)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: AuthSessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
