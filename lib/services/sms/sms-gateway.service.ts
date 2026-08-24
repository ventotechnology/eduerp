import { db } from '@/lib/db';
import { encryptSmsCredentials, decryptSmsCredentials, maskSmsCredentials } from './sms-crypto';
import { getSmsAdapter } from './adapters';

export class SmsGatewayService {
  /**
   * Normalizes Bangladesh and international phone numbers into canonical E.164 (+8801XXXXXXXXX)
   */
  static normalizePhoneNumber(raw: string): string | null {
    if (!raw) return null;
    let cleaned = raw.trim().replace(/[\s\-\(\)]/g, '');

    // Bangladesh formats
    if (/^01[3-9]\d{8}$/.test(cleaned)) {
      return `+88${cleaned}`;
    }
    if (/^8801[3-9]\d{8}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
    if (/^\+8801[3-9]\d{8}$/.test(cleaned)) {
      return cleaned;
    }

    // General international E.164
    if (/^\+\d{10,15}$/.test(cleaned)) {
      return cleaned;
    }

    return null;
  }

  /**
   * Deduplicates and filters a list of phone numbers
   */
  static deduplicatePhoneNumbers(numbers: string[]): {
    valid: string[];
    invalid: string[];
    duplicatesCount: number;
  } {
    const validSet = new Set<string>();
    const invalid: string[] = [];
    let duplicatesCount = 0;

    for (const num of numbers) {
      const normalized = this.normalizePhoneNumber(num);
      if (!normalized) {
        invalid.push(num);
        continue;
      }
      if (validSet.has(normalized)) {
        duplicatesCount++;
      } else {
        validSet.add(normalized);
      }
    }

    return {
      valid: Array.from(validSet),
      invalid,
      duplicatesCount
    };
  }

  /**
   * Determines if text contains non-GSM characters (e.g. Bangla / Unicode) and calculates segments
   */
  static calculateSmsSegments(message: string): {
    isUnicode: boolean;
    segmentCount: number;
    charCount: number;
    charsPerSegment: number;
  } {
    const text = message || '';
    const charCount = text.length;

    // Check for Unicode / non-GSM standard characters
    // GSM 7-bit basic character set check
    const isUnicode = /[^\u0020-\u007E\u00A0-\u00FF\r\n]/.test(text);

    if (isUnicode) {
      if (charCount === 0) return { isUnicode, segmentCount: 0, charCount: 0, charsPerSegment: 70 };
      const segmentCount = charCount <= 70 ? 1 : Math.ceil(charCount / 67);
      return { isUnicode, segmentCount, charCount, charsPerSegment: charCount <= 70 ? 70 : 67 };
    } else {
      if (charCount === 0) return { isUnicode, segmentCount: 0, charCount: 0, charsPerSegment: 160 };
      const segmentCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153);
      return { isUnicode, segmentCount, charCount, charsPerSegment: charCount <= 160 ? 160 : 153 };
    }
  }

  /**
   * Resolves the active SMS provider for a given tenant based on hierarchy & routing
   */
  static async resolveTenantSmsProvider(tenantId: string) {
    const config = await db.tenantSmsConfig.findUnique({
      where: { tenantId },
      include: { activeProvider: true }
    });

    const mode = config?.serviceMode || 'PLATFORM_SHARED';

    if (mode === 'DISABLED') {
      return { status: 'DISABLED' as const, provider: null, mode };
    }

    // 1. Tenant Own Provider
    if (mode === 'TENANT_OWN' || mode === 'TENANT_WITH_PLATFORM_FALLBACK') {
      if (config?.activeProvider && config.activeProvider.status === 'ACTIVE') {
        return {
          status: 'TENANT_OWN' as const,
          provider: config.activeProvider,
          mode,
          senderId: config.customSenderId || config.activeProvider.senderId
        };
      }

      // Check fallback
      if (mode === 'TENANT_WITH_PLATFORM_FALLBACK' && config?.allowFallback) {
        const platformDefault = await db.smsProvider.findFirst({
          where: { scope: 'PLATFORM', isDefault: true, status: 'ACTIVE' }
        });
        if (platformDefault) {
          return {
            status: 'PLATFORM_FALLBACK' as const,
            provider: platformDefault,
            mode,
            senderId: platformDefault.senderId
          };
        }
      }

      return { status: 'GATEWAY_NOT_CONFIGURED' as const, provider: null, mode };
    }

    // 2. Platform Shared Provider
    if (mode === 'PLATFORM_SHARED') {
      const platformDefault = await db.smsProvider.findFirst({
        where: { scope: 'PLATFORM', isDefault: true, status: 'ACTIVE' }
      });

      if (!platformDefault) {
        return { status: 'PLATFORM_NOT_CONFIGURED' as const, provider: null, mode };
      }

      return {
        status: 'PLATFORM_SHARED' as const,
        provider: platformDefault,
        mode,
        senderId: platformDefault.senderId
      };
    }

    return { status: 'GATEWAY_NOT_CONFIGURED' as const, provider: null, mode };
  }

