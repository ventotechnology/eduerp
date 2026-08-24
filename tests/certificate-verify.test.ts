import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { generateVerificationHash } from '@/lib/certificate-generator';
import { createSessionToken, verifySessionToken } from '@/lib/auth/session';

describe('Security, Passwords, Sessions & Certificate Hashes', () => {
  it('hashes passwords securely and verifies correct plain text', () => {
    const password = 'SuperSecretEduPassword2026!';
    const hash = hashPassword(password);

    expect(hash).toContain(':');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('generates deterministic verification hash format for certificates', () => {
    const hash = generateVerificationHash('STU-1001', 'TRANSCRIPT');
    expect(hash).toMatch(/^VRF-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('creates and verifies cryptographically signed session tokens', () => {
    const token = createSessionToken({
      userId: 'USR-TEST-01',
      email: 'admin@dims.edu.bd',
      role: 'PRINCIPAL',
      tenantId: 'TENANT-DIMS'
    });

    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('USR-TEST-01');
    expect(payload?.email).toBe('admin@dims.edu.bd');
    expect(payload?.role).toBe('PRINCIPAL');
  });

  it('rejects tampered session tokens', () => {
    const token = createSessionToken({
      userId: 'USR-TEST-01',
      email: 'admin@dims.edu.bd',
      role: 'PRINCIPAL',
      tenantId: 'TENANT-DIMS'
    });

    const tampered = token.slice(0, -4) + 'XXXX';
    expect(verifySessionToken(tampered)).toBeNull();
  });
});
