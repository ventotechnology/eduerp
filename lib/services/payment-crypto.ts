import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derives a consistent 256-bit encryption key from server environment secrets
 */
export function getPaymentEncryptionKey(): Buffer {
  const secret =
    process.env.PAYMENT_ENCRYPTION_SECRET ||
    process.env.SMS_ENCRYPTION_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    'eduerp-production-fallback-key-2026-secure-seed';

  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Output format: v1:<iv_hex>:<auth_tag_hex>:<cipher_hex>
 */
export function encryptPaymentValue(value: string): string {
  if (!value) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getPaymentEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string
 */
export function decryptPaymentValue(encryptedString: string): string {
  if (!encryptedString) return '';

  const parts = encryptedString.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    // If it's not encrypted with v1 prefix, return empty or handle safely
    return '';
  }

  const [, ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getPaymentEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts a credentials dictionary into a secure string for database persistence
 */
export function encryptPaymentCredentials(credentials: Record<string, any>): string {
  if (!credentials || Object.keys(credentials).length === 0) return '';
  return encryptPaymentValue(JSON.stringify(credentials));
}

/**
 * Decrypts a stored credentials string into an object
 */
export function decryptPaymentCredentials(encryptedString?: string | null): Record<string, any> {
  if (!encryptedString) return {};
  try {
    const decrypted = decryptPaymentValue(encryptedString);
    if (!decrypted) return {};
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

/**
 * Masks credentials for UI and API responses so raw secrets are never sent to the browser
 */
export function maskPaymentCredentials(credentials: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};

  for (const [key, val] of Object.entries(credentials || {})) {
    if (val === null || val === undefined || typeof val !== 'string' || val.trim() === '') {
      continue;
    }

    const lower = key.toLowerCase();
    const isSensitive =
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('key') ||
      lower.includes('token') ||
      lower.includes('pin') ||
      lower.includes('credential') ||
      lower.includes('private');

    if (isSensitive) {
      if (val.length <= 4) {
        masked[key] = '••••';
      } else {
        masked[key] = `••••••••${val.slice(-4)}`;
      }
    } else {
      masked[key] = val;
    }
  }

  return masked;
}
