import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { QA_ACCOUNT_DEFINITIONS } from '@/lib/demo/demo-account-definitions';
import { generateSecurePassword } from '@/lib/auth/password';

describe('COMMAND 10.1: Security Remediation, Migration Discipline & QA Hardening Suite', () => {
  const rootDir = process.cwd();

  it('1. Verifies QA account definitions contain no hardcoded plaintext passwords', () => {
    for (const def of QA_ACCOUNT_DEFINITIONS) {
      expect((def as any).password).toBeUndefined();
      expect(def.email).toBeDefined();
      expect(def.role).toBeDefined();
      expect(def.loginUrl).toBe('https://eduerp.us/login');
    }
  });

  it('2. Verifies private QA credentials files are strictly gitignored', () => {
    const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
    expect(gitignoreContent).toContain('EDUERP-ONLINE-TEST-CREDENTIALS.txt');
    expect(gitignoreContent).toContain('EDUERP-ONLINE-TEST-CREDENTIALS.csv');
  });

  it('3. Verifies 100% coverage of UserRole enum in QA matrix', () => {
    const schemaContent = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
    const enumMatch = schemaContent.match(/enum UserRole \{([^}]+)\}/);
    expect(enumMatch).toBeDefined();

    const schemaRoles = enumMatch![1]
      .split('\n')
      .map(line => line.trim().split('//')[0].trim())
      .filter(Boolean);

    const qaRoles = new Set(QA_ACCOUNT_DEFINITIONS.map(a => a.role));

    for (const role of schemaRoles) {
      expect(qaRoles.has(role), `Role ${role} must be covered in QA accounts`).toBe(true);
    }
  });

  it('4. Verifies production deployment scripts contain NO "prisma db push" or "--accept-data-loss"', () => {
    const deployYml = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
    expect(deployYml).not.toContain('prisma db push');
    expect(deployYml).not.toContain('--accept-data-loss');
    expect(deployYml).toContain('prisma migrate deploy');
  });

  it('5. Verifies CI pipeline uses PostgreSQL 16 service container, not SQLite', () => {
    const ciYml = fs.readFileSync(path.join(rootDir, '.github/workflows/ci.yml'), 'utf8');
    expect(ciYml).toContain('postgres:16-alpine');
    expect(ciYml).toContain('prisma migrate deploy');
    expect(ciYml).not.toContain('dev.db');
  });

  it('6. Verifies canonical Prisma schema specifies PostgreSQL datasource provider', () => {
    const schemaContent = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
    expect(schemaContent).toContain('provider = "postgresql"');
    expect(schemaContent).not.toMatch(/provider\s*=\s*"sqlite"/);
  });

  it('7. Verifies Dockerfile contains no sed manipulation of datasource provider', () => {
    const dockerfileContent = fs.readFileSync(path.join(rootDir, 'Dockerfile'), 'utf8');
    expect(dockerfileContent).not.toContain('sed -i');
    expect(dockerfileContent).toContain('prisma generate');
  });

  it('8. Verifies restore script contains safety guard refusing eduerp_prod without explicit flag', () => {
    const restoreScript = fs.readFileSync(path.join(rootDir, 'scripts/restore-db.sh'), 'utf8');
    expect(restoreScript).toContain('--allow-production-restore');
    expect(restoreScript).toContain('Direct restoration into production database');
  });

  it('9. Verifies random password generator generates unique, high-entropy passwords', () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const pwd = generateSecurePassword();
      expect(pwd.length).toBeGreaterThanOrEqual(24);
      expect(passwords.has(pwd)).toBe(false);
      passwords.add(pwd);
    }
  });
});
