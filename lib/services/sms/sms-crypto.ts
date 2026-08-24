import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

export function getEncryptionKey(): Buffer {
  const secret = process.env.SMS_ENCRYPTION_SECRET || process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('CRITICAL SECURITY ERROR: SMS/Sensitive encryption secret is not configured in environment. Failing closed.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts arbitrary string value
 */
export function encryptSensitiveValue(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts arbitrary string value
 */
export function decryptSensitiveValue(encryptedString: string): string {
  if (!encryptedString) return '';

  const parts = encryptedString.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Invalid or corrupted sensitive value format.');
  }

  const [, ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts provider credentials payload using AES-256-GCM
 */
export function encryptSmsCredentials(credentials: Record<string, any>): string {
  return encryptSensitiveValue(JSON.stringify(credentials));
}

/**
 * Decrypts provider credentials payload using AES-256-GCM
 */
export function decryptSmsCredentials(encryptedString: string): Record<string, any> {
  if (!encryptedString) return {};
  const decrypted = decryptSensitiveValue(encryptedString);
  return JSON.parse(decrypted);
}

/**
 * Masks credentials for secure API responses
 */
export function maskSmsCredentials(credentials: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};

  for (const [key, val] of Object.entries(credentials || {})) {
    if (typeof val !== 'string' || !val) {
      masked[key] = val;
      continue;
    }

    const lower = key.toLowerCase();
    if (
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('key') ||
      lower.includes('token') ||
      lower.includes('credential') ||
      lower.includes('pass')
    ) {
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
