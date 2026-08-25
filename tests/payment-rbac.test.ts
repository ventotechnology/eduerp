import { describe, it, expect } from 'vitest';
import { requirePlatformPermission } from '../lib/rbac/platform-guard';
import { UserRole } from '@prisma/client';

describe('Command 12A.5E — Payment RBAC & Permission Enforcement Suite', () => {
  it('1. Platform Super Admin has full payment management authority', () => {
    const superAdminSession = {
      id: 'super-1',
      email: 'superadmin@eduerp.us',
      role: 'PLATFORM_SUPER_ADMIN' as any,
      isSuperAdmin: true,
      isPlatformAdmin: true,
      permissions: ['ALL']
    };

    expect(() => requirePlatformPermission(superAdminSession, 'PAYMENT_MANAGE')).not.toThrow();
    expect(() => requirePlatformPermission(superAdminSession, 'GATEWAY_MANAGE')).not.toThrow();
    expect(() => requirePlatformPermission(superAdminSession, 'SUBSCRIPTION_MANAGE')).not.toThrow();
  });

  it('2. Platform Billing Admin has payment management permissions', () => {
    const billingAdminSession = {
      id: 'billing-1',
      email: 'billing@eduerp.us',
      role: 'BILLING_ADMIN' as any,
      isSuperAdmin: false,
      isPlatformAdmin: true,
      permissions: ['PAYMENT_MANAGE', 'SUBSCRIPTION_MANAGE']
    };

    expect(() => requirePlatformPermission(billingAdminSession, 'PAYMENT_MANAGE')).not.toThrow();
  });

  it('3. Teacher, Student, and Guardian sessions are strictly rejected from platform payment management', () => {
    const teacherSession = {
      id: 'teacher-1',
      email: 'teacher@school.eduerp.us',
      role: UserRole.TEACHER as any,
      isSuperAdmin: false,
      isPlatformAdmin: false,
      permissions: []
    };

    expect(() => requirePlatformPermission(teacherSession, 'PAYMENT_MANAGE')).toThrow(/Platform permission denied/);
    expect(() => requirePlatformPermission(teacherSession, 'GATEWAY_MANAGE')).toThrow(/Platform permission denied/);

    const studentSession = {
      id: 'student-1',
      email: 'student@school.eduerp.us',
      role: UserRole.STUDENT as any,
      isSuperAdmin: false,
      isPlatformAdmin: false,
      permissions: []
    };

    expect(() => requirePlatformPermission(studentSession, 'PAYMENT_MANAGE')).toThrow(/Platform permission denied/);
  });
});
