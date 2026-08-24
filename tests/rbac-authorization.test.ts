import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission } from '@/lib/rbac/guard';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Enterprise RBAC Permissions Engine', () => {
  it('allows TEACHER to create attendance and marks, but denies managing payroll or deleting students', () => {
    expect(hasPermission('TEACHER', 'CREATE', 'ATTENDANCE')).toBe(true);
    expect(hasPermission('TEACHER', 'CREATE', 'MARKS_ENTRY')).toBe(true);
    expect(hasPermission('TEACHER', 'VIEW', 'STUDENTS')).toBe(true);

    expect(hasPermission('TEACHER', 'MANAGE', 'PAYROLL')).toBe(false);
    expect(hasPermission('TEACHER', 'DELETE', 'STUDENTS')).toBe(false);
    expect(hasPermission('TEACHER', 'MANAGE', 'TENANTS')).toBe(false);
  });

  it('allows ACCOUNTANT to manage fee invoices and accounting ledger, but denies marks entry', () => {
    expect(hasPermission('ACCOUNTANT', 'MANAGE', 'FEES_INVOICES')).toBe(true);
    expect(hasPermission('ACCOUNTANT', 'MANAGE', 'ACCOUNTING_LEDGER')).toBe(true);
    expect(hasPermission('ACCOUNTANT', 'CREATE', 'MARKS_ENTRY')).toBe(false);
  });

  it('allows PRINCIPAL to approve examinations, payroll, and view audit logs', () => {
    expect(hasPermission('PRINCIPAL', 'APPROVE', 'EXAMINATIONS')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'APPROVE', 'PAYROLL')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'VIEW', 'AUDIT_LOGS')).toBe(true);
  });

  it('allows PLATFORM_SUPER_ADMIN universal access to all resources', () => {
    expect(hasPermission('PLATFORM_SUPER_ADMIN', 'MANAGE', 'TENANTS')).toBe(true);
    expect(hasPermission('PLATFORM_SUPER_ADMIN', 'DELETE', 'STUDENTS')).toBe(true);
    expect(hasPermission('PLATFORM_SUPER_ADMIN', 'APPROVE', 'PAYROLL')).toBe(true);
  });

  it('throws 403 error on unauthorized action via requirePermission', () => {
    const studentUser: SessionUser = {
      id: 'USR-STUDENT',
      email: 'student@dims.edu.bd',
      name: 'Tahmid Rahman',
      role: 'STUDENT',
      tenantId: 'TENANT-DIMS',
      status: UserStatus.ACTIVE,
      isPlatformAdmin: false
    };

    expect(() => {
      requirePermission(studentUser, 'UPDATE', 'MARKS_ENTRY');
    }).toThrow(/FORBIDDEN: Role 'STUDENT' is not authorized to perform 'UPDATE' on 'MARKS_ENTRY'/);
  });
});
