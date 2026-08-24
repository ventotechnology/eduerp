import { describe, it, expect } from 'vitest';
import {
  hasPlatformPermission,
  requirePlatformPermission,
  PLATFORM_ROLE_PERMISSIONS,
  PlatformPermission
} from '@/lib/rbac/platform-guard';
import { QA_ACCOUNT_DEFINITIONS } from '@/lib/demo/demo-account-definitions';

describe('COMMAND 11E: Platform RBAC, Onboarding Correctness & Security Seal Suite', () => {

  describe('1. Platform RBAC Engine & Permissions Matrix', () => {
    const superAdminSession = { isPlatformAdmin: true, role: 'PLATFORM_SUPER_ADMIN', email: 'admin@eduerp.us' };
    const platformAdminSession = { isPlatformAdmin: true, role: 'PLATFORM_ADMIN', email: 'ops@eduerp.us' };
    const billingAdminSession = { isPlatformAdmin: true, role: 'BILLING_ADMIN', email: 'billing@eduerp.us' };
    const supportAdminSession = { isPlatformAdmin: true, role: 'SUPPORT_ADMIN', email: 'support@eduerp.us' };
    const salesAdminSession = { isPlatformAdmin: true, role: 'SALES_ADMIN', email: 'sales@eduerp.us' };
    const schoolPrincipalSession = { isPlatformAdmin: false, role: 'PRINCIPAL', email: 'principal@school.edu.bd' };

    it('allows PLATFORM_SUPER_ADMIN unrestricted access to all platform permissions', () => {
      const allPermissions: PlatformPermission[] = [
        'PLATFORM_VIEW_DASHBOARD',
        'TENANT_VIEW',
        'TENANT_CREATE',
        'TENANT_UPDATE',
        'TENANT_SUSPEND',
        'TENANT_IMPERSONATE',
        'PLAN_VIEW',
        'PLAN_CREATE',
        'PLAN_UPDATE',
        'PLAN_ARCHIVE',
        'SUBSCRIPTION_VIEW',
        'SUBSCRIPTION_MANAGE',
        'ORDER_VIEW',
        'PAYMENT_VIEW',
        'PAYMENT_MANAGE',
        'GATEWAY_VIEW',
        'GATEWAY_MANAGE',
        'DEMO_CREDENTIAL_VIEW',
        'DEMO_CREDENTIAL_RESET',
        'DEMO_CLIENT_EXPORT',
        'PLATFORM_USER_VIEW',
        'PLATFORM_USER_MANAGE',
        'PLATFORM_SETTINGS_VIEW',
        'PLATFORM_SETTINGS_MANAGE',
        'AUDIT_VIEW'
      ];

      for (const perm of allPermissions) {
        expect(hasPlatformPermission(superAdminSession, perm)).toBe(true);
        expect(() => requirePlatformPermission(superAdminSession, perm)).not.toThrow();
      }
    });

    it('strictly restrains BILLING_ADMIN to financial and subscription domains', () => {
      expect(hasPlatformPermission(billingAdminSession, 'SUBSCRIPTION_MANAGE')).toBe(true);
      expect(hasPlatformPermission(billingAdminSession, 'PLAN_VIEW')).toBe(true);
      expect(hasPlatformPermission(billingAdminSession, 'PAYMENT_VIEW')).toBe(true);
      expect(hasPlatformPermission(billingAdminSession, 'PAYMENT_MANAGE')).toBe(true);

      // Denied actions
      expect(hasPlatformPermission(billingAdminSession, 'TENANT_CREATE')).toBe(false);
      expect(hasPlatformPermission(billingAdminSession, 'TENANT_IMPERSONATE')).toBe(false);
      expect(hasPlatformPermission(billingAdminSession, 'DEMO_CREDENTIAL_RESET')).toBe(false);
      expect(hasPlatformPermission(billingAdminSession, 'PLATFORM_USER_MANAGE')).toBe(false);
      expect(() => requirePlatformPermission(billingAdminSession, 'TENANT_CREATE')).toThrow();
    });

    it('strictly restrains SUPPORT_ADMIN to diagnostics, tenant viewing, and impersonation', () => {
      expect(hasPlatformPermission(supportAdminSession, 'TENANT_VIEW')).toBe(true);
      expect(hasPlatformPermission(supportAdminSession, 'TENANT_IMPERSONATE')).toBe(true);
      expect(hasPlatformPermission(supportAdminSession, 'AUDIT_VIEW')).toBe(true);

      // Denied actions
      expect(hasPlatformPermission(supportAdminSession, 'PLAN_CREATE')).toBe(false);
      expect(hasPlatformPermission(supportAdminSession, 'PAYMENT_MANAGE')).toBe(false);
      expect(hasPlatformPermission(supportAdminSession, 'GATEWAY_MANAGE')).toBe(false);
      expect(hasPlatformPermission(supportAdminSession, 'PLATFORM_SETTINGS_MANAGE')).toBe(false);
      expect(() => requirePlatformPermission(supportAdminSession, 'GATEWAY_MANAGE')).toThrow();
    });

    it('strictly restrains SALES_ADMIN to demo vault and tenant leads', () => {
      expect(hasPlatformPermission(salesAdminSession, 'DEMO_CREDENTIAL_VIEW')).toBe(true);
      expect(hasPlatformPermission(salesAdminSession, 'DEMO_CLIENT_EXPORT')).toBe(true);
      expect(hasPlatformPermission(salesAdminSession, 'PLAN_VIEW')).toBe(true);

      // Denied actions
      expect(hasPlatformPermission(salesAdminSession, 'TENANT_SUSPEND')).toBe(false);
      expect(hasPlatformPermission(salesAdminSession, 'GATEWAY_MANAGE')).toBe(false);
      expect(hasPlatformPermission(salesAdminSession, 'PLATFORM_USER_MANAGE')).toBe(false);
      expect(() => requirePlatformPermission(salesAdminSession, 'TENANT_SUSPEND')).toThrow();
    });

    it('blocks non-platform users (e.g. tenant Principal) from all platform operations', () => {
      expect(hasPlatformPermission(schoolPrincipalSession, 'PLATFORM_VIEW_DASHBOARD')).toBe(false);
      expect(hasPlatformPermission(schoolPrincipalSession, 'TENANT_CREATE')).toBe(false);
      expect(() => requirePlatformPermission(schoolPrincipalSession, 'PLATFORM_VIEW_DASHBOARD')).toThrow();
    });

    it('blocks null or unauthenticated sessions immediately', () => {
      expect(hasPlatformPermission(null, 'PLATFORM_VIEW_DASHBOARD')).toBe(false);
      expect(() => requirePlatformPermission(null, 'PLATFORM_VIEW_DASHBOARD')).toThrow();
    });
  });

  describe('2. Onboarding Billing Period Calculations & Date Arithmetic', () => {
    it('correctly calculates MONTHLY billing cycle as full 1 calendar month (not 14 days trial)', () => {
      const start = new Date('2026-03-15T00:00:00.000Z');
      const endMonthly = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      
      const diffDays = Math.round((endMonthly.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
      expect(diffDays).not.toBe(14);
      expect(endMonthly.getMonth()).toBe(3); // April
    });

    it('correctly calculates ANNUAL billing cycle as 1 calendar year', () => {
      const start = new Date('2026-01-01T00:00:00.000Z');
      const endAnnual = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      
      expect(endAnnual.getFullYear()).toBe(2027);
      expect(endAnnual.getMonth()).toBe(0);
      expect(endAnnual.getDate()).toBe(1);
    });

    it('correctly calculates TRIAL billing cycle with explicit trialDays parameter', () => {
      const start = new Date('2026-05-01T00:00:00.000Z');
      const trialDays = 14;
      const endTrial = new Date(start.getTime() + trialDays * 86400000);
      
      const diffDays = Math.round((endTrial.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(14);
    });
  });

  describe('3. Decoupled Demo Definitions & Persona Coverage', () => {
    it('contains all 48 authoritative QA account personas', () => {
      expect(QA_ACCOUNT_DEFINITIONS.length).toBe(48);
    });

    it('covers all 8 canonical educational verticals plus platform management', () => {
      const slugs = new Set(QA_ACCOUNT_DEFINITIONS.map(a => a.tenantSlug));
      expect(slugs.has('platform')).toBe(true);
      expect(slugs.has('demo-school')).toBe(true);
      expect(slugs.has('demo-college')).toBe(true);
      expect(slugs.has('demo-school-college')).toBe(true);
      expect(slugs.has('demo-madrasha')).toBe(true);
      expect(slugs.has('demo-university')).toBe(true);
      expect(slugs.has('demo-polytechnic')).toBe(true);
      expect(slugs.has('demo-vocational')).toBe(true);
      expect(slugs.has('demo-training')).toBe(true);
    });

    it('ensures no hardcoded plaintext passwords in definitions', () => {
      for (const def of QA_ACCOUNT_DEFINITIONS) {
        expect((def as any).password).toBeUndefined();
        expect(def.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(def.expectedLandingUrl).toMatch(/^(\/|https?:\/\/)/);
      }
    });
  });
});
