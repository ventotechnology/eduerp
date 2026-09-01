import { NextRequest } from 'next/server';
import { verifyEventSignature } from './signature';

export function getEduErpIntegrationSecret(): string {
  return (
    process.env.INTEGRATION_SECRET_EDUERP ||
    process.env.VENOMIN_INTEGRATION_SECRET ||
    'dev_eduerp_integration_secret_32b_min'
  );
}

export async function validateVenominIntegrationAuth(req: NextRequest, rawBodyOverride?: string) {
  const secret = getEduErpIntegrationSecret();
  const productKey = req.headers.get('x-venomin-product-key');
  const signatureHeader = req.headers.get('x-venomin-signature');

  if (!productKey || productKey !== 'EDUERP') {
    return {
      authenticated: false,
      status: 401,
      error: 'INVALID_PRODUCT_KEY',
      message: 'Missing or invalid X-Venomin-Product-Key header. Must be EDUERP.',
    };
  }

  // Determine payload for signature
  let payloadToVerify: string;
  if (req.method === 'GET') {
    const url = new URL(req.url);
    payloadToVerify = `${url.pathname}${url.search}`;
  } else {
    payloadToVerify = rawBodyOverride !== undefined ? rawBodyOverride : await req.text();
  }

  const verifyResult = verifyEventSignature(payloadToVerify, signatureHeader, secret);
  if (!verifyResult.valid) {
    return {
      authenticated: false,
      status: 401,
      error: verifyResult.error || 'INVALID_SIGNATURE',
      message: `HMAC Signature verification failed: ${verifyResult.error}`,
    };
  }

  return {
    authenticated: true,
    rawBody: payloadToVerify,
  };
}
