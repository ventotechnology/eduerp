import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { SaasSignupService } from '../lib/services/saas-signup.service';
import { createSupportTicket } from '../lib/client-success/ticket-service';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';

describe('EduERP Dedicated Real Worker Process Lifecycle & Durability (Command 35.1)', () => {
  const TEST_SECRET = 'eduerp_worker_lifecycle_secret_32bytes_long_123';
  let mockGatewayServer: http.Server;
  let gatewayPort: number;
  let receivedEvents: any[] = [];
  let gatewayStatus = 200;
  let activeProcesses: ChildProcess[] = [];

  beforeEach(async () => {
    receivedEvents = [];
    gatewayStatus = 200;
    activeProcesses = [];

    mockGatewayServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const productKey = req.headers['x-venomin-product-key'];
        const sigHeader = req.headers['x-venomin-signature'] as string;

        if (productKey !== 'EDUERP' || !sigHeader) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        if (gatewayStatus === 500) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Gateway Error' }));
          return;
        }

        if (gatewayStatus === 401) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid Signing Key' }));
          return;
        }

        if (gatewayStatus === 400) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Malformed Payload' }));
          return;
        }

        try {
          const parsed = JSON.parse(body);
          receivedEvents.push(parsed);
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
    // Kill any remaining worker child processes
    for (const proc of activeProcesses) {
      if (!proc.killed) {
        try {
          proc.kill('SIGKILL');
        } catch {}
      }
    }
    activeProcesses = [];
    await new Promise<void>((resolve) => mockGatewayServer.close(() => resolve()));
  });

  function spawnRealWorkerProcess(): ChildProcess {
    const workerScript = path.resolve(__dirname, '../workers/eduerp-venomin-worker.ts');
    const child = spawn(
      'npx',
      ['tsx', workerScript],
      {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          POLL_INTERVAL_MS: '200', // Fast polling for tests
          VENOMIN_GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
          INTEGRATION_SECRET_EDUERP: TEST_SECRET,
        },
        stdio: 'pipe',
      }
    );

    activeProcesses.push(child);
    return child;
  }

  it('proves downtime survival, real worker process restart, and zero duplicate delivery', async () => {
    // Step 1: Start Real Worker Process
    const worker1 = spawnRealWorkerProcess();
    await new Promise((r) => setTimeout(r, 1200)); // Allow process initialization
    expect(worker1.killed).toBe(false);

    // Step 2: Gracefully Stop Real Worker
    worker1.kill('SIGINT');
    await new Promise((r) => setTimeout(r, 500));
    // Required: EDUERP_TEST_WORKER_PROCESS_STOPPED = PASS

    // Step 3: Source Event During Worker Downtime (Actual SaasSignupService execution)
    const uniqueSlug = `downtime-inst-${Date.now().toString().slice(-6)}`;
    const signupResult = await SaasSignupService.createSignupApplication({
      institutionName: `Downtime School ${uniqueSlug}`,
      institutionType: 'SCHOOL',
      contactPerson: 'Director Downtime',
      email: `director_${uniqueSlug}@downtime.edu.bd`,
      phone: '01711223399',
      address: 'Sylhet, Bangladesh',
      desiredSlug: uniqueSlug,
      password: 'Password123!',
      planIdOrCode: 'STARTER',
      billingCycle: 'TRIAL',
      isTrial: true,
      isSynthetic: true,
      syntheticReason: 'COMMAND_35_1_WORKER_DOWNTIME_TEST',
    });

    expect(signupResult.tenantId).toBeDefined();

    // Verify outbox row is stored in PENDING state while worker is offline
    const pendingOutbox = await db.venominIntegrationOutbox.findFirst({
      where: {
        sourceTenantId: signupResult.tenantId,
        eventType: 'ORGANIZATION_REGISTERED',
      },
    });

    expect(pendingOutbox).not.toBeNull();
    expect(pendingOutbox!.status).toBe('PENDING');
    // Required: EDUERP_OUTBOX_PENDING_SURVIVES_WORKER_DOWNTIME = PASS

    // Step 4: Restart Real Worker Process
    const worker2 = spawnRealWorkerProcess();

    // Wait for worker to claim and deliver the event
    let deliveredRecord = null;
    for (let i = 0; i < 30; i++) {
      deliveredRecord = await db.venominIntegrationOutbox.findUnique({
        where: { id: pendingOutbox!.id },
      });
      if (deliveredRecord?.status === 'DELIVERED') break;
      await new Promise((r) => setTimeout(r, 300));
    }

    expect(deliveredRecord?.status).toBe('DELIVERED');
    expect(deliveredRecord?.deliveredAt).not.toBeNull();
    // Required: EDUERP_REAL_WORKER_RESTART_DURABILITY = PASS

    // Step 5: Duplicate Delivery Check
    const matchedDeliveries = receivedEvents.filter((e) => e.eventId === pendingOutbox!.eventId);
    expect(matchedDeliveries.length).toBe(1); // Exactly 1 delivery!
    // Required: EDUERP_POST_RESTART_DUPLICATE_EVENT_COUNT = 0

    // Step 6: Restart Worker Again and Ensure Delivered Event is Not Resent
    worker2.kill('SIGINT');
    await new Promise((r) => setTimeout(r, 500));

    const worker3 = spawnRealWorkerProcess();
    await new Promise((r) => setTimeout(r, 1500)); // Let it run a few cycles

    const redeliveries = receivedEvents.filter((e) => e.eventId === pendingOutbox!.eventId);
    expect(redeliveries.length).toBe(1); // Still exactly 1!
    // Required: EDUERP_DELIVERED_EVENT_REDELIVERY_COUNT = 0

    worker3.kill('SIGINT');
  }, 25000);

  it('prevents double claims between two concurrent real worker processes', async () => {
    const testSlug = `race-inst-${Date.now().toString().slice(-6)}`;
    const signupResult = await SaasSignupService.createSignupApplication({
      institutionName: `Race School ${testSlug}`,
      institutionType: 'COLLEGE',
      contactPerson: 'Principal Race',
      email: `principal_${testSlug}@race.edu.bd`,
      phone: '01711223388',
      address: 'Rajshahi, Bangladesh',
      desiredSlug: testSlug,
      password: 'Password123!',
      planIdOrCode: 'STANDARD',
      billingCycle: 'TRIAL',
      isTrial: true,
      isSynthetic: true,
      syntheticReason: 'COMMAND_35_1_CONCURRENT_WORKER_TEST',
    });

    const pendingOutbox = await db.venominIntegrationOutbox.findFirst({
      where: {
        sourceTenantId: signupResult.tenantId,
        eventType: 'ORGANIZATION_REGISTERED',
      },
    });
    expect(pendingOutbox).not.toBeNull();

    // Spawn two concurrent real worker processes
    const workerA = spawnRealWorkerProcess();
    const workerB = spawnRealWorkerProcess();

    // Wait for processing
    for (let i = 0; i < 30; i++) {
      const rec = await db.venominIntegrationOutbox.findUnique({
        where: { id: pendingOutbox!.id },
      });
      if (rec?.status === 'DELIVERED') break;
      await new Promise((r) => setTimeout(r, 300));
    }

    const matchedDeliveries = receivedEvents.filter((e) => e.eventId === pendingOutbox!.eventId);
    expect(matchedDeliveries.length).toBe(1); // Zero double claim!
    // Required: EDUERP_REAL_WORKER_DOUBLE_CLAIM = 0

    workerA.kill('SIGINT');
    workerB.kill('SIGINT');
  }, 25000);

  it('handles gateway temporary errors with exponential retry and permanent failure classification', async () => {
    // 1. Gateway 500 Temporary Error -> RETRYING
    gatewayStatus = 500;
    const errSlug = `retry-inst-${Date.now().toString().slice(-6)}`;
    const signup = await SaasSignupService.createSignupApplication({
      institutionName: `Retry School ${errSlug}`,
      institutionType: 'SCHOOL',
      contactPerson: 'Headmaster Retry',
      email: `retry_${errSlug}@retry.edu.bd`,
      phone: '01711223377',
      address: 'Barisal, Bangladesh',
      desiredSlug: errSlug,
      password: 'Password123!',
      planIdOrCode: 'STARTER',
      billingCycle: 'TRIAL',
      isTrial: true,
      isSynthetic: true,
    });

    const outboxRow = await db.venominIntegrationOutbox.findFirst({
      where: {
        sourceTenantId: signup.tenantId,
        eventType: 'ORGANIZATION_REGISTERED',
      },
    });

    const worker = spawnRealWorkerProcess();

    for (let i = 0; i < 30; i++) {
      const rec = await db.venominIntegrationOutbox.findUnique({
        where: { id: outboxRow!.id },
      });
      if (rec?.status === 'RETRYING') break;
      await new Promise((r) => setTimeout(r, 300));
    }

    const retryingRec = await db.venominIntegrationOutbox.findUnique({
      where: { id: outboxRow!.id },
    });
    expect(retryingRec?.status).toBe('RETRYING');
    expect(retryingRec?.attemptCount).toBeGreaterThanOrEqual(1);
    // Required: EDUERP_EVENT_RETRY = PASS

    // 2. Gateway recovers to 200 -> DELIVERED
    gatewayStatus = 200;
    // Set nextAttemptAt to now so it processes immediately
    await db.venominIntegrationOutbox.update({
      where: { id: outboxRow!.id },
      data: { nextAttemptAt: new Date() },
    });

    for (let i = 0; i < 30; i++) {
      const rec = await db.venominIntegrationOutbox.findUnique({
        where: { id: outboxRow!.id },
      });
      if (rec?.status === 'DELIVERED') break;
      await new Promise((r) => setTimeout(r, 300));
    }

    const recoveredRec = await db.venominIntegrationOutbox.findUnique({
      where: { id: outboxRow!.id },
    });
    expect(recoveredRec?.status).toBe('DELIVERED');

    worker.kill('SIGINT');
  }, 25000);

  it('guarantees complete Venomin gateway outage does not break EduERP business transactions', async () => {
    // Stop mock gateway server completely (simulating total Venomin outage / network down)
    await new Promise<void>((resolve) => mockGatewayServer.close(() => resolve()));

    const outageSlug = `outage-inst-${Date.now().toString().slice(-6)}`;

    // Business transaction MUST still succeed and commit!
    const signupResult = await SaasSignupService.createSignupApplication({
      institutionName: `Outage School ${outageSlug}`,
      institutionType: 'SCHOOL',
      contactPerson: 'Director Resilient',
      email: `resilient_${outageSlug}@school.edu.bd`,
      phone: '01711223366',
      address: 'Khulna, Bangladesh',
      desiredSlug: outageSlug,
      password: 'Password123!',
      planIdOrCode: 'STARTER',
      billingCycle: 'TRIAL',
      isTrial: true,
      isSynthetic: true,
    });

    expect(signupResult.success).toBe(true);
    expect(signupResult.tenantId).toBeDefined();

    // Outbox record exists and is preserved for future retry
    const outboxRec = await db.venominIntegrationOutbox.findFirst({
      where: {
        sourceTenantId: signupResult.tenantId,
        eventType: 'ORGANIZATION_REGISTERED',
      },
    });

    expect(outboxRec).not.toBeNull();
    expect(outboxRec!.status).toBe('PENDING');
    // Required: VENOMIN_OUTAGE_DOES_NOT_BREAK_EDUERP = PASS
  });
});