  /**
   * Calculates real SMS quota and usage for a tenant
   */
  static async getTenantSmsQuota(tenantId: string) {
    const [sub, config] = await Promise.all([
      db.subscription.findFirst({
        where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
      }),
      db.tenantSmsConfig.findUnique({
        where: { tenantId }
      })
    ]);

    const includedMonthly = sub?.plan?.includedSms ?? 0;
    const purchasedCredits = config?.purchasedSmsCredits ?? 0;
    const bonusCredits = config?.bonusSmsCredits ?? 0;

    const currentPeriod = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

    const usageSum = await db.smsUsageLedger.aggregate({
      where: {
        tenantId,
        billingPeriod: currentPeriod,
        source: { in: ['INCLUDED_QUOTA', 'ADDON_CREDIT', 'BONUS_CREDIT'] }
      },
      _sum: { quantity: true }
    });

    const usedThisPeriod = usageSum._sum.quantity || 0;
    const totalAvailable = includedMonthly + purchasedCredits + bonusCredits;
    const remainingCredits = Math.max(0, totalAvailable - usedThisPeriod);

    return {
      includedMonthly,
      purchasedCredits,
      bonusCredits,
      usedThisPeriod,
      totalAvailable,
      remainingCredits,
      billingPeriod: currentPeriod,
      isUnlimited: sub?.plan?.includedSms === -1 || (sub?.plan as any)?.tier === 'ENTERPRISE'
    };
  }

