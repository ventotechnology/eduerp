import { describe, it, expect } from 'vitest';
import { requireTenantUser } from '@/lib/tenant/tenant-guard';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Tenant Isolation & Cross-Tenant Boundary Guard', () => {
  const schoolAUser: SessionUser = {
    id: 'USR-01',
    email: 'teacher@school-a.edu.bd',
    name: 'Tariqul Islam',
    role: 'TEACHER',
    tenantId: 'TENANT-SCHOOL-A',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  const superAdminUser: SessionUser = {
    id: 'USR-SUPER',
    email: 'admin@eduerp.us',
    name: 'Platform Super Admin',
    role: 'PLATFORM_SUPER_ADMIN',
    tenantId: null,
    status: UserStatus.ACTIVE,
    isPlatformAdmin: true
  };

  it('allows access when user tenant matches target tenant', () => {
    expect(() => {
      requireTenantUser(schoolAUser, 'TENANT-SCHOOL-A');
    }).not.toThrow();
  });

  it('strictly BLOCKS access when user from School A tries to access University B', () => {
    expect(() => {
      requireTenantUser(schoolAUser, 'TENANT-UNIV-B');
    }).toThrow(/FORBIDDEN: You do not have permission to access data belonging to another educational institution/);
  });

  it('allows global access across all tenants for Platform Super Admin', () => {
    expect(() => {
      requireTenantUser(superAdminUser, 'TENANT-SCHOOL-A');
    }).not.toThrow();

    expect(() => {
      requireTenantUser(superAdminUser, 'TENANT-UNIV-B');
    }).not.toThrow();
  });
});
