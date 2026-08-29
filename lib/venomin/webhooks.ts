import crypto from 'crypto';
import { db } from '@/lib/db';
import { ProductWebhookEvent } from './types';
import { logVenominIntegrationEvent } from './logger';

const WEBHOOK_SECRET =
  process.env.VENOMIN_WEBHOOK_SECRET ||
  process.env.WALLETMIX_WEBHOOK_SECRET ||
  'whsec_staging_test_secret_9812401824';

const VENOMIN_WEBHOOK_URL =
  process.env.VENOMIN_CALLBACK_URL ||
  process.env.WALLETMIX_CALLBACK_URL ||
  process.env.VENOMIN_WEBHOOK_URL ||
  'http://localhost:3000/api/webhooks/products/eduerp';

/**
 * Signs a webhook payload using HMAC-SHA256
 */
export function signWebhookPayload(payload: string, secret: string = WEBHOOK_SECRET) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedString = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret).update(signedString).digest('hex');

  return {
    signature: `t=${timestamp},v1=${hmac}`,
    timestamp,
  };
}

/**
 * Dispatches an authenticated webhook event to Venomin with delivery audit and retry
 */
export async function dispatchVenominWebhook(
  event: ProductWebhookEvent,
  maxAttempts: number = 3
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const rawPayload = JSON.stringify(event);
  const { signature, timestamp } = signWebhookPayload(rawPayload);

  let attempt = 1;
  let lastError: string | undefined;
  let responseCode: number | undefined;

  let deliveryRecordId: string | undefined;
  try {
    const delivery = await db.venominWebhookDelivery.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        destinationUrl: VENOMIN_WEBHOOK_URL,
        attempt: 1,
        status: 'PENDING',
      },
    });
    deliveryRecordId = delivery?.id;
  } catch {
    // Non-blocking if table is dynamic
  }

  while (attempt <= maxAttempts) {
    try {
      const res = await fetch(VENOMIN_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Venomin-Signature': signature,
          'X-Venomin-Timestamp': timestamp.toString(),
          'X-Venomin-Event-Id': event.eventId,
          'X-Venomin-Integration-Version': 'v1',
          'X-Walletmix-Signature': signature,
          'X-Walletmix-Timestamp': timestamp.toString(),
          'X-Walletmix-Event-Id': event.eventId,
          'X-Walletmix-Integration-Version': 'v1',
        },
        body: rawPayload,
      });

      responseCode = res.status;

      if (res.ok) {
        if (deliveryRecordId) {
          await db.venominWebhookDelivery.update({
            where: { id: deliveryRecordId },
            data: {
              status: 'DELIVERED',
              responseCode: res.status,
              deliveredAt: new Date(),
              safeMessage: 'Webhook successfully delivered to Venomin receiver',
            },
          }).catch(() => {});
        }

        await logVenominIntegrationEvent({
          operation: 'WEBHOOK_DISPATCH',
          status: 'SUCCESS',
          safeMessage: `Dispatched ${event.eventType} event ${event.eventId} to Venomin`,
        });

        return { success: true, statusCode: res.status };
      } else {
        lastError = `Venomin returned HTTP ${res.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network failure contacting Venomin webhook URL';
    }

    attempt++;
    if (attempt <= maxAttempts) {
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
    }
  }

  if (deliveryRecordId) {
    await db.venominWebhookDelivery.update({
      where: { id: deliveryRecordId },
      data: {
        status: 'FAILED',
        responseCode,
        errorMessage: lastError,
        safeMessage: 'Webhook delivery failed after retry attempts',
      },
    }).catch(() => {});
  }

  await logVenominIntegrationEvent({
    operation: 'WEBHOOK_DISPATCH',
    status: 'FAILURE',
    safeMessage: `Webhook delivery failed for event ${event.eventId}: ${lastError}`,
    errorCode: 'WEBHOOK_DELIVERY_FAILED',
  });

  return { success: false, statusCode: responseCode, error: lastError };
}
