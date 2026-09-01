import crypto from 'crypto';

export interface SignatureResult {
  signatureHeader: string;
  timestamp: number;
  signature: string;
}

export function generateEventSignature(
  payload: string | object,
  secret: string,
  explicitTs?: number
): SignatureResult {
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

export function verifyEventSignature(
  rawPayload: string | object,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds: number = 300
): { valid: boolean; error?: string } {
  if (!signatureHeader) {
    return { valid: false, error: 'MISSING_SIGNATURE_HEADER' };
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestampStr = parts['t'];
  const providedSig = parts['v1'];

  if (!timestampStr || !providedSig) {
    return { valid: false, error: 'MALFORMED_SIGNATURE_HEADER' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: 'INVALID_TIMESTAMP' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'SIGNATURE_TIMESTAMP_EXPIRED' };
  }

  const rawBody = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
  const signaturePayload = `${timestamp}.${rawBody}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(signaturePayload, 'utf8').digest('hex');

  const expectedBuf = Buffer.from(expectedSig, 'hex');
  const providedBuf = Buffer.from(providedSig, 'hex');

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return { valid: false, error: 'SIGNATURE_MISMATCH' };
  }

  return { valid: true };
}
