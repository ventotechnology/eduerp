import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { provisionSitaAndPlatformAccounts } from '../scripts/provision-sita-client';
import { verifyPassword } from '../lib/auth/password';
import { resolveCanonicalTenantSlug, isSameTenant } from '../lib/tenant/tenant-aliases';
import { SubscriptionEntitlementService } from '../lib/services/subscription-entitlement-service';
import fs from 'fs';
import path from 'path';

describe('Command 12A — SITA Real Madrasha Customer & Platform Owner Provisioning Suite', () => {
  beforeAll(async () => {
    await provisionSitaAndPlatformAccounts();
  });

  // 1. Platform Super Admin Account Exists
  it('1. Platform Super Admin (bloodsoft24@gmail.com) exists with active status', async () => {
    const user = await db.user.findUnique({
      where: { email: 'bloodsoft24@gmail.com' }
    });
    expect(user).toBeDefined();
    expect(user?.status).toBe('ACTIVE');
    expect(user?.tenantId).toBeNull();
  });

  // 2. Platform Admin Account Exists
  it('2. Platform Admin (walletmix@gmail.com) exists with active status', async () => {
    const user = await db.user.findUnique({
      where: { email: 'walletmix@gmail.com' }
    });
    expect(user).toBeDefined();
    expect(user?.status).toBe('ACTIVE');
    expect(user?.tenantId).toBeNull();
  });

  // 3. Platform Roles are Correct
  it('3. Platform roles are assigned correctly (PLATFORM_SUPER_ADMIN & PLATFORM_ADMIN)', async () => {
    const superAdmin = await db.user.findUnique({ where: { email: 'bloodsoft24@gmail.com' } });
    const admin = await db.user.findUnique({ where: { email: 'walletmix@gmail.com' } });

    expect(superAdmin?.role).toBe('PLATFORM_SUPER_ADMIN');
    expect(admin?.role).toBe('PLATFORM_ADMIN');
  });

  // 4. SITA Tenant Exists Exactly Once
  it('4. SITA tenant exists exactly once with canonical slug', async () => {
    const tenants = await db.tenant.findMany({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });
    expect(tenants.length).toBe(1);
    expect(tenants[0].slug).toBe('scholars-international-tahfiz-academy');
  });

  // 5. SITA Real / Demo Flags Correct
  it('5. SITA real/demo flags are correctly set (isDemoTenant=false, isTestTenant=false)', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });
    expect(tenant?.isDemoTenant).toBe(false);
    expect(tenant?.isTestTenant).toBe(false);
    expect(tenant?.isActive).toBe(true);
  });

  // 6. SITA Institution Type = MADRASHA
  it('6. SITA institution type is MADRASHA with correct institutional metadata', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' },
      include: { institution: true }
    });
    expect(tenant?.institutionType).toBe('MADRASHA');
    expect(tenant?.institution?.name).toBe('Scholars International Tahfiz Academy');
    expect(tenant?.institution?.shortName).toBe('SITA');
    expect(tenant?.institution?.email).toBe('contact@scholarsita.com');
    expect(tenant?.institution?.phone).toBe('01988115666');
    expect(tenant?.institution?.address).toContain('Uttara, Dhaka');
  });

  // 7. SITA Main Campus Exists
  it('7. SITA main campus exists with SITA-MAIN code and isMain=true', async () => {
    const institution = await db.institution.findFirst({
      where: { tenant: { slug: 'scholars-international-tahfiz-academy' } },
      include: { campuses: true }
    });
    expect(institution?.campuses.length).toBeGreaterThanOrEqual(1);
    const mainCampus = institution?.campuses.find(c => c.isMain);
    expect(mainCampus).toBeDefined();
    expect(mainCampus?.code).toBe('SITA-MAIN');
    expect(mainCampus?.name).toBe('SITA Main Campus');
  });

  // 8. Organization Head Exists
  it('8. Organization head (Mohammad Saifullah) exists with contact@scholarsita.com', async () => {
    const owner = await db.user.findUnique({
      where: { email: 'contact@scholarsita.com' }
    });
    expect(owner).toBeDefined();
    expect(owner?.name).toBe('Mohammad Saifullah');
    expect(owner?.role).toBe('PRINCIPAL');
    expect(owner?.status).toBe('ACTIVE');
  });

  // 9. Organization Head Belongs Exclusively to SITA
  it('9. Organization head is bound exclusively to SITA tenant', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });
    const owner = await db.user.findUnique({
      where: { email: 'contact@scholarsita.com' }
    });
    expect(owner?.tenantId).toBe(tenant?.id);
  });

  // 10. Password Hashing & Authentication Verification
  it('10. Passwords verify correctly against secure salt:hash hashes', async () => {
    const superAdmin = await db.user.findUnique({ where: { email: 'bloodsoft24@gmail.com' } });
    const admin = await db.user.findUnique({ where: { email: 'walletmix@gmail.com' } });
    const sitaOwner = await db.user.findUnique({ where: { email: 'contact@scholarsita.com' } });

    // Validate hash format
    expect(superAdmin?.passwordHash).toContain(':');
    expect(admin?.passwordHash).toContain(':');
    expect(sitaOwner?.passwordHash).toContain(':');

    // Validate verification
    expect(verifyPassword('Wallet.047890', superAdmin!.passwordHash)).toBe(true);
    expect(verifyPassword('WrongPassword', superAdmin!.passwordHash)).toBe(false);
    expect(verifyPassword('Wallet.047890', admin!.passwordHash)).toBe(true);
    expect(verifyPassword('Password@123', sitaOwner!.passwordHash)).toBe(true);
  });

  // 11. SITA Tenant Slug & Friendly Alias Resolution
  it('11. Friendly alias "sita" resolves to canonical slug "scholars-international-tahfiz-academy"', () => {
    expect(resolveCanonicalTenantSlug('sita')).toBe('scholars-international-tahfiz-academy');
    expect(resolveCanonicalTenantSlug('SITA')).toBe('scholars-international-tahfiz-academy');
    expect(resolveCanonicalTenantSlug('scholars-international-tahfiz-academy')).toBe('scholars-international-tahfiz-academy');
    expect(isSameTenant('sita', 'scholars-international-tahfiz-academy')).toBe(true);
  });

  // 12. Cross-Tenant Denial Logic
  it('12. SITA does not match demo-school or demo-madrasha', () => {
    expect(isSameTenant('sita', 'demo-school')).toBe(false);
    expect(isSameTenant('sita', 'demo-madrasha')).toBe(false);
    expect(isSameTenant('scholars-international-tahfiz-academy', 'demo-madrasha')).toBe(false);
  });

  // 13. SITA Active 30-Day Subscription
  it('13. SITA has an active 30-day Enterprise subscription', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' },
      include: {
        subscriptions: {
          include: { plan: true }
        }
      }
    });

    const activeSub = tenant?.subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'TRIALING');
    expect(activeSub).toBeDefined();
    expect(activeSub?.plan.code).toBe('ENTERPRISE');
    expect(activeSub?.endDate.getTime()).toBeGreaterThan(Date.now());
  });

  // 14. Pilot Revenue Classification (Zero Fake Revenue)
  it('14. Pilot does not generate fake paid invoices or false commercial revenue', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' },
      include: { subscriptionInvoices: true }
    });
    // Complimentry pilot should not have paid commercial invoices
    const paidInvoices = tenant?.subscriptionInvoices.filter(inv => inv.status === 'PAID') || [];
    expect(paidInvoices.length).toBe(0);
  });

  // 15. Hifz Entitlement Enabled for SITA
  it('15. Hifz tracking entitlement is enabled for SITA', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });

    const hasHifz = await SubscriptionEntitlementService.hasFeature(tenant!.id, 'HIFZ_TRACKING');
    expect(hasHifz).toBe(true);
  });

  // 16. Support Entitlement Enabled
  it('16. Priority support entitlement is enabled for SITA', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });

    const hasSupport = await SubscriptionEntitlementService.hasFeature(tenant!.id, 'PRIORITY_SUPPORT');
    expect(hasSupport).toBe(true);
  });

  // 17. SITA Onboarding Progress Exists
  it('17. SITA onboarding progress record is initialized in draft state', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' },
      include: { onboardingProgress: true }
    });
    expect(tenant?.onboardingProgress).toBeDefined();
    expect(tenant?.onboardingProgress?.isCompleted).toBe(false);
  });

  // 18. Private Credential Files Exist and Are Protected
  it('18. Private credential files exist and are contained in .gitignore', () => {
    const sitaCredPath = path.join(process.cwd(), 'private', 'SITA-CLIENT-CREDENTIALS.txt');
    const ownerCredPath = path.join(process.cwd(), 'private', 'EDUERP-PLATFORM-OWNER-CREDENTIALS.txt');
    const gitignorePath = path.join(process.cwd(), '.gitignore');

    expect(fs.existsSync(sitaCredPath)).toBe(true);
    expect(fs.existsSync(ownerCredPath)).toBe(true);

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    expect(gitignoreContent).toContain('private/');
  });

  // 19. Idempotency Check
  it('19. Running provisionSitaAndPlatformAccounts again creates zero duplicate records', async () => {
    const beforeTenantCount = await db.tenant.count({ where: { slug: 'scholars-international-tahfiz-academy' } });
    const beforeUserCount = await db.user.count({ where: { email: 'contact@scholarsita.com' } });

    await provisionSitaAndPlatformAccounts();

    const afterTenantCount = await db.tenant.count({ where: { slug: 'scholars-international-tahfiz-academy' } });
    const afterUserCount = await db.user.count({ where: { email: 'contact@scholarsita.com' } });

    expect(afterTenantCount).toBe(beforeTenantCount);
    expect(afterUserCount).toBe(beforeUserCount);
  });
});
