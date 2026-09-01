import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import crypto from 'crypto';

export function getWorkerPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://humayun@localhost:5432/eduerp_dev';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error'],
  });
}

const prisma = getWorkerPrismaClient();

export function generateEventSignature(
  payload: string | object,
  secret: string,
  explicitTs?: number
): { signatureHeader: string; timestamp: number; signature: string } {
  const timestamp = explicitTs ?? Math.floor(Date.now() / 1000);
  const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signaturePayload = `${timestamp}.${rawBody}`;
  const sig = crypto.createHmac('sha256', secret).update(signaturePayload, 'utf8').digest('hex');

  return {
    signatureHeader: `t=${timestamp},v1=${sig}`,
    timestamp,
    signature: sig,
  };
}

export interface WorkerBatchResult {
  claimed: number;
  delivered: number;
  retried: number;
  failedAuth: number;
  failedPermanent: number;
}

export async function recoverStaleLocks(
  client: PrismaClient = prisma,
  lockTimeoutSeconds: number = 300
): Promise<number> {
  const staleThreshold = new Date(Date.now() - lockTimeoutSeconds * 1000);

  const result = await client.venominIntegrationOutbox.updateMany({
    where: {
      status: 'DELIVERING',
      lastAttemptAt: { lt: staleThreshold },
    },
    data: {
      status: 'PENDING',
      nextAttemptAt: new Date(),
      lastErrorSafe: 'Recovered from stale DELIVERING lock timeout',
    },
  });

  return result.count;
}

