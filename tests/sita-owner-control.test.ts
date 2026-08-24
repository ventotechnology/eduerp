import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasPermission } from '@/lib/rbac/permissions';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';
import {
  createAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
  applyMadrashaStarterTemplate
} from '@/lib/services/academic-structure-service';
import { db } from '@/lib/db';

describe('Command 12A.3: Real Institution Owner Control Center, Academic Setup & Subscription Lifecycle', () => {

  const mockActor: any = {
    id: 'user-principal-1',
    name: 'Mohammad Saifullah',
    email: 'contact@scholarsita.com',
    role: 'PRINCIPAL',
    tenantId: 'tenant-sita-1',
    isPlatformAdmin: false
  };

  describe('1. RBAC & Institutional Authority for Principal / Owner', () => {
    it('grants PRINCIPAL full tenant operational permissions across academic and administrative resources', () => {
      expect(hasPermission('PRINCIPAL', 'CREATE', 'ACADEMICS')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'MANAGE', 'ACADEMIC_YEARS')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'ADMISSION')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'STUDENTS')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'EMPLOYEES')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'FEES_INVOICES')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'ACCOUNTING_LEDGER')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'MANAGE', 'FACILITIES')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'CREATE', 'COMMUNICATION')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'MANAGE', 'SETTINGS')).toBe(true);
      expect(hasPermission('PRINCIPAL', 'VIEW', 'REPORTS')).toBe(true);
    });

    it('grants OWNER full institutional authority with tenant scope', () => {
      expect(hasPermission('OWNER', 'MANAGE', 'ACADEMICS')).toBe(true);
      expect(hasPermission('OWNER', 'MANAGE', 'ACADEMIC_YEARS')).toBe(true);
      expect(hasPermission('OWNER', 'MANAGE', 'STUDENTS')).toBe(true);
      expect(hasPermission('OWNER', 'MANAGE', 'FEES_INVOICES')).toBe(true);
      expect(hasPermission('OWNER', 'MANAGE', 'SETTINGS')).toBe(true);
    });

    it('ensures PRINCIPAL cannot access platform-level administrative capabilities', () => {
      expect(hasPermission('PRINCIPAL', 'MANAGE', 'PLATFORM_SETTINGS' as any)).toBe(false);
      expect(hasPermission('PRINCIPAL', 'DELETE', 'TENANTS' as any)).toBe(false);
    });
  });

  describe('2. Academic Structure & Madrasha Template Initialization', () => {
    it('creates an academic year and enforces single active current year', async () => {
      vi.spyOn(db.tenant, 'findUnique').mockResolvedValueOnce({
        id: 'tenant-sita-1',
        slug: 'sita',
        institution: { id: 'inst-sita-1' }
      } as any);

      vi.spyOn(db.academicYear, 'findFirst').mockResolvedValueOnce(null);
      vi.spyOn(db.academicYear, 'updateMany').mockResolvedValueOnce({ count: 1 });
      vi.spyOn(db.academicYear, 'create').mockResolvedValueOnce({
        id: 'ay-2026',
        institutionId: 'inst-sita-1',
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isCurrent: true
      } as any);

      const ay = await createAcademicYear('sita', {
        name: '2026',
        code: 'AY-2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: 'ACTIVE',
        isCurrent: true
      }, mockActor);

      expect(ay.name).toBe('2026');
      expect(ay.isCurrent).toBe(true);
    });

    it('sets an academic year as current by unmarking other years', async () => {
      vi.spyOn(db.tenant, 'findUnique').mockResolvedValueOnce({
        id: 'tenant-sita-1',
        slug: 'sita',
        institution: { id: 'inst-sita-1' }
      } as any);

      vi.spyOn(db.academicYear, 'findFirst').mockResolvedValueOnce({
        id: 'ay-2027',
        institutionId: 'inst-sita-1',
        name: '2027'
      } as any);

      vi.spyOn(db.academicYear, 'updateMany').mockResolvedValueOnce({ count: 1 });
      vi.spyOn(db.academicYear, 'update').mockResolvedValueOnce({
        id: 'ay-2027',
        name: '2027',
        isCurrent: true,
        status: 'ACTIVE'
      } as any);

      const updated = await setCurrentAcademicYear('sita', 'ay-2027', mockActor);
      expect(updated.isCurrent).toBe(true);
      expect(updated.status).toBe('ACTIVE');
    });

    it('blocks academic year deletion when associated admission applications exist', async () => {
      vi.spyOn(db.tenant, 'findUnique').mockResolvedValueOnce({
        id: 'tenant-sita-1',
        slug: 'sita',
        institution: { id: 'inst-sita-1' }
      } as any);

      vi.spyOn(db.academicYear, 'findFirst').mockResolvedValueOnce({
        id: 'ay-2026',
        institutionId: 'inst-sita-1',
        name: '2026'
      } as any);

      vi.spyOn(db.admissionApplication, 'count').mockResolvedValueOnce(5); // 5 applications exist

      await expect(deleteAcademicYear('sita', 'ay-2026', mockActor)).rejects.toThrow(
        /Cannot delete academic year/
      );
    });

    it('applies Madrasha Starter Template structure cleanly without creating fake students', async () => {
      vi.spyOn(db.tenant, 'findUnique').mockResolvedValueOnce({
        id: 'tenant-sita-1',
        slug: 'sita',
        institution: { id: 'inst-sita-1' }
      } as any);

      vi.spyOn(db.academicYear, 'findFirst').mockResolvedValueOnce(null);
      vi.spyOn(db.academicYear, 'updateMany').mockResolvedValueOnce({ count: 0 });
      vi.spyOn(db.academicYear, 'create').mockResolvedValueOnce({ id: 'ay-2026', name: '2026' } as any);
      vi.spyOn(db.session, 'create').mockResolvedValueOnce({ id: 'sess-2026' } as any);
      vi.spyOn(db.shift, 'findFirst').mockResolvedValueOnce({ id: 'shift-1' } as any);

      // Classes mock
      vi.spyOn(db.class, 'findFirst').mockResolvedValue(null);
      vi.spyOn(db.class, 'create').mockResolvedValue({ id: 'cls-1', numericValue: 1 } as any);
      vi.spyOn(db.section, 'findFirst').mockResolvedValue(null);
      vi.spyOn(db.section, 'create').mockResolvedValue({ id: 'sec-1' } as any);
      vi.spyOn(db.subject, 'findFirst').mockResolvedValue(null);
      vi.spyOn(db.subject, 'create').mockResolvedValue({ id: 'sub-1' } as any);

      const templateResult = await applyMadrashaStarterTemplate('sita', mockActor);
      expect(templateResult.success).toBe(true);
      expect(templateResult.classesCreated).toBeGreaterThan(0);
      expect(templateResult.sectionsCreated).toBeGreaterThan(0);
      expect(templateResult.subjectsCreated).toBeGreaterThan(0);
      expect(templateResult.message).toContain('Madrasha Starter Template applied successfully');
    });
  });

  describe('3. Downgrade Usage Guard & Entitlement Checks', () => {
    it('blocks plan downgrade when active student count exceeds target plan capacity', async () => {
      vi.spyOn(db.subscriptionPlan, 'findUnique').mockResolvedValueOnce({
        id: 'plan_starter',
        tier: 'STARTER',
        name: 'Starter Tier',
        maxStudents: 250,
        monthlyPrice: 4500,
        annualPrice: 45000,
        currency: 'BDT'
      } as any);

      vi.spyOn(db.student, 'count').mockResolvedValueOnce(350);

      const result = await SaasCheckoutService.validateDowngradeEligibility('tenant-123', 'plan_starter');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DOWNGRADE_BLOCKED_BY_USAGE');
      expect(result.currentStudents).toBe(350);
      expect(result.maxStudents).toBe(250);
      expect(result.message).toContain('exceeds the limit of 250');
    });

    it('allows plan downgrade when active student count is within target plan capacity', async () => {
      vi.spyOn(db.subscriptionPlan, 'findUnique').mockResolvedValueOnce({
        id: 'plan_standard',
        tier: 'STANDARD',
        name: 'Standard Tier',
        maxStudents: 750,
        monthlyPrice: 9500,
        annualPrice: 95000,
        currency: 'BDT'
      } as any);

      vi.spyOn(db.student, 'count').mockResolvedValueOnce(180);

      const result = await SaasCheckoutService.validateDowngradeEligibility('tenant-123', 'plan_standard');
      expect(result.allowed).toBe(true);
      expect(result.currentStudents).toBe(180);
      expect(result.maxStudents).toBe(750);
    });
  });

  describe('4. Offline Payment & Verification Lifecycle', () => {
    it('submits offline bank transfer proof with PENDING_REVIEW status and does not auto-fulfill', async () => {
      vi.spyOn(db.subscriptionOrder, 'findUnique').mockResolvedValueOnce({
        id: 'order-101',
        orderNumber: 'ORD-2026-001',
        totalAmount: 95000,
        currency: 'BDT',
        status: 'PENDING',
        signup: null,
        plan: { id: 'plan-std', name: 'Standard' }
      } as any);

      vi.spyOn(db.subscriptionPaymentTransaction, 'create').mockResolvedValueOnce({ id: 'trx-101' } as any);
      vi.spyOn(db.subscriptionOrder, 'update').mockResolvedValueOnce({ id: 'order-101', status: 'PROCESSING' } as any);

      const res = await SaasCheckoutService.submitBankTransferPayment({
        orderId: 'order-101',
        bankName: 'City Bank',
        accountNumber: '1102345678001',
        transactionRef: 'TRX-998877',
        depositDate: '2026-08-24',
        notes: 'Annual subscription fee deposit'
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('PENDING_REVIEW');
      expect(res.orderNumber).toBe('ORD-2026-001');
    });

    it('rejects manual payment with official reason and marks order CANCELLED', async () => {
      vi.spyOn(db.subscriptionOrder, 'findUnique').mockResolvedValueOnce({
        id: 'order-102',
        orderNumber: 'ORD-2026-002',
        status: 'PROCESSING'
      } as any);

      vi.spyOn(db.subscriptionOrder, 'update').mockResolvedValueOnce({ id: 'order-102', status: 'CANCELLED' } as any);
      vi.spyOn(db.subscriptionPaymentTransaction, 'updateMany').mockResolvedValueOnce({ count: 1 } as any);

      const res = await SaasCheckoutService.rejectManualPayment('order-102', 'Deposit slip does not match bank record', 'super-admin-1');
      expect(res.success).toBe(true);
      expect(res.status).toBe('REJECTED');
      expect(res.rejectionReason).toBe('Deposit slip does not match bank record');
    });

    it('marks manual payment failed with failure details', async () => {
      vi.spyOn(db.subscriptionOrder, 'findUnique').mockResolvedValueOnce({
        id: 'order-103',
        orderNumber: 'ORD-2026-003',
        status: 'PROCESSING'
      } as any);

      vi.spyOn(db.subscriptionOrder, 'update').mockResolvedValueOnce({ id: 'order-103', status: 'FAILED' } as any);
      vi.spyOn(db.subscriptionPaymentTransaction, 'updateMany').mockResolvedValueOnce({ count: 1 } as any);

      const res = await SaasCheckoutService.markManualPaymentFailed('order-103', 'Cheque bounced', 'super-admin-1');
      expect(res.success).toBe(true);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toBe('Cheque bounced');
    });
  });

});
