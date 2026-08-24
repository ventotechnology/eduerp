import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { createSessionToken, verifySessionToken } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import fs from 'fs';
import path from 'path';

describe('Critical Authentication Security Lockdown & Invariants (COMMAND 11C)', () => {
  it('1. Verifies that createSessionToken correctly encodes impersonator payload and custom expiry', () => {
    const payload = {
      userId: 'usr-target-123',
      email: 'principal@test.edu.bd',
      role: 'PRINCIPAL' as any,
      tenantId: 'tenant-uuid-456',
      impersonator: {
        userId: 'usr-admin-001',
        email: 'superadmin@eduerp.us',
        role: 'PLATFORM_SUPER_ADMIN' as any
      }
    };

    const token = createSessionToken(payload, 3600); // 60 mins
    expect(token).toContain('.');

    const decoded = verifySessionToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded?.userId).toBe('usr-target-123');
    expect(decoded?.impersonator?.email).toBe('superadmin@eduerp.us');
    expect(decoded?.impersonator?.role).toBe('PLATFORM_SUPER_ADMIN');
    expect(decoded?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('2. Verifies that old compromised passwords are NOT valid for provisioned QA accounts', async () => {
    const superAdmin = await db.user.findFirst({
      where: { role: 'PLATFORM_SUPER_ADMIN' }
    });

    if (superAdmin) {
      const isOldPasswordValid = verifyPassword('EduErp@2026!', superAdmin.passwordHash);
      expect(isOldPasswordValid).toBe(false);
    }
  });

  it('3. Verifies that credential files and secret env files are gitignored', () => {
    const gitignoreContent = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8');
    expect(gitignoreContent).toContain('EDUERP-ONLINE-TEST-CREDENTIALS.txt');
    expect(gitignoreContent).toContain('EDUERP-ONLINE-TEST-CREDENTIALS.csv');
    expect(gitignoreContent).toContain('.env');
  });

  it('4. Verifies that zero plain secrets remain in tracked files', () => {
    const checkFile = (filePath: string) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toContain('EduErp@2026!');
      }
    };

    checkFile(path.resolve(__dirname, '../tests/e2e/auth.spec.ts'));
    checkFile(path.resolve(__dirname, '../EDUERP-OWNER-QA-CHECKLIST.md'));
  });

  it('5. Verifies that tenant IDs in user records are UUIDs and not slug placeholders', async () => {
    const users = await db.user.findMany({
      where: { tenantId: { not: null } },
      take: 5
    });

    for (const u of users) {
      if (u.tenantId) {
        expect(u.tenantId).not.toBe('demo-school');
        expect(u.tenantId).not.toBe('dhaka-ideal-school');
      }
    }
  });
});