export async function processPendingOutboxBatch(
  client: PrismaClient = prisma,
  gatewayUrlOverride?: string,
  secretOverride?: string,
  batchSize: number = 20
): Promise<WorkerBatchResult> {
  const now = new Date();
  const gatewayUrl =
    gatewayUrlOverride ||
    process.env.VENOMIN_GATEWAY_URL ||
    'https://venomin.com/api/integrations/events';
  const secret =
    secretOverride ||
    process.env.INTEGRATION_SECRET_EDUERP ||
    process.env.VENOMIN_INTEGRATION_SECRET ||
    'dev_eduerp_integration_secret_32b_min';

  // 1. Recover any stale DELIVERING locks
  await recoverStaleLocks(client);

  // 2. Select eligible pending records
  const eligibleRecords = await client.venominIntegrationOutbox.findMany({
    where: {
      status: { in: ['PENDING', 'RETRYING'] },
      nextAttemptAt: { lte: now },
    },
    orderBy: { occurredAt: 'asc' },
    take: batchSize,
  });

  const result: WorkerBatchResult = {
    claimed: 0,
    delivered: 0,
    retried: 0,
    failedAuth: 0,
    failedPermanent: 0,
  };

  if (eligibleRecords.length === 0) {
    return result;
  }

  // 3. Process each record atomically
  for (const record of eligibleRecords) {
    // Atomic Claim: Update status to DELIVERING only if still in PENDING/RETRYING
    const claimUpdate = await client.venominIntegrationOutbox.updateMany({
      where: {
        id: record.id,
        status: { in: ['PENDING', 'RETRYING'] },
      },
      data: {
        status: 'DELIVERING',
        lastAttemptAt: now,
        attemptCount: { increment: 1 },
      },
    });

    if (claimUpdate.count === 0) {
      // Race condition: claimed by another worker instance
      continue;
    }

    result.claimed++;

    let payloadObj: any = {};
    try {
      payloadObj = JSON.parse(record.payloadSafeJson || '{}');
    } catch {
      payloadObj = {};
    }

    function normalizeCategory(cat: string, evt: string): string {
      const c = (cat || '').toUpperCase();
      const valid = ['SALES', 'SUPPORT', 'CUSTOMER', 'BILLING', 'REQUEST', 'PROJECT', 'OPERATIONS', 'SECURITY', 'SYSTEM', 'APPROVAL', 'PRODUCT_ACTIVITY'];
      if (valid.includes(c)) return c;
      if (evt.includes('SUPPORT') || evt.includes('TICKET')) return 'SUPPORT';
      if (evt.includes('PAYMENT') || evt.includes('INVOICE') || evt.includes('SUBSCRIPTION') || evt.includes('ORDER')) return 'BILLING';
      return 'CUSTOMER';
    }

    const normalizedCat = normalizeCategory(record.category, record.eventType);
    const eventTitle = payloadObj.title || `[EduERP] ${record.eventType}: ${record.sourceRecordId}`;

    const gatewayBody = {
      eventId: record.eventId,
      eventType: record.eventType,
      category: normalizedCat,
      title: eventTitle,
      sourceProductKey: 'EDUERP',
      sourceRecordType: record.sourceRecordType,
      sourceRecordId: record.sourceRecordId,
      sourceTenantId: record.sourceTenantId || undefined,
      occurredAt: record.occurredAt.toISOString(),
      schemaVersion: 'v1',
      isSynthetic: payloadObj.isSynthetic === true,
      payload: payloadObj,
    };

    const serializedBody = JSON.stringify(gatewayBody);
    const { signatureHeader } = generateEventSignature(serializedBody, secret);

    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Venomin-Product-Key': 'EDUERP',
          'X-Venomin-Signature': signatureHeader,
        },
        body: serializedBody,
      });

      if (response.ok) {
        await client.venominIntegrationOutbox.update({
          where: { id: record.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            lastErrorCode: null,
            lastErrorSafe: null,
          },
        });
        result.delivered++;
      } else if (response.status === 401 || response.status === 403) {
        const errorText = await response.text().catch(() => '');
        await client.venominIntegrationOutbox.update({
          where: { id: record.id },
          data: {
            status: 'FAILED_AUTH',
            lastErrorCode: `HTTP_${response.status}`,
            lastErrorSafe: `Authentication failed at Venomin gateway (${response.status}): ${errorText.slice(0, 200)}`,
          },
        });
        result.failedAuth++;
      } else if (response.status === 400) {
        const errorText = await response.text().catch(() => '');
        await client.venominIntegrationOutbox.update({
          where: { id: record.id },
          data: {
            status: 'FAILED_PERMANENT',
            lastErrorCode: 'HTTP_400',
            lastErrorSafe: `Bad request payload rejected permanently (${response.status}): ${errorText.slice(0, 200)}`,
          },
        });
        result.failedPermanent++;
      } else {
        // 429 or 5xx server error: Schedule retry with bounded exponential backoff
        const nextAttemptCount = record.attemptCount + 1;
        const delaySeconds = Math.min(300, Math.pow(2, nextAttemptCount));
        const nextAttempt = new Date(Date.now() + delaySeconds * 1000);

        await client.venominIntegrationOutbox.update({
          where: { id: record.id },
          data: {
            status: 'RETRYING',
            nextAttemptAt: nextAttempt,
            lastErrorCode: `HTTP_${response.status}`,
            lastErrorSafe: `Temporary gateway error (${response.status}). Retrying in ${delaySeconds}s.`,
          },
        });
        result.retried++;
      }
    } catch (networkErr: any) {
      const nextAttemptCount = record.attemptCount + 1;
      const delaySeconds = Math.min(300, Math.pow(2, nextAttemptCount));
      const nextAttempt = new Date(Date.now() + delaySeconds * 1000);

      await client.venominIntegrationOutbox.update({
        where: { id: record.id },
        data: {
          status: 'RETRYING',
          nextAttemptAt: nextAttempt,
          lastErrorCode: 'NETWORK_ERROR',
          lastErrorSafe: `Network delivery failure: ${networkErr?.message || networkErr}`,
        },
      });
      result.retried++;
    }
  }

  return result;
}

let isRunning = true;

export async function startWorkerDaemon() {
  console.log('[eduerp-venomin-worker] Starting Venomin outbox dispatch worker...');
  const pollInterval = parseInt(process.env.POLL_INTERVAL_MS || '1000', 10);

  const shutdown = async (signal: string) => {
    console.log(`[eduerp-venomin-worker] Received ${signal}. Gracefully stopping...`);
    isRunning = false;
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  while (isRunning) {
    try {
      const batchResult = await processPendingOutboxBatch(prisma);
      if (batchResult.claimed > 0) {
        console.log(`[eduerp-venomin-worker] Processed batch:`, JSON.stringify(batchResult));
      }
    } catch (err) {
      console.error('[eduerp-venomin-worker] Uncaught cycle error:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

if (require.main === module) {
  startWorkerDaemon().catch((err) => {
    console.error('[eduerp-venomin-worker] Fatal daemon error:', err);
    process.exit(1);
  });
}
