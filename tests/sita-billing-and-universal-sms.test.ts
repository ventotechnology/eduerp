import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { SubscriptionEntitlementService } from '@/lib/services/subscription-entitlement-service';
import { encryptSmsCredentials, decryptSmsCredentials, maskSmsCredentials } from '@/lib/services/sms/sms-crypto';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';
import { getSmsAdapter, listSupportedSmsAdapters } from '@/lib/services/sms/adapters';
import { InstitutionType, SubscriptionTier, TenantProvisioningStatus } from '@prisma/client';

describe('COMMAND 12A.4 — Live Billing Recovery, Zero-Hardcode Subscription Engine & Universal SMS Architecture', () => {
  let sitaTenant: any;
  let testMockProvider: any;

  beforeAll(async () => {
    // 1. Ensure SITA Tenant exists for test runs
    sitaTenant = await db.tenant.upsert({
      where: { slug: 'scholars-international-tahfiz-academy' },
      create: {
        slug: 'scholars-international-tahfiz-academy',
        institutionType: InstitutionType.MADRASHA,
        subscriptionTier: SubscriptionTier.PROFESSIONAL,
        status: TenantProvisioningStatus.ACTIVE_PAID,
        isActive: true,
        institution: {
          create: {
            name: 'Scholars International Tahfiz Academy',
            shortName: 'SITA',
            address: 'Road 12, Block D, Dhanmondi, Dhaka',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            email: 'contact@scholarsita.com',
            phone: '+8801711223344',
            campuses: {
              create: {
                name: 'Main Campus',
                code: 'MAIN',
                address: 'Road 12, Block D, Dhanmondi, Dhaka',
                isMain: true
              }
            }
          }
        }
      },
      update: {
        isActive: true
      },
      include: {
        institution: { include: { campuses: true } }
      }
    });

    // 2. Ensure Subscription Plans exist in DB
    const starterPlan = await db.subscriptionPlan.upsert({
      where: { code: 'STARTER' },
      create: {
        code: 'STARTER',
        name: 'Starter Tier',
        slug: 'starter',
        description: 'Starter operating plan for small institutions',
        monthlyPrice: 4500,
        annualPrice: 45000,
        annualDiscount: 16.67,
        maxStudents: 500,
        maxCampuses: 1,
        maxTeachers: 25,
        maxUsers: 25,
        maxStorageGb: 20,
        includedSms: 1000,
        isPublic: true,
        isActive: true,
        displayOrder: 1,
        features: {
          create: [
            { featureKey: 'SIS', name: 'Student Information System', isEnabled: true },
            { featureKey: 'ATTENDANCE', name: 'Attendance Management', isEnabled: true }
          ]
        }
      },
      update: {
        monthlyPrice: 4500,
        annualPrice: 45000,
        maxStudents: 500
      }
    });

    // 3. Ensure SITA has an active subscription linked to Plan
    await db.subscription.upsert({
      where: { id: `sub-${sitaTenant.id}` },
      create: {
        id: `sub-${sitaTenant.id}`,
        tenantId: sitaTenant.id,
        planId: starterPlan.id,
        billingCycle: 'ANNUAL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      update: {
        status: 'ACTIVE',
        planId: starterPlan.id
      }
    });

    // Clean any previous test usage records
    await db.smsUsageLedger.deleteMany({ where: { tenantId: sitaTenant.id } });
    await db.smsBroadcast.deleteMany({ where: { tenantId: sitaTenant.id } });

    // 4. Create Platform Mock Provider for deterministic SMS testing
    const encCreds = encryptSmsCredentials({ apiKey: 'secret-test-key-2026', senderId: 'EduERP' });
    testMockProvider = await db.smsProvider.upsert({
      where: { id: 'platform-test-mock-provider' },
      create: {
        id: 'platform-test-mock-provider',
        scope: 'PLATFORM',
        name: 'Platform Universal Mock Gateway',
        code: 'TEST_MOCK',
        type: 'HTTP_API',
        status: 'ACTIVE',
        isDefault: true,
        senderId: 'EduERP',
        encryptedCredentials: encCreds
      },
      update: {
        status: 'ACTIVE',
        isDefault: true,
        encryptedCredentials: encCreds
      }
    });

    await db.tenantSmsConfig.upsert({
      where: { tenantId: sitaTenant.id },
      create: {
        tenantId: sitaTenant.id,
        serviceMode: 'PLATFORM_SHARED',
        bonusSmsCredits: 1000
      },
      update: {
        serviceMode: 'PLATFORM_SHARED',
        bonusSmsCredits: 1000
      }
    });
  });

  // ==========================================
  // SECTION 1: LIVE BILLING RECOVERY & ZERO-HARDCODE ENGINE
  // ==========================================

  describe('1. Live Billing Recovery & Database-Driven Plan Data', () => {
    it('should return complete tenant billing summary without throwing or crashing', async () => {
      const summary = await SubscriptionEntitlementService.getTenantBillingSummary(sitaTenant.id);

      expect(summary).toBeDefined();
      expect(summary.tenant).toBeDefined();
      expect(summary.subscription).toBeDefined();
      expect(summary.usage).toBeDefined();
      expect(summary.availablePlans).toBeDefined();
      expect(Array.isArray(summary.availablePlans)).toBe(true);
    });

    it('should normalize features to string list so React client rendering never crashes', async () => {
      const summary = await SubscriptionEntitlementService.getTenantBillingSummary(sitaTenant.id);

      for (const plan of summary.availablePlans) {
        expect(plan.featureList).toBeDefined();
        expect(Array.isArray(plan.featureList)).toBe(true);
        for (const item of plan.featureList) {
          expect(typeof item).toBe('string');
        }
      }
    });

    it('should compute real annual discount percentage from database prices without hardcoded constants', async () => {
      const summary = await SubscriptionEntitlementService.getTenantBillingSummary(sitaTenant.id);
      const plan = summary.availablePlans.find((p) => p.code === 'STARTER');

      expect(plan).toBeDefined();
      expect(plan!.annualDiscountPercent).toBeGreaterThan(0);
      expect(plan!.monthlyPrice).toBe(4500);
      expect(plan!.annualPrice).toBe(45000);
    });

    it('should return real usage counts from database entities', async () => {
      const summary = await SubscriptionEntitlementService.getTenantBillingSummary(sitaTenant.id);

      expect(summary.usage.campuses.current).toBeGreaterThanOrEqual(1);
      expect(summary.usage.students.current).toBeGreaterThanOrEqual(0);
      expect(summary.usage.teachers.current).toBeGreaterThanOrEqual(0);
      expect(summary.usage.sms.current).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================
  // SECTION 2: SMS CREDENTIAL CRYPTOGRAPHY
  // ==========================================

  describe('2. SMS Credential Vault & AES-256-GCM Cryptography', () => {
    it('should encrypt and decrypt telecom provider credentials symmetrically', () => {
      const originalPayload = {
        userId: 'sita_admin',
        password: 'SuperSecretTelecomPassword!2026',
        apiKey: 'bl-vas-key-998877',
        senderId: 'SITA'
      };

      const encrypted = encryptSmsCredentials(originalPayload);
      expect(encrypted).toBeDefined();
      expect(encrypted.startsWith('v1:')).toBe(true);
      expect(encrypted).not.toContain('SuperSecretTelecomPassword!2026');

      const decrypted = decryptSmsCredentials(encrypted);
      expect(decrypted).toEqual(originalPayload);
    });

    it('should reject tampered or corrupted encrypted strings', () => {
      expect(() => {
        decryptSmsCredentials('v1:badiv:badauth:badcipher');
      }).toThrow();
    });

    it('should mask sensitive credential keys for API responses', () => {
      const credentials = {
        username: 'contact@scholarsita.com',
        apiKey: 'live_secret_key_abcdef123456',
        password: 'PlainPassword123',
        senderId: 'SITA'
      };

      const masked = maskSmsCredentials(credentials);
      expect(masked.username).toBe('contact@scholarsita.com');
      expect(masked.senderId).toBe('SITA');
      expect(masked.apiKey).toContain('••••••••');
      expect(masked.apiKey).toContain('3456');
      expect(masked.password).toBe('••••••••d123');
    });
  });

  // ==========================================
  // SECTION 3: SMS SEGMENTATION CALCULATOR
  // ==========================================

  describe('3. SMS Segmentation & Encoding Engine', () => {
    it('should correctly calculate GSM-7 English character segmentation', () => {
      const shortEnglish = 'Classes are suspended tomorrow due to heavy rain.';
      const res1 = SmsGatewayService.calculateSmsSegments(shortEnglish);
      expect(res1.isUnicode).toBe(false);
      expect(res1.segmentCount).toBe(1);

      const longEnglish = 'A'.repeat(161);
      const res2 = SmsGatewayService.calculateSmsSegments(longEnglish);
      expect(res2.isUnicode).toBe(false);
      expect(res2.segmentCount).toBe(2);
      expect(res2.charsPerSegment).toBe(153);
    });

    it('should correctly calculate Unicode & Bangla character segmentation', () => {
      const shortBangla = 'আগামীকাল মাদরাসার ক্লাস বন্ধ থাকবে।';
      const res1 = SmsGatewayService.calculateSmsSegments(shortBangla);
      expect(res1.isUnicode).toBe(true);
      expect(res1.segmentCount).toBe(1);

      const longBangla = 'ক'.repeat(71);
      const res2 = SmsGatewayService.calculateSmsSegments(longBangla);
      expect(res2.isUnicode).toBe(true);
      expect(res2.segmentCount).toBe(2);
      expect(res2.charsPerSegment).toBe(67);
    });
  });

  // ==========================================
  // SECTION 4: PHONE NUMBER NORMALIZATION & ISOLATION
  // ==========================================

  describe('4. Phone Number Normalization, Deduplication & Tenant Isolation', () => {
    it('should canonicalize various Bangladesh phone number formats into E.164', () => {
      expect(SmsGatewayService.normalizePhoneNumber('01711223344')).toBe('+8801711223344');
      expect(SmsGatewayService.normalizePhoneNumber('+8801811223344')).toBe('+8801811223344');
      expect(SmsGatewayService.normalizePhoneNumber('8801911223344')).toBe('+8801911223344');
      expect(SmsGatewayService.normalizePhoneNumber('01300000000')).toBe('+8801300000000');
      expect(SmsGatewayService.normalizePhoneNumber('invalid-number')).toBeNull();
    });

    it('should deduplicate phone numbers and identify invalid numbers', () => {
      const rawNumbers = [
        '01711223344',
        '+8801711223344',
        '8801711223344',
        '01811223344',
        'bad-phone-123'
      ];

      const res = SmsGatewayService.deduplicatePhoneNumbers(rawNumbers);
      expect(res.valid).toEqual(['+8801711223344', '+8801811223344']);
      expect(res.duplicatesCount).toBe(2);
      expect(res.invalid).toEqual(['bad-phone-123']);
    });
  });

  // ==========================================
  // SECTION 5: MULTI-STRATEGY SMS ROUTING & ISOLATION
  // ==========================================

  describe('5. Multi-Strategy SMS Routing & Quotas', () => {
    it('should resolve to Platform Universal Gateway by default', async () => {
      await db.tenantSmsConfig.upsert({
        where: { tenantId: sitaTenant.id },
        create: {
          tenantId: sitaTenant.id,
          serviceMode: 'PLATFORM_SHARED'
        },
        update: {
          serviceMode: 'PLATFORM_SHARED'
        }
      });

      const resolution = await SmsGatewayService.resolveTenantSmsProvider(sitaTenant.id);
      expect(resolution.status).toBe('PLATFORM_SHARED');
      expect(resolution.provider).toBeDefined();
      expect(resolution.provider?.id).toBe(testMockProvider.id);
    });

    it('should respect DISABLED service mode', async () => {
      await db.tenantSmsConfig.update({
        where: { tenantId: sitaTenant.id },
        data: { serviceMode: 'DISABLED' }
      });

      const resolution = await SmsGatewayService.resolveTenantSmsProvider(sitaTenant.id);
      expect(resolution.status).toBe('DISABLED');
      expect(resolution.provider).toBeNull();
    });

    it('should route through Tenant Own Gateway when configured', async () => {
      const ownProvider = await db.smsProvider.create({
        data: {
          scope: 'TENANT',
          tenantId: sitaTenant.id,
          name: 'SITA BulkSMSBD Account',
          code: 'BULKSMSBD',
          senderId: 'SITA',
          encryptedCredentials: encryptSmsCredentials({ apiKey: 'sita-custom-key', senderId: 'SITA' })
        }
      });

      await db.tenantSmsConfig.update({
        where: { tenantId: sitaTenant.id },
        data: {
          serviceMode: 'TENANT_OWN',
          activeProviderId: ownProvider.id
        }
      });

      const resolution = await SmsGatewayService.resolveTenantSmsProvider(sitaTenant.id);
      expect(resolution.status).toBe('TENANT_OWN');
      expect(resolution.provider?.id).toBe(ownProvider.id);

      // Clean up own provider
      await db.smsProvider.delete({ where: { id: ownProvider.id } });
    });
  });

  // ==========================================
  // SECTION 6: SMS BROADCAST EXECUTION & DELIVERY TRACKING
  // ==========================================

  describe('6. SMS Broadcast Dispatch, Quota Debit & Audit Trail', () => {
    it('should successfully execute an SMS broadcast and record delivery entries', async () => {
      // Re-enable platform shared and reset usage ledgers for test isolation
      await db.smsUsageLedger.deleteMany({ where: { tenantId: sitaTenant.id } });
      await db.tenantSmsConfig.update({
        where: { tenantId: sitaTenant.id },
        data: {
          serviceMode: 'PLATFORM_SHARED',
          bonusSmsCredits: 500,
          purchasedSmsCredits: 0
        }
      });

      const broadcastRes = await SmsGatewayService.sendBroadcast({
        tenantId: sitaTenant.id,
        audienceType: 'CUSTOM',
        customRecipients: ['01711223344', '01811223344'],
        message: 'Assalamu Alaikum, SITA campus notice test.',
        requestedBy: 'Mohammad Saifullah',
        requestedByRole: 'OWNER'
      });

      expect(broadcastRes.success).toBe(true);
      expect(broadcastRes.totalSent).toBe(2);
      expect(broadcastRes.status).toBe('COMPLETED');

      // Verify broadcast in DB
      const dbBroadcast = await db.smsBroadcast.findUnique({
        where: { id: broadcastRes.broadcastId },
        include: { deliveries: true, usageLedgers: true }
      });

      expect(dbBroadcast).toBeDefined();
      expect(dbBroadcast?.deliveries.length).toBe(2);
      expect(dbBroadcast?.usageLedgers.length).toBe(1);
      expect(dbBroadcast?.usageLedgers[0].quantity).toBe(2);
    });

    it('should block broadcast when SMS quota is exceeded', async () => {
      // Reset bonus credits to 0 and verify quota limitation
      await db.tenantSmsConfig.update({
        where: { tenantId: sitaTenant.id },
        data: { bonusSmsCredits: 0, purchasedSmsCredits: 0 }
      });

      // Exhaust quota by adding a usage record
      await db.smsUsageLedger.create({
        data: {
          tenantId: sitaTenant.id,
          quantity: 2000,
          source: 'INCLUDED_QUOTA',
          billingPeriod: new Date().toISOString().slice(0, 7)
        }
      });

      await expect(
        SmsGatewayService.sendBroadcast({
          tenantId: sitaTenant.id,
          audienceType: 'CUSTOM',
          customRecipients: ['01711223344'],
          message: 'This should be blocked due to quota exhaustion.',
          requestedBy: 'Mohammad Saifullah'
        })
      ).rejects.toThrow(/SMS_QUOTA_EXCEEDED/);
    });
  });

  // ==========================================
  // SECTION 7: PROVIDER ADAPTERS REGISTRY & TESTING
  // ==========================================

  describe('7. Telecom Provider Adapters & Health Check Handshake', () => {
    it('should list all supported telecom adapters', () => {
      const adapters = listSupportedSmsAdapters();
      const codes = adapters.map((a) => a.code);

      expect(codes).toContain('BANGLALINK');
      expect(codes).toContain('GRAMEENPHONE');
      expect(codes).toContain('TELETALK');
      expect(codes).toContain('ROBI');
      expect(codes).toContain('SSL_WIRELESS');
      expect(codes).toContain('BULKSMSBD');
      expect(codes).toContain('TWILIO');
      expect(codes).toContain('GENERIC_HTTP');
      expect(codes).toContain('TEST_MOCK');
    });

    it('should successfully test mock provider connection', async () => {
      const testRes = await SmsGatewayService.testProvider(testMockProvider.id);
      expect(testRes.status).toBe('CONNECTED');
    });
  });
});
