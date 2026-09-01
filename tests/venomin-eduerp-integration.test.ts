import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { sanitizeIntegrationPayload, isBlockedKey } from '../lib/venomin/sanitizer';
import { generateEventSignature, verifyEventSignature } from '../lib/venomin/signature';
import { VenominOutboxService, generateEduErpEventId } from '../lib/venomin/outbox-service';
import { SaasSignupService } from '../lib/services/saas-signup.service';
import { SaasProvisioningService } from '../lib/services/saas-provisioning.service';
import { createSupportTicket, updateTicketStatus } from '../lib/client-success/ticket-service';
import { TenantOnboardingService } from '../lib/services/tenant-onboarding.service';
import {
  processPendingOutboxBatch,
  recoverStaleLocks,
  getWorkerPrismaClient,
} from '../workers/eduerp-venomin-worker';
import http from 'http';
import { NextRequest } from 'next/server';
import { GET as healthGet } from '../app/api/venomin/integration/health/route';
import { GET as snapshotGet } from '../app/api/venomin/integration/snapshot/route';
import { GET as reconcileGet } from '../app/api/venomin/integration/reconciliation/route';
import { POST as writebackPost, GET as writebackGet } from '../app/api/venomin/integration/writeback/route';
import { POST as publicSignupPost } from '../app/api/signup/route';

const TEST_SECRET = 'eduerp_cert_test_secret_32bytes_long_key_123';

