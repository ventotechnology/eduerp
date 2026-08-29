import { db } from '@/lib/db';
import { ProvisionResponse } from './types';

/**
 * Checks if a provisioning request with this idempotency key was already completed
 */
export async function getExistingProvisioningResponse(
  idempotencyKey: string
): Promise<ProvisionResponse | null> {
  const record = await db.venominProvisioningRequest.findUnique({
    where: { idempotencyKey },
  });

  if (!record || !record.responsePayload) {
    return null;
  }

  try {
    return typeof record.responsePayload === 'string'
      ? JSON.parse(record.responsePayload)
      : (record.responsePayload as unknown as ProvisionResponse);
  } catch {
    return null;
  }
}

/**
 * Persists an idempotency response for safe replay
 */
export async function recordProvisioningResponse(
  requestId: string,
  idempotencyKey: string,
  venominCustomerId: string,
  tenantId: string | null,
  institutionId: string | null,
  userId: string | null,
  response: ProvisionResponse
): Promise<void> {
  await db.venominProvisioningRequest.upsert({
    where: { idempotencyKey },
    update: {
      status: response.status,
      tenantId,
      institutionId,
      userId,
      responsePayload: response as any,
      completedAt: new Date(),
    },
    create: {
      requestId,
      idempotencyKey,
      venominCustomerId,
      tenantId,
      institutionId,
      userId,
      status: response.status,
      responsePayload: response as any,
      completedAt: new Date(),
    },
  });
}