  /**
   * Resolves recipient phone numbers for an audience type with strict tenant isolation
   */
  static async resolveAudienceRecipients(params: {
    tenantId: string;
    audienceType: string;
    classId?: string;
    sectionId?: string;
  }): Promise<{ phone: string; name: string; type: string; id: string }[]> {
    const { tenantId, audienceType, classId, sectionId } = params;
    const recipients: { phone: string; name: string; type: string; id: string }[] = [];

    if (audienceType === 'ALL_STUDENTS' || audienceType === 'CLASS' || audienceType === 'SECTION') {
      const students = await db.student.findMany({
        where: {
          campus: { institution: { tenantId } },
          status: 'ACTIVE',
          ...(classId ? { enrollments: { some: { classId } } } : {}),
          ...(sectionId ? { enrollments: { some: { sectionId } } } : {})
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      });

      for (const s of students) {
        if (s.phone) {
          recipients.push({
            phone: s.phone,
            name: `${s.firstName} ${s.lastName}`.trim(),
            type: 'STUDENT',
            id: s.id
          });
        }
      }
    }

    if (audienceType === 'ALL_GUARDIANS' || audienceType === 'ALL_PARENTS') {
      const guardians = await db.guardian.findMany({
        where: {
          students: { some: { campus: { institution: { tenantId } } } }
        },
        select: {
          id: true,
          guardianName: true,
          fatherName: true,
          guardianPhone: true,
          fatherPhone: true,
          motherPhone: true
        }
      });

      for (const g of guardians) {
        const phone = g.guardianPhone || g.fatherPhone || g.motherPhone;
        const name = g.guardianName || g.fatherName || 'Guardian';
        if (phone) {
          recipients.push({
            phone,
            name,
            type: 'GUARDIAN',
            id: g.id
          });
        }
      }
    }

    if (audienceType === 'ALL_TEACHERS' || audienceType === 'ALL_EMPLOYEES' || audienceType === 'ALL_STAFF') {
      const employees = await db.employee.findMany({
        where: {
          campus: { institution: { tenantId } }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      });

      for (const e of employees) {
        if (e.phone) {
          recipients.push({
            phone: e.phone,
            name: `${e.firstName} ${e.lastName}`.trim(),
            type: 'EMPLOYEE',
            id: e.id
          });
        }
      }
    }

    return recipients;
  }

  /**
   * Executes an SMS broadcast with quota check, provider resolution, and delivery tracking
   */
  static async sendBroadcast(params: {
    tenantId: string;
    audienceType: string;
    message: string;
    customRecipients?: string[];
    classId?: string;
    sectionId?: string;
    requestedBy: string;
    requestedByRole?: string;
  }) {
    const { tenantId, audienceType, message, customRecipients, classId, sectionId, requestedBy, requestedByRole } = params;

    // 1. Calculate segmentation
    const segInfo = this.calculateSmsSegments(message);
    if (segInfo.charCount === 0) {
      throw new Error('SMS message cannot be empty.');
    }

    // 2. Resolve provider
    const providerResolution = await this.resolveTenantSmsProvider(tenantId);
    if (providerResolution.status === 'DISABLED') {
      throw new Error('SMS service is disabled for this institution.');
    }
    if (providerResolution.status === 'GATEWAY_NOT_CONFIGURED') {
      throw new Error('SMS Gateway is not configured. Please configure your institution gateway or switch to EduERP Universal SMS in settings.');
    }
    if (providerResolution.status === 'PLATFORM_NOT_CONFIGURED') {
      throw new Error('EduERP Platform Universal SMS is not configured by the platform administrator.');
    }

    const provider = providerResolution.provider!;

    // 3. Resolve phone numbers
    let rawPhones: { phone: string; name?: string; type?: string; id?: string }[] = [];
    if (audienceType === 'CUSTOM' && customRecipients) {
      rawPhones = customRecipients.map((p) => ({ phone: p, type: 'CUSTOM' }));
    } else {
      rawPhones = await this.resolveAudienceRecipients({ tenantId, audienceType, classId, sectionId });
    }

    const dedup = this.deduplicatePhoneNumbers(rawPhones.map((r) => r.phone));
    if (dedup.valid.length === 0) {
      throw new Error('No valid phone numbers found for the selected audience.');
    }

    const totalSegmentsNeeded = dedup.valid.length * segInfo.segmentCount;

    // 4. Quota check for Platform Shared SMS
    if (providerResolution.status === 'PLATFORM_SHARED' || providerResolution.status === 'PLATFORM_FALLBACK') {
      const quota = await this.getTenantSmsQuota(tenantId);
      if (!quota.isUnlimited && quota.remainingCredits < totalSegmentsNeeded) {
        throw new Error(`SMS_QUOTA_EXCEEDED: Insufficient SMS credits. Required: ${totalSegmentsNeeded}, Available: ${quota.remainingCredits}. Please buy an SMS add-on package.`);
      }
    }

    // 5. Create Broadcast record
    const broadcast = await db.smsBroadcast.create({
      data: {
        tenantId,
        providerId: provider.id,
        providerScope: provider.scope,
        providerName: provider.name,
        audienceType,
        audienceFilter: JSON.stringify({ classId, sectionId }),
        message,
        isUnicode: segInfo.isUnicode,
        recipientCount: rawPhones.length,
        validRecipientCount: dedup.valid.length,
        segmentCount: segInfo.segmentCount,
        totalSegments: totalSegmentsNeeded,
        status: 'SENDING',
        requestedBy,
        requestedByRole,
        queuedAt: new Date()
      }
    });

    // 6. Decrypt credentials & execute transmission
    const credentials = decryptSmsCredentials(provider.encryptedCredentials);
    const adapter = getSmsAdapter(provider.code);

    const bulkResult = await adapter.sendBulk(
      credentials,
      {
        recipients: dedup.valid,
        message,
        senderId: providerResolution.senderId || provider.senderId || undefined,
        isUnicode: segInfo.isUnicode
      },
      provider.baseUrl || undefined
    );

    // 7. Persist delivery records
    await db.smsDelivery.createMany({
      data: bulkResult.results.map((r) => ({
        broadcastId: broadcast.id,
        phone: r.phone,
        status: r.success ? 'SUBMITTED' : 'FAILED',
        providerMessageId: r.providerMessageId,
        segments: segInfo.segmentCount,
        errorCode: r.error,
        sentAt: r.success ? new Date() : null,
        failedAt: r.success ? null : new Date()
      }))
    });

    // 8. Record Usage Ledger if platform shared
    const source = provider.scope === 'PLATFORM' ? 'INCLUDED_QUOTA' : 'TENANT_OWN_GATEWAY';
    await db.smsUsageLedger.create({
      data: {
        tenantId,
        broadcastId: broadcast.id,
        quantity: totalSegmentsNeeded,
        source,
        providerId: provider.id,
        billingPeriod: new Date().toISOString().slice(0, 7)
      }
    });

    // 9. Update broadcast status
    const finalStatus = bulkResult.totalFailed === 0 ? 'COMPLETED' : bulkResult.totalSent > 0 ? 'PARTIAL' : 'FAILED';
    const updatedBroadcast = await db.smsBroadcast.update({
      where: { id: broadcast.id },
      data: {
        status: finalStatus,
        submittedAt: new Date(),
        completedAt: new Date()
      }
    });

    return {
      success: bulkResult.totalSent > 0,
      broadcastId: updatedBroadcast.id,
      totalSent: bulkResult.totalSent,
      totalFailed: bulkResult.totalFailed,
      totalSegments: totalSegmentsNeeded,
      status: finalStatus
    };
  }

  /**
   * Tests a provider's connection and updates testing status
   */
  static async testProvider(providerId: string) {
    const provider = await db.smsProvider.findUnique({ where: { id: providerId } });
    if (!provider) throw new Error('Provider not found.');

    const credentials = decryptSmsCredentials(provider.encryptedCredentials);
    const adapter = getSmsAdapter(provider.code);

    const testRes = await adapter.testConnection(credentials, provider.baseUrl || undefined);

    await db.smsProvider.update({
      where: { id: provider.id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: testRes.status,
        lastTestError: testRes.status === 'CONNECTED' ? null : testRes.message
      }
    });

    return testRes;
  }

  /**
   * Returns sanitized providers with masked secrets
   */
  static sanitizeProvider(provider: any) {
    const { encryptedCredentials, ...rest } = provider;
    let masked: any = {};
    try {
      const dec = decryptSmsCredentials(encryptedCredentials);
      masked = maskSmsCredentials(dec);
    } catch {
      masked = { configured: true };
    }
    return { ...rest, credentials: masked };
  }
}
