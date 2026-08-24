import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hashes a plain password using PBKDF2 with a random cryptographic salt.
 * Returns formatted string: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored salt:hash string in constant time.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(checkHash, 'utf8'), Buffer.from(originalHash, 'utf8'));
}

/**
 * Generates a high-entropy cryptographically random password (26 characters)
 */
export function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const all = upper + lower + digits + symbols;

  const bytes = crypto.randomBytes(32);
  let pwd = '';
  pwd += upper[bytes[0] % upper.length];
  pwd += upper[bytes[1] % upper.length];
  pwd += lower[bytes[2] % lower.length];
  pwd += lower[bytes[3] % lower.length];
  pwd += digits[bytes[4] % digits.length];
  pwd += digits[bytes[5] % digits.length];
  pwd += symbols[bytes[6] % symbols.length];
  pwd += symbols[bytes[7] % symbols.length];

  for (let i = 8; i < 26; i++) {
    pwd += all[bytes[i] % all.length];
  }

  const arr = pwd.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
