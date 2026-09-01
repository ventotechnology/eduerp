import { sanitizeIntegrationPayload } from './sanitizer';
import crypto from 'crypto';

export interface EmitOutboxParams {
  eventType: string;
  category?: 'CUSTOMER' | 'SUBSCRIPTION' | 'BILLING' | 'SUPPORT' | 'OPERATIONS';
  sourceRecordType: string;
  sourceRecordId: string;
  sourceTenantId?: string | null;
  payload: Record<string, any>;
  isSynthetic?: boolean;
  syntheticReason?: string;
  occurredAt?: Date;
}

export function generateEduErpEventId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `eduerp_evt_${timestamp}_${random}`;
}

export class VenominOutboxService {
  /**
   * Atomically emits a sanitized integration event to the transactional outbox table
   */
  static async emitOutboxEvent(tx: any, params: EmitOutboxParams) {
    const eventId = generateEduErpEventId();
    let category = params.category;
    if (!category) {
      if (params.eventType.includes('SUPPORT') || params.eventType.includes('TICKET')) {
        category = 'SUPPORT';
      } else if (params.eventType.includes('PAYMENT') || params.eventType.includes('INVOICE') || params.eventType.includes('SUBSCRIPTION') || params.eventType.includes('ORDER')) {
        category = 'BILLING';
      } else {
        category = 'CUSTOMER';
      }
    }
    const occurredAt = params.occurredAt || new Date();

    const rawPayload: Record<string, any> = { ...params.payload };

    // Enforce source-native synthetic provenance
    if (params.isSynthetic === true) {
      rawPayload.isSynthetic = true;
      rawPayload.syntheticReason = params.syntheticReason || 'COMMAND_35_ACCEPTANCE_TEST';
    }

    // Sanitize payload strictly against student/minor PII, academic records, and secrets
    const sanitizedPayload = sanitizeIntegrationPayload(rawPayload);

    const outboxRecord = await tx.venominIntegrationOutbox.create({
      data: {
        eventId,
        eventType: params.eventType,
        category,
        sourceRecordType: params.sourceRecordType,
        sourceRecordId: params.sourceRecordId,
        sourceTenantId: params.sourceTenantId || null,
        payloadSafeJson: JSON.stringify(sanitizedPayload),
        occurredAt,
        status: 'PENDING',
        attemptCount: 0,
        nextAttemptAt: occurredAt,
      },
    });

    return outboxRecord;
  }
}
