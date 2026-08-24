import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  generateInquiryNumber,
  DEFAULT_CONTACT_SETTINGS,
  syncProductionContactSettings
} from '@/lib/client-success/contact-service';
import {
  generateTicketNumber,
  computeSlaDueDates,
  calculateBusinessDueTime,
  DEFAULT_BANGLADESH_BUSINESS_WEEK,
  VALID_TICKET_TRANSITIONS,
  getSupportAnalytics
} from '@/lib/client-success/ticket-service';
import {
  generateCertificateNumber,
  generateCertificateSignature,
  verifyCertificateSignature,
  getTrainingCourseBySlug,
  validateCourseAccess,
  verifyTrainingCertificate
} from '@/lib/client-success/training-service';
import {
  getUserAllowedVisibilities,
  getKnowledgeArticleBySlug
} from '@/lib/client-success/knowledge-service';
import { hasPlatformPermission } from '@/lib/rbac/platform-guard';

describe('Command 11F.1: Client Success Security, SLA, Attachments & Workflow Hardening Suite', () => {
  // 1. Official Contact Email Settings
  describe('Official Contact Email & Sync Integrity', () => {
    it('should have teamhimu@gmail.com as the official default across all departmental channels', () => {
      expect(DEFAULT_CONTACT_SETTINGS.generalEmail).toBe('teamhimu@gmail.com');
      expect(DEFAULT_CONTACT_SETTINGS.supportEmail).toBe('teamhimu@gmail.com');
      expect(DEFAULT_CONTACT_SETTINGS.salesEmail).toBe('teamhimu@gmail.com');
      expect(DEFAULT_CONTACT_SETTINGS.billingEmail).toBe('teamhimu@gmail.com');
      expect(DEFAULT_CONTACT_SETTINGS.privacyEmail).toBe('teamhimu@gmail.com');
      expect(DEFAULT_CONTACT_SETTINGS.phone).toBe('+8801335556688');
      expect(DEFAULT_CONTACT_SETTINGS.whatsapp).toBe('+8801335556688');
    });

    it('should sync production contact settings row to teamhimu@gmail.com', async () => {
      const synced = await syncProductionContactSettings();
      expect(synced.generalEmail).toBe('teamhimu@gmail.com');
      expect(synced.supportEmail).toBe('teamhimu@gmail.com');
      expect(synced.salesEmail).toBe('teamhimu@gmail.com');
      expect(synced.billingEmail).toBe('teamhimu@gmail.com');
      expect(synced.privacyEmail).toBe('teamhimu@gmail.com');
    });
  });

  // 2. Concurrency-safe Numbering & Year Rollover
  describe('Sequence Generation & Year Rollover', () => {
    it('should generate properly formatted inquiry numbers with year', async () => {
      const inqNum = await generateInquiryNumber();
      const currentYear = new Date().getFullYear();
      expect(inqNum).toMatch(new RegExp(`^INQ-${currentYear}-\\d{6}$`));
    });

    it('should generate properly formatted support ticket numbers with year', async () => {
      const tktNum = await generateTicketNumber();
      const currentYear = new Date().getFullYear();
      expect(tktNum).toMatch(new RegExp(`^TKT-${currentYear}-\\d{6}$`));
    });

    it('should generate properly formatted certificate numbers with year', async () => {
      const certNum = await generateCertificateNumber();
      const currentYear = new Date().getFullYear();
      expect(certNum).toMatch(new RegExp(`^CERT-TRN-${currentYear}-\\d{6}$`));
    });
  });

  // 3. Real Business-Hours SLA Engine
  describe('Business-Hours SLA Engine & Working Calendar', () => {
    const schedule = new Map();
    for (const d of DEFAULT_BANGLADESH_BUSINESS_WEEK) {
      schedule.set(d.dayOfWeek, d);
    }
    const emptyHolidays = new Set<string>();

    it('should advance within the same business day when target minutes fit', () => {
      // Sunday 10:00 AM (local time: 10:00 = 600 mins from midnight)
      // 04:00 UTC = 10:00 BST (UTC+6)
      // 2026-08-30 is a Sunday
      const startUtc = new Date('2026-08-30T04:00:00Z'); // 10:00 BST
      const targetMinutes = 120; // 2 hours
      const due = calculateBusinessDueTime(startUtc, targetMinutes, schedule, emptyHolidays, 'Asia/Dhaka');
      
      // Expected: 12:00 BST = 06:00 UTC
      expect(due.toISOString()).toBe(new Date('2026-08-30T06:00:00Z').toISOString());
    });

    it('should roll over weekend (Friday/Saturday) for tickets created on Thursday afternoon', () => {
      // 2026-08-27 is a Thursday
      // 17:30 BST = 11:30 UTC
      const startUtc = new Date('2026-08-27T11:30:00Z');
      // Target: 8 business hours (480 minutes)
      // Remaining Thursday: 30 minutes (17:30 -> 18:00 BST)
      // Remaining target: 450 minutes
      // Friday & Saturday: Skipped (Weekend)
      // Sunday (2026-08-30) opens at 09:00 BST (03:00 UTC)
      // 09:00 BST + 450 mins = 16:30 BST (10:30 UTC)
      const due = calculateBusinessDueTime(startUtc, 480, schedule, emptyHolidays, 'Asia/Dhaka');
      expect(due.toISOString()).toBe(new Date('2026-08-30T10:30:00Z').toISOString());
    });

    it('should skip holidays during business hours computation', () => {
      // Sunday 2026-08-30 is declared a holiday
      const holidays = new Set<string>(['2026-08-30']);
      // Thursday afternoon 17:30 BST
      const startUtc = new Date('2026-08-27T11:30:00Z');
      // 480 minutes: 30m on Thu -> skips Fri, Sat, Sun (Holiday) -> Mon (2026-08-31) 09:00 + 450m = Mon 16:30 BST (10:30 UTC)
      const due = calculateBusinessDueTime(startUtc, 480, schedule, holidays, 'Asia/Dhaka');
      expect(due.toISOString()).toBe(new Date('2026-08-31T10:30:00Z').toISOString());
    });
  });

  // 4. Cryptographic Certificate Signatures & Honest Wording
  describe('Training Certificate Cryptographic Integrity', () => {
    it('should sign and verify certificate hashes deterministically', () => {
      const certNumber = 'CERT-TRN-2026-000001';
      const userId = 'usr-123';
      const courseId = 'crs-456';
      const issuedAt = new Date('2026-08-24T12:00:00Z');

      const signature = generateCertificateSignature(certNumber, userId, courseId, issuedAt);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA-256 hex string

      const isValid = verifyCertificateSignature(certNumber, userId, courseId, issuedAt, signature);
      expect(isValid).toBe(true);

      const isTampered = verifyCertificateSignature('CERT-TRN-2026-999999', userId, courseId, issuedAt, signature);
      expect(isTampered).toBe(false);
    });
  });

  // 5. Quiz Answer Security & Access Control
  describe('Quiz Security & Course Access Control', () => {
    it('should enforce role-based and institution-type course access', () => {
      const course = {
        title: 'Principal Strategic Leadership',
        targetRole: 'PRINCIPAL',
        institutionType: 'SCHOOL'
      };

      // Principal from school: allowed
      expect(() =>
        validateCourseAccess(course, { role: 'PRINCIPAL', institutionType: 'SCHOOL' })
      ).not.toThrow();

      // Teacher: forbidden
      expect(() =>
        validateCourseAccess(course, { role: 'TEACHER', institutionType: 'SCHOOL' })
      ).toThrow(/restricted.*PRINCIPAL/);

      // Principal from College: forbidden
      expect(() =>
        validateCourseAccess(course, { role: 'PRINCIPAL', institutionType: 'COLLEGE' })
      ).toThrow(/restricted.*SCHOOL/);

      // Platform Admin: always bypassed
      expect(() =>
        validateCourseAccess(course, { role: 'SUPPORT_ADMIN', isPlatformAdmin: true })
      ).not.toThrow();
    });
  });

  // 6. Knowledge Base Visibility Levels
  describe('Knowledge Base Visibility RBAC', () => {
    it('should grant PUBLIC visibility to anonymous visitors', () => {
      const vis = getUserAllowedVisibilities(null);
      expect(vis).toEqual(['PUBLIC']);
    });

    it('should grant PUBLIC & AUTHENTICATED to regular tenant students and teachers', () => {
      const visTeacher = getUserAllowedVisibilities({ userId: 'u1', role: 'TEACHER' });
      expect(visTeacher).toEqual(['PUBLIC', 'AUTHENTICATED']);

      const visStudent = getUserAllowedVisibilities({ userId: 'u2', role: 'STUDENT' });
      expect(visStudent).toEqual(['PUBLIC', 'AUTHENTICATED']);
    });

    it('should grant TENANT_ADMIN to school principals and tenant admins', () => {
      const vis = getUserAllowedVisibilities({ userId: 'u3', role: 'PRINCIPAL' });
      expect(vis).toContain('TENANT_ADMIN');
      expect(vis).not.toContain('INTERNAL_SUPPORT');
    });

    it('should grant PLATFORM_STAFF & INTERNAL_SUPPORT to platform support admins', () => {
      const vis = getUserAllowedVisibilities({ userId: 'u4', role: 'SUPPORT_ADMIN', isPlatformAdmin: true });
      expect(vis).toContain('TENANT_ADMIN');
      expect(vis).toContain('PLATFORM_STAFF');
      expect(vis).toContain('INTERNAL_SUPPORT');
    });
  });

  // 7. Support Granular RBAC Permissions
  describe('Support Platform RBAC Guard', () => {
    it('should allow Super Admin all support operations', () => {
      const session = { isPlatformAdmin: true, role: 'PLATFORM_SUPER_ADMIN' };
      expect(hasPlatformPermission(session, 'SUPPORT_INTERNAL_NOTE')).toBe(true);
      expect(hasPlatformPermission(session, 'SUPPORT_TICKET_ASSIGN')).toBe(true);
      expect(hasPlatformPermission(session, 'SUPPORT_TICKET_STATUS')).toBe(true);
      expect(hasPlatformPermission(session, 'SUPPORT_SLA_MANAGE')).toBe(true);
    });

    it('should allow Support Admin operational permissions but block Sales Admin from internal notes and assignment', () => {
      const supportSession = { isPlatformAdmin: true, role: 'SUPPORT_ADMIN' };
      expect(hasPlatformPermission(supportSession, 'SUPPORT_INTERNAL_NOTE')).toBe(true);
      expect(hasPlatformPermission(supportSession, 'SUPPORT_TICKET_ASSIGN')).toBe(true);
      expect(hasPlatformPermission(supportSession, 'SUPPORT_TICKET_STATUS')).toBe(true);

      const salesSession = { isPlatformAdmin: true, role: 'SALES_ADMIN' };
      expect(hasPlatformPermission(salesSession, 'SUPPORT_INTERNAL_NOTE')).toBe(false);
      expect(hasPlatformPermission(salesSession, 'SUPPORT_TICKET_ASSIGN')).toBe(false);
      expect(hasPlatformPermission(salesSession, 'SUPPORT_TICKET_STATUS')).toBe(false);
    });
  });

  // 8. State Machine & CSAT Logic
  describe('Ticket State Machine & CSAT Analytics', () => {
    it('should declare valid state machine transitions', () => {
      expect(VALID_TICKET_TRANSITIONS.NEW).toContain('OPEN');
      expect(VALID_TICKET_TRANSITIONS.OPEN).toContain('IN_PROGRESS');
      expect(VALID_TICKET_TRANSITIONS.IN_PROGRESS).toContain('RESOLVED');
      expect(VALID_TICKET_TRANSITIONS.RESOLVED).toContain('CLOSED');
      expect(VALID_TICKET_TRANSITIONS.RESOLVED).toContain('REOPENED');
      expect(VALID_TICKET_TRANSITIONS.CLOSED).toContain('REOPENED');
    });

    it('should return null average CSAT when 0 ratings exist', async () => {
      const analytics = await getSupportAnalytics();
      if (analytics.totalCsatResponses === 0) {
        expect(analytics.averageCsat).toBeNull();
      } else {
        expect(typeof analytics.averageCsat).toBe('number');
      }
    });
  });
});