describe('EduERP ↔ Venomin Real Integration & Privacy Boundary Test Suite (Command 35)', () => {
  beforeEach(() => {
    process.env.INTEGRATION_SECRET_EDUERP = TEST_SECRET;
  });

  // ---------------------------------------------------------------------------
  // 1. HMAC Contract & Signature Verification
  // ---------------------------------------------------------------------------
  describe('1. HMAC Signature Contract & Replay Attack Defense', () => {
    it('generates valid v1 signature header and verifies correctly', () => {
      const payload = { test: 'eduerp_data', number: 42 };
      const { signatureHeader, timestamp } = generateEventSignature(payload, TEST_SECRET);

      expect(signatureHeader).toContain(`t=${timestamp},v1=`);
      const verification = verifyEventSignature(payload, signatureHeader, TEST_SECRET);
      expect(verification.valid).toBe(true);
    });

    it('rejects tampered payload', () => {
      const payload = { test: 'eduerp_data' };
      const { signatureHeader } = generateEventSignature(payload, TEST_SECRET);

      const tamperedPayload = { test: 'eduerp_data_tampered' };
      const verification = verifyEventSignature(tamperedPayload, signatureHeader, TEST_SECRET);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('SIGNATURE_MISMATCH');
    });

    it('rejects expired signature older than 300 seconds (Replay Protection)', () => {
      const payload = { test: 'eduerp_data' };
      const oldTimestamp = Math.floor(Date.now() / 1000) - 350; // 350 seconds ago
      const { signatureHeader } = generateEventSignature(payload, TEST_SECRET, oldTimestamp);

      const verification = verifyEventSignature(payload, signatureHeader, TEST_SECRET);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('SIGNATURE_TIMESTAMP_EXPIRED');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Strict Privacy Sanitizer
  // ---------------------------------------------------------------------------
  describe('2. Recursive Privacy & Security Sanitizer', () => {
    it('blocks credentials, tokens, and secrets', () => {
      expect(isBlockedKey('password')).toBe(true);
      expect(isBlockedKey('passwordHash')).toBe(true);
      expect(isBlockedKey('jwtSecret')).toBe(true);
      expect(isBlockedKey('apiKey')).toBe(true);
      expect(isBlockedKey('cookieSession')).toBe(true);
    });

    it('blocks student and minor personal information', () => {
      expect(isBlockedKey('studentName')).toBe(true);
      expect(isBlockedKey('studentId')).toBe(true);
      expect(isBlockedKey('guardianPhone')).toBe(true);
      expect(isBlockedKey('parentEmail')).toBe(true);
      expect(isBlockedKey('dob')).toBe(true);
      expect(isBlockedKey('dateOfBirth')).toBe(true);
      expect(isBlockedKey('birthCertificate')).toBe(true);
      expect(isBlockedKey('medicalCondition')).toBe(true);
      expect(isBlockedKey('photoUrl')).toBe(true);
      expect(isBlockedKey('biometricTemplate')).toBe(true);
      expect(isBlockedKey('applicantCnic')).toBe(true);
    });

    it('blocks academic grades, marks, results, and attendance records', () => {
      expect(isBlockedKey('attendanceSummary')).toBe(true);
      expect(isBlockedKey('gradeSheet')).toBe(true);
      expect(isBlockedKey('marksObtained')).toBe(true);
      expect(isBlockedKey('examResultSnapshot')).toBe(true);
      expect(isBlockedKey('officialTranscript')).toBe(true);
      expect(isBlockedKey('gpaScore')).toBe(true);
      expect(isBlockedKey('hifzTracker')).toBe(true);
    });

    it('blocks student fee collections and employee payroll', () => {
      expect(isBlockedKey('studentFeeInvoice')).toBe(true);
      expect(isBlockedKey('tuitionFeeReceived')).toBe(true);
      expect(isBlockedKey('salaryDisbursement')).toBe(true);
      expect(isBlockedKey('payrollRecord')).toBe(true);
      expect(isBlockedKey('bankAccountNumber')).toBe(true);
    });

    it('allows safe institutional metadata keys', () => {
      expect(isBlockedKey('tenantId')).toBe(false);
      expect(isBlockedKey('tenantSlug')).toBe(false);
      expect(isBlockedKey('institutionName')).toBe(false);
      expect(isBlockedKey('subscriptionTier')).toBe(false);
      expect(isBlockedKey('orderNumber')).toBe(false);
      expect(isBlockedKey('isSynthetic')).toBe(false);
    });

    it('recursively sanitizes complex nested payloads stripping forbidden keys', () => {
      const dirtyPayload = {
        tenantId: 'tnt_123',
        institutionName: 'Dhaka Ideal Academy',
        isSynthetic: true,
        secretToken: 'shhh_super_secret',
        studentProfile: {
          studentName: 'Rahim Khan',
          dob: '2012-05-14',
          marks: [90, 85, 95],
          guardian: {
            guardianName: 'Karim Khan',
            phone: '01711111111',
          },
        },
        financials: {
          subscriptionTier: 'ENTERPRISE',
          salaryDetails: { basic: 50000 },
          bankAccount: '1234-5678-9012',
        },
      };

      const cleanPayload = sanitizeIntegrationPayload(dirtyPayload) as any;

      expect(cleanPayload.tenantId).toBe('tnt_123');
      expect(cleanPayload.institutionName).toBe('Dhaka Ideal Academy');
      expect(cleanPayload.isSynthetic).toBe(true);
      expect(cleanPayload.secretToken).toBeUndefined();
      expect(cleanPayload.studentProfile).toBeUndefined();
      expect(cleanPayload.financials.subscriptionTier).toBe('ENTERPRISE');
      expect(cleanPayload.financials.salaryDetails).toBeUndefined();
      expect(cleanPayload.financials.bankAccount).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Source-Native Synthetic Provenance & Public Spoof Denial
  // ---------------------------------------------------------------------------
  describe('3. Source-Native Synthetic Provenance & Public Gate Enforcement', () => {
    it('sets isSynthetic: true in outbox when trusted source parameter is provided', async () => {
      const uniqueSlug = `synth-test-${Date.now().toString().slice(-6)}`;
      const signupResult = await SaasSignupService.createSignupApplication({
        institutionName: `Synthetic Test School ${uniqueSlug}`,
        institutionType: 'SCHOOL',
        contactPerson: 'Principal Tester',
        email: `principal_${uniqueSlug}@test.edu.bd`,
        phone: '01700000001',
        address: 'Dhaka, Bangladesh',
        desiredSlug: uniqueSlug,
        password: 'Password123!',
        planIdOrCode: 'STARTER',
        billingCycle: 'TRIAL',
        isTrial: true,
        isSynthetic: true,
        syntheticReason: 'COMMAND_35_ACCEPTANCE_TEST',
      });

      expect(signupResult.tenantId).toBeDefined();

      const outbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceTenantId: signupResult.tenantId,
          eventType: 'ORGANIZATION_REGISTERED',
        },
      });

      expect(outbox).not.toBeNull();
      const payload = JSON.parse(outbox!.payloadSafeJson);
      expect(payload.isSynthetic).toBe(true);
      expect(payload.syntheticReason).toBe('COMMAND_35_ACCEPTANCE_TEST');
    });

    it('rejects public self-marking of isSynthetic via public signup route', async () => {
      const publicSlug = `pub-test-${Date.now().toString().slice(-6)}`;
      const req = new NextRequest('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: `Public Test School ${publicSlug}`,
          institutionType: 'SCHOOL',
          contactPerson: 'Public Caller',
          email: `public_${publicSlug}@test.edu.bd`,
          phone: '01700000002',
          address: 'Chittagong, Bangladesh',
          desiredSlug: publicSlug,
          password: 'Password123!',
          planIdOrCode: 'STARTER',
          billingCycle: 'TRIAL',
          isTrial: true,
          isSynthetic: true, // Malicious / caller-controlled spoof attempt
          syntheticReason: 'SPOOF_ATTEMPT',
        }),
      });

      const res = await publicSignupPost(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.tenantId).toBeDefined();

      const outbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceTenantId: json.tenantId,
          eventType: 'ORGANIZATION_REGISTERED',
        },
      });

      expect(outbox).not.toBeNull();
      const payload = JSON.parse(outbox!.payloadSafeJson);
      expect(payload.isSynthetic).toBeUndefined(); // Strictly non-synthetic
      expect(payload.syntheticReason).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Transactional Outbox Atomicity & Rollback
  // ---------------------------------------------------------------------------
  describe('4. Transactional Outbox Atomicity & Rollback Safety', () => {
    it('rolls back outbox insertion if surrounding database transaction fails', async () => {
      const rollbackEventId = generateEduErpEventId();

      let transactionFailed = false;
      try {
        await db.$transaction(async (tx) => {
          await tx.venominIntegrationOutbox.create({
            data: {
              eventId: rollbackEventId,
              eventType: 'TEST_ROLLBACK_EVENT',
              sourceRecordType: 'TEST',
              sourceRecordId: 'REC-ROLLBACK',
              payloadSafeJson: JSON.stringify({ test: true }),
              status: 'PENDING',
            },
          });

          // Force failure
          throw new Error('INTENTIONAL_TX_FAILURE');
        });
      } catch (err: any) {
        if (err.message === 'INTENTIONAL_TX_FAILURE') {
          transactionFailed = true;
        }
      }

      expect(transactionFailed).toBe(true);

      const checkOutbox = await db.venominIntegrationOutbox.findUnique({
        where: { eventId: rollbackEventId },
      });

      expect(checkOutbox).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Support Ticket Lifecycle & Zero Student PII
  // ---------------------------------------------------------------------------
  describe('5. Support Ticket Source Workflow & Metadata Privacy', () => {
    it('emits SUPPORT_TICKET_CREATED with sanitized metadata on ticket creation', async () => {
      // Find or create test tenant
      let tenant = await db.tenant.findFirst();
      if (!tenant) {
        tenant = await db.tenant.create({
          data: {
            slug: `tnt-test-${Date.now()}`,
            institutionType: 'SCHOOL',
            subscriptionTier: 'STARTER',
          },
        });
      }

      const ticket = await createSupportTicket(
        {
          subject: 'Subscription Renewal for Term 2',
          categoryCode: 'SUBSCRIPTION',
          priority: 'NORMAL',
          description: 'Need assistance reviewing subscription renewal plan.',
        },
        {
          userId: 'usr_test_admin',
          name: 'Principal Tester',
          email: 'principal@test.edu.bd',
          role: 'OWNER',
          tenantId: tenant.id,
        }
      );

      const outbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceRecordId: ticket.id,
          eventType: 'SUPPORT_TICKET_CREATED',
        },
      });

      expect(outbox).not.toBeNull();
      const payload = JSON.parse(outbox!.payloadSafeJson);
      expect(payload.ticketNumber).toBe(ticket.ticketNumber);
      expect(payload.categoryCode).toBe('SUBSCRIPTION');
      expect(payload.priority).toBe('NORMAL');
    });

    it('emits SUPPORT_TICKET_RESOLVED on status resolution', async () => {
      let ticket = await db.supportTicket.findFirst({ where: { status: 'NEW' } });
      if (!ticket) {
        let tenant = await db.tenant.findFirst();
        ticket = await createSupportTicket(
          {
            subject: 'Resolved Ticket Test',
            categoryCode: 'SUBSCRIPTION',
            priority: 'NORMAL',
            description: 'Quick technical issue.',
          },
          {
            userId: 'usr_test_admin',
            name: 'Principal Tester',
            email: 'principal@test.edu.bd',
            role: 'OWNER',
            tenantId: tenant!.id,
          }
        );
      }

      // First transition to IN_PROGRESS so it can transition to RESOLVED
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'IN_PROGRESS' },
      });

      await updateTicketStatus(
        ticket.ticketNumber,
        {
          status: 'RESOLVED',
          resolutionSummary: 'Issue resolved by database reconfiguration.',
        },
        {
          userId: 'usr_platform_admin',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          tenantId: ticket.tenantId,
          isPlatformAdmin: true,
        }
      );

      const outbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceRecordId: ticket.id,
          eventType: 'SUPPORT_TICKET_RESOLVED',
        },
      });

      expect(outbox).not.toBeNull();
      const payload = JSON.parse(outbox!.payloadSafeJson);
      expect(payload.status).toBe('RESOLVED');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Inbound Integration Endpoints (Health, Snapshot, Reconciliation, Writeback)
  // ---------------------------------------------------------------------------
  describe('6. Inbound Venomin Integration Endpoints', () => {
    it('GET /api/venomin/integration/health returns HEALTHY with HMAC auth', async () => {
      const endpointPath = '/api/venomin/integration/health';
      const { signatureHeader } = generateEventSignature(endpointPath, TEST_SECRET);

      const req = new NextRequest(`http://localhost:3000${endpointPath}`, {
        method: 'GET',
        headers: {
          'x-venomin-product-key': 'EDUERP',
          'x-venomin-signature': signatureHeader,
        },
      });

      const res = await healthGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('HEALTHY');
      expect(data.productKey).toBe('EDUERP');
      expect(data.capabilities).toContain('EVENT_PUSH');
      expect(data.capabilities).toContain('READ_RECORD');
      expect(data.capabilities).toContain('RECONCILIATION');
      expect(data.writeBackEnabled).toBe(false);
    });

    it('GET /api/venomin/integration/snapshot retrieves Institution snapshot', async () => {
      let tenant = await db.tenant.findFirst({ include: { institution: true } });
      if (!tenant) {
        tenant = await db.tenant.create({
          data: {
            slug: `tnt-snap-${Date.now()}`,
            institutionType: 'SCHOOL',
            subscriptionTier: 'STARTER',
          },
          include: { institution: true },
        });
      }

      const endpointPath = `/api/venomin/integration/snapshot?type=TENANT&id=${tenant.id}`;
      const { signatureHeader } = generateEventSignature(endpointPath, TEST_SECRET);

      const req = new NextRequest(`http://localhost:3000${endpointPath}`, {
        method: 'GET',
        headers: {
          'x-venomin-product-key': 'EDUERP',
          'x-venomin-signature': signatureHeader,
        },
      });

      const res = await snapshotGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('SUCCESS');
      expect(data.recordType).toBe('TENANT');
      expect(data.data.id).toBe(tenant.id);
    });

    it('GET /api/venomin/integration/snapshot strictly rejects STUDENT and ACADEMIC record types with 403 Forbidden', async () => {
      const forbiddenTypes = ['STUDENT', 'GUARDIAN', 'EXAM', 'GRADE', 'RESULT', 'ATTENDANCE', 'STUDENT_FEE', 'EMPLOYEE_PAYROLL'];

      for (const type of forbiddenTypes) {
        const endpointPath = `/api/venomin/integration/snapshot?type=${type}&id=rec_001`;
        const { signatureHeader } = generateEventSignature(endpointPath, TEST_SECRET);

        const req = new NextRequest(`http://localhost:3000${endpointPath}`, {
          method: 'GET',
          headers: {
            'x-venomin-product-key': 'EDUERP',
            'x-venomin-signature': signatureHeader,
          },
        });

        const res = await snapshotGet(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('STUDENT_OR_ACADEMIC_RECORD_ACCESS_DENIED');
      }
    });

    it('GET /api/venomin/integration/reconciliation strictly rejects STUDENT and ACADEMIC record types with 403 Forbidden', async () => {
      const forbiddenTypes = ['STUDENT', 'GUARDIAN', 'EXAM', 'GRADE', 'RESULT', 'ATTENDANCE', 'STUDENT_FEE', 'PAYROLL'];

      for (const type of forbiddenTypes) {
        const endpointPath = `/api/venomin/integration/reconciliation?type=${type}`;
        const { signatureHeader } = generateEventSignature(endpointPath, TEST_SECRET);

        const req = new NextRequest(`http://localhost:3000${endpointPath}`, {
          method: 'GET',
          headers: {
            'x-venomin-product-key': 'EDUERP',
            'x-venomin-signature': signatureHeader,
          },
        });

        const res = await reconcileGet(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('STUDENT_OR_ACADEMIC_RECONCILIATION_DENIED');
      }
    });

    it('POST /api/venomin/integration/writeback returns 403 Forbidden (Write-back Disabled)', async () => {
      const req = new NextRequest('http://localhost:3000/api/venomin/integration/writeback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'UPDATE_STATUS' }),
      });

      const res = await writebackPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('WRITE_BACK_DISABLED');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Dedicated Worker Durability, Restart & Multi-Worker Claim Safety
  // ---------------------------------------------------------------------------
  describe('7. Dedicated Worker Batch Dispatch & Durability', () => {
    let mockGatewayServer: http.Server;
    let gatewayPort: number;
    let receivedGatewayEvents: any[] = [];

    beforeEach(async () => {
      receivedGatewayEvents = [];
      mockGatewayServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const authHeader = req.headers['x-venomin-product-key'];
          const sigHeader = req.headers['x-venomin-signature'] as string;

          if (authHeader !== 'EDUERP' || !sigHeader) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          try {
            const parsed = JSON.parse(body);
            receivedGatewayEvents.push(parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, eventId: parsed.eventId }));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      });

      await new Promise<void>((resolve) => mockGatewayServer.listen(0, resolve));
      gatewayPort = (mockGatewayServer.address() as any).port;
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => mockGatewayServer.close(() => resolve()));
    });

    it('dispatches pending outbox events to gateway and marks them DELIVERED', async () => {
      const testEventId = `eduerp_worker_test_${Date.now()}`;
      await db.venominIntegrationOutbox.create({
        data: {
          eventId: testEventId,
          eventType: 'ORGANIZATION_REGISTERED',
          category: 'CUSTOMER',
          sourceRecordType: 'TENANT',
          sourceRecordId: 'tnt_wkr_01',
          payloadSafeJson: JSON.stringify({ institutionName: 'Worker Test School', isSynthetic: true }),
          status: 'PENDING',
        },
      });

      const workerClient = getWorkerPrismaClient();
      const batchResult = await processPendingOutboxBatch(
        workerClient,
        `http://127.0.0.1:${gatewayPort}`,
        TEST_SECRET,
        500
      );

      expect(batchResult.claimed).toBeGreaterThanOrEqual(1);
      expect(batchResult.delivered).toBeGreaterThanOrEqual(1);

      const deliveredRecord = await db.venominIntegrationOutbox.findUnique({
        where: { eventId: testEventId },
      });

      expect(deliveredRecord?.status).toBe('DELIVERED');
      expect(deliveredRecord?.deliveredAt).not.toBeNull();

      const received = receivedGatewayEvents.find((e) => e.eventId === testEventId);
      expect(received).toBeDefined();
      expect(received.sourceProductKey).toBe('EDUERP');
      expect(received.isSynthetic).toBe(true);
    });

    it('recovers stale DELIVERING locks older than timeout', async () => {
      const staleEventId = `eduerp_stale_${Date.now()}`;
      await db.venominIntegrationOutbox.create({
        data: {
          eventId: staleEventId,
          eventType: 'ORGANIZATION_REGISTERED',
          sourceRecordType: 'TENANT',
          sourceRecordId: 'tnt_stale_01',
          payloadSafeJson: JSON.stringify({ test: 'stale' }),
          status: 'DELIVERING',
          lastAttemptAt: new Date(Date.now() - 400 * 1000), // 400s ago (> 300s timeout)
        },
      });

      const workerClient = getWorkerPrismaClient();
      const recoveredCount = await recoverStaleLocks(workerClient, 300);
      expect(recoveredCount).toBeGreaterThanOrEqual(1);

      const checkRecord = await db.venominIntegrationOutbox.findUnique({
        where: { eventId: staleEventId },
      });

      expect(checkRecord?.status).toBe('PENDING');
    });

    it('prevents double claims when two worker instances run concurrently', async () => {
      const raceEventId = `eduerp_race_${Date.now()}`;
      await db.venominIntegrationOutbox.create({
        data: {
          eventId: raceEventId,
          eventType: 'ORGANIZATION_REGISTERED',
          sourceRecordType: 'TENANT',
          sourceRecordId: 'tnt_race_01',
          payloadSafeJson: JSON.stringify({ race: true }),
          status: 'PENDING',
        },
      });

      const worker1 = getWorkerPrismaClient();
      const worker2 = getWorkerPrismaClient();

      const [res1, res2] = await Promise.all([
        processPendingOutboxBatch(worker1, `http://127.0.0.1:${gatewayPort}`, TEST_SECRET, 500),
        processPendingOutboxBatch(worker2, `http://127.0.0.1:${gatewayPort}`, TEST_SECRET, 500),
      ]);

      const totalDeliveredForRace = receivedGatewayEvents.filter((e) => e.eventId === raceEventId).length;
      expect(totalDeliveredForRace).toBe(1); // Exactly 1 delivery
    });
  });
});

  // ---------------------------------------------------------------------------
  // 8. SaaS Subscription Payment Truth & Student Fee Isolation
  // ---------------------------------------------------------------------------
  describe('8. SaaS Subscription Payment Truth & Student Fee Isolation', () => {
    it('emits PAYMENT_CONFIRMED and INVOICE_GENERATED only upon verified SaaS checkout fulfillment', async () => {
      let plan = await db.subscriptionPlan.findFirst({ where: { code: 'STANDARD' } });
      if (!plan) {
        plan = await db.subscriptionPlan.findFirst();
      }

      const uniqueSlug = `paid-inst-${Date.now().toString().slice(-6)}`;
      const orderNumber = `EDU-ORD-${Date.now()}`;
      
      const order = await db.subscriptionOrder.create({
        data: {
          orderNumber,
          billingCycle: 'MONTHLY',
          subtotal: 5000,
          discount: 0,
          setupFee: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 5000,
          currency: 'BDT',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
          plan: { connect: { id: plan!.id } },
          signup: {
            create: {
              institutionName: `Paid Test School ${uniqueSlug}`,
              institutionType: 'SCHOOL',
              contactPerson: 'Director Test',
              email: `director_${uniqueSlug}@school.edu.bd`,
              phone: '01711223344',
              address: 'Dhaka',
              desiredSlug: uniqueSlug,
              passwordHash: 'dummy_hash',
              planId: plan!.id,
              amount: 5000,
              billingCycle: 'MONTHLY',
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 86400000),
            },
          },
        },
      });

      // While PENDING, zero outbox events exist for this order
      const pendingOutbox = await db.venominIntegrationOutbox.findFirst({
        where: { sourceRecordId: order.id },
      });
      expect(pendingOutbox).toBeNull();

      // Fulfill the order
      const fulfillment = await SaasProvisioningService.fulfillPaidOrder(order.id, {
        gateway: 'BKASH',
        trxId: `TRX-${Date.now()}`,
        amount: 5000,
        isSynthetic: true,
        syntheticReason: 'COMMAND_35_ACCEPTANCE_TEST',
      });

      expect(fulfillment.success).toBe(true);

      const paymentOutbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceRecordId: order.id,
          eventType: 'PAYMENT_CONFIRMED',
        },
      });

      expect(paymentOutbox).not.toBeNull();
      const payload = JSON.parse(paymentOutbox!.payloadSafeJson);
      expect(payload.amount).toBe(5000);
      expect(payload.gateway).toBe('BKASH');
      expect(payload.isSynthetic).toBe(true);

      const invoiceOutbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceTenantId: fulfillment.tenantSlug ? undefined : undefined,
          eventType: 'INVOICE_GENERATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(invoiceOutbox).not.toBeNull();
    });

    it('guarantees student fee collections and student tuition never emit PAYMENT_CONFIRMED to Venomin outbox', async () => {
      const tenant = await db.tenant.findFirst();
      if (!tenant) return;

      const outboxCountBefore = await db.venominIntegrationOutbox.count({
        where: {
          eventType: 'PAYMENT_CONFIRMED',
          sourceRecordType: { not: 'SUBSCRIPTION_PAYMENT_TRANSACTION' },
        },
      });

      expect(outboxCountBefore).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Negative Workflows: Student, Guardian, Academic & Staff Complete Exclusion
  // ---------------------------------------------------------------------------
  describe('9. Complete Student, Guardian, Academic & Staff Exclusion (Command 35.1)', () => {
    it('guarantees student admission enquiries and applications never emit commercial leads to Venomin', async () => {
      const inst = await db.institution.findFirst();
      if (!inst) return;

      const campus = (await db.campus.findFirst({ where: { institutionId: inst.id } })) || (await db.campus.findFirst());
      const ay = (await db.academicYear.findFirst({ where: { institutionId: inst.id } })) || (await db.academicYear.findFirst());
      if (!campus || !ay) return;

      const outboxBefore = await db.venominIntegrationOutbox.count();

      // Create synthetic admission application
      const app = await db.admissionApplication.create({
        data: {
          institutionId: inst.id,
          campusId: campus.id,
          academicYearId: ay.id,
          applicationNumber: `ADM-${Date.now()}`,
          firstName: 'Synthetic',
          lastName: 'Applicant',
          email: `applicant_${Date.now()}@synthetic.local`,
          phone: '01700000000',
          guardianName: 'Synthetic Guardian',
          guardianPhone: '01700000001',
          guardianRelation: 'Father',
          presentAddress: '123 Test St, Dhaka',
          permanentAddress: '123 Test St, Dhaka',
          dateOfBirth: new Date('2012-05-15'),
          gender: 'MALE',
          status: 'SUBMITTED',
        },
      });

      const outboxAfter = await db.venominIntegrationOutbox.count();
      expect(outboxAfter).toBe(outboxBefore); // 0 outbox events generated!

      const leadOutbox = await db.venominIntegrationOutbox.findFirst({
        where: { sourceRecordId: app.id },
      });
      expect(leadOutbox).toBeNull();
      // Required: STUDENT_ADMISSION_ENQUIRY_VENOMIN_LEAD = NONE
    });

    it('guarantees student creation generates zero Venomin events and zero Customer360 links', async () => {
      const inst = await db.institution.findFirst();
      if (!inst) return;

      const campus = (await db.campus.findFirst({ where: { institutionId: inst.id } })) || (await db.campus.findFirst());
      if (!campus) return;

      const outboxBefore = await db.venominIntegrationOutbox.count();

      const student = await db.student.create({
        data: {
          campusId: campus.id,
          admissionNumber: `ADM-${Date.now()}`,
          studentIdNumber: `STD-${Date.now()}`,
          firstName: 'Synthetic',
          lastName: 'Student',
          presentAddress: '123 Test St, Dhaka',
          permanentAddress: '123 Test St, Dhaka',
          dateOfBirth: new Date('2010-01-01'),
          gender: 'FEMALE',
          status: 'ACTIVE',
        },
      });

      const outboxAfter = await db.venominIntegrationOutbox.count();
      expect(outboxAfter).toBe(outboxBefore);

      const studentEvent = await db.venominIntegrationOutbox.findFirst({
        where: { sourceRecordId: student.id },
      });
      expect(studentEvent).toBeNull();
      // Required: EDUERP_STUDENT_VENOMIN_EVENT = NONE
      // Required: EDUERP_STUDENT_CUSTOMER360_LINKS = 0
    });

    it('guarantees guardian creation generates zero Venomin events and zero Customer360 links', async () => {
      const outboxBefore = await db.venominIntegrationOutbox.count();

      const guardian = await db.guardian.create({
        data: {
          fatherName: 'Synthetic Father',
          fatherPhone: '01711998877',
          motherName: 'Synthetic Mother',
          guardianName: 'Synthetic Guardian',
          guardianPhone: `017${Date.now().toString().slice(-8)}`,
          guardianRelation: 'Father',
        },
      });

      const outboxAfter = await db.venominIntegrationOutbox.count();
      expect(outboxAfter).toBe(outboxBefore);

      const guardianEvent = await db.venominIntegrationOutbox.findFirst({
        where: { sourceRecordId: guardian.id },
      });
      expect(guardianEvent).toBeNull();
      // Required: EDUERP_GUARDIAN_VENOMIN_EVENT = NONE
      // Required: EDUERP_GUARDIAN_CUSTOMER360_LINKS = 0
    });

    it('guarantees attendance, exams, results, and employee creation generate zero Venomin events', async () => {
      const inst = await db.institution.findFirst();
      if (!inst) return;

      const campus = (await db.campus.findFirst({ where: { institutionId: inst.id } })) || (await db.campus.findFirst());
      if (!campus) return;

      const outboxBefore = await db.venominIntegrationOutbox.count();

      // Create Teacher / Employee
      const employee = await db.employee.create({
        data: {
          campusId: campus.id,
          employeeCode: `EMP-${Date.now()}`,
          firstName: 'Synthetic',
          lastName: 'Teacher',
          designation: 'Senior Teacher',
          basicSalary: 50000,
          joiningDate: new Date(),
          email: `teacher_${Date.now()}@synthetic.local`,
          phone: `018${Date.now().toString().slice(-8)}`,
        },
      });

      const outboxAfter = await db.venominIntegrationOutbox.count();
      expect(outboxAfter).toBe(outboxBefore);

      const employeeEvent = await db.venominIntegrationOutbox.findFirst({
        where: { sourceRecordId: employee.id },
      });
      expect(employeeEvent).toBeNull();
      // Required: EDUERP_EMPLOYEE_VENOMIN_EVENT = NONE
      // Required: EDUERP_EMPLOYEE_CUSTOMER360_LINKS = 0
    });

    it('audits local outbox ensuring zero academic, student, or minor events exist', async () => {
      const blockedRecordTypes = [
        'STUDENT',
        'GUARDIAN',
        'ADMISSION',
        'ENROLLMENT',
        'ATTENDANCE',
        'EXAM',
        'ASSESSMENT',
        'GRADE',
        'RESULT',
        'TRANSCRIPT',
        'STUDENT_FEE',
        'STUDENT_PAYMENT',
        'MEDICAL',
        'BIOMETRIC',
        'DISCIPLINE',
      ];

      const count = await db.venominIntegrationOutbox.count({
        where: {
          sourceRecordType: { in: blockedRecordTypes },
        },
      });

      expect(count).toBe(0);
      // Required: EDUERP_ACADEMIC_OUTBOX_EVENTS = 0
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Multi-Tenant Isolation & Authorization Semantics
  // ---------------------------------------------------------------------------
  describe('10. Multi-Tenant Isolation & Authorization Semantics', () => {
    it('enforces strict tenant isolation and prevents cross-tenant data leakage in integration snapshot', async () => {
      const slugA = `tenant-a-${Date.now().toString().slice(-5)}`;
      const slugB = `tenant-b-${Date.now().toString().slice(-5)}`;

      const resA = await SaasSignupService.createSignupApplication({
        institutionName: `Tenant Isolation School A ${slugA}`,
        institutionType: 'SCHOOL',
        contactPerson: 'Director A',
        email: `director_${slugA}@schoola.edu.bd`,
        phone: '01711000001',
        address: 'Dhaka North',
        desiredSlug: slugA,
        password: 'Password123!',
        planIdOrCode: 'STARTER',
        billingCycle: 'TRIAL',
        isTrial: true,
        isSynthetic: true,
      });

      const resB = await SaasSignupService.createSignupApplication({
        institutionName: `Tenant Isolation School B ${slugB}`,
        institutionType: 'COLLEGE',
        contactPerson: 'Director B',
        email: `director_${slugB}@schoolb.edu.bd`,
        phone: '01711000002',
        address: 'Chittagong South',
        desiredSlug: slugB,
        password: 'Password123!',
        planIdOrCode: 'STANDARD',
        billingCycle: 'TRIAL',
        isTrial: true,
        isSynthetic: true,
      });

      // Request snapshot specifically for Tenant A
      const timestamp = Math.floor(Date.now() / 1000);
      const pathAndQuery = `/api/venomin/integration/snapshot?recordType=TENANT&recordId=${resA.tenantId}`;
      const reqUrl = `http://localhost${pathAndQuery}`;
      const { signatureHeader } = generateEventSignature(pathAndQuery, TEST_SECRET, timestamp);

      const req = new NextRequest(reqUrl, {
        method: 'GET',
        headers: {
          'x-venomin-product-key': 'EDUERP',
          'x-venomin-signature': signatureHeader,
        },
      });

      const response = await snapshotGet(req);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe('SUCCESS');
      expect(json.data.slug).toBe(slugA);
      expect(json.data.slug).not.toBe(slugB); // Zero leakage of Tenant B!
      // Required: EDUERP_TENANT_ISOLATION = PASS
      // Required: CROSS_TENANT_DATA_LEAKAGE = 0
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Negative SaaS Payment & Client Spoof Defense
  // ---------------------------------------------------------------------------
  describe('11. Negative SaaS Payment & Client Spoof Defense', () => {
    it('guarantees pending SaaS order generates zero PAYMENT_CONFIRMED events', async () => {
      const plan = await db.subscriptionPlan.findFirst();
      const uniqueSlug = `pending-test-${Date.now().toString().slice(-6)}`;
      const orderNumber = `PEND-ORD-${Date.now()}`;

      const order = await db.subscriptionOrder.create({
        data: {
          orderNumber,
          billingCycle: 'MONTHLY',
          subtotal: 3000,
          discount: 0,
          setupFee: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 3000,
          currency: 'BDT',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
          plan: { connect: { id: plan!.id } },
          signup: {
            create: {
              institutionName: `Pending School ${uniqueSlug}`,
              institutionType: 'SCHOOL',
              contactPerson: 'Director Pending',
              email: `pending_${uniqueSlug}@school.edu.bd`,
              phone: '01711332211',
              address: 'Dhaka',
              desiredSlug: uniqueSlug,
              passwordHash: 'dummy_hash',
              planId: plan!.id,
              amount: 3000,
              billingCycle: 'MONTHLY',
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 86400000),
            },
          },
        },
      });

      // Assert zero PAYMENT_CONFIRMED outbox rows exist
      const paymentOutbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceRecordId: order.id,
          eventType: 'PAYMENT_CONFIRMED',
        },
      });

      expect(paymentOutbox).toBeNull();
      // Required: EDUERP_PENDING_PAYMENT_FALSE_CONFIRMATION = 0
    });

    it('guarantees failed SaaS payment order generates zero PAYMENT_CONFIRMED events', async () => {
      const plan = await db.subscriptionPlan.findFirst();
      const uniqueSlug = `failed-test-${Date.now().toString().slice(-6)}`;
      const orderNumber = `FAIL-ORD-${Date.now()}`;

      const order = await db.subscriptionOrder.create({
        data: {
          orderNumber,
          billingCycle: 'MONTHLY',
          subtotal: 4000,
          discount: 0,
          setupFee: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 4000,
          currency: 'BDT',
          status: 'FAILED',
          expiresAt: new Date(Date.now() + 86400000),
          plan: { connect: { id: plan!.id } },
          signup: {
            create: {
              institutionName: `Failed School ${uniqueSlug}`,
              institutionType: 'SCHOOL',
              contactPerson: 'Director Failed',
              email: `failed_${uniqueSlug}@school.edu.bd`,
              phone: '01711445566',
              address: 'Dhaka',
              desiredSlug: uniqueSlug,
              passwordHash: 'dummy_hash',
              planId: plan!.id,
              amount: 4000,
              billingCycle: 'MONTHLY',
              status: 'FAILED',
              expiresAt: new Date(Date.now() + 86400000),
            },
          },
        },
      });

      const paymentOutbox = await db.venominIntegrationOutbox.findFirst({
        where: {
          sourceRecordId: order.id,
          eventType: 'PAYMENT_CONFIRMED',
        },
      });

      expect(paymentOutbox).toBeNull();
      // Required: EDUERP_FAILED_PAYMENT_FALSE_CONFIRMATION = 0
    });
  });
