import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BkashPaymentProvider, BkashCredentials } from '@/lib/payments/providers/bkash-provider';

describe('COMMAND 11 — bKash Payment Provider Contract & Security', () => {
  const mockCreds: BkashCredentials = {
    appKey: 'mock_app_key_12345',
    appSecret: 'mock_app_secret_67890',
    username: 'mock_bkash_user',
    password: 'mock_bkash_password',
    baseUrl: 'https://checkout.sandbox.bka.sh/v1.2.0-beta',
    isSandbox: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully obtain and cache grant token', async () => {
    const fakeTokenResponse = {
      statusCode: '0000',
      statusMessage: 'Successful',
      id_token: 'fake_jwt_token_bkash_2026',
      token_type: 'Bearer',
      expires_in: '3600'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeTokenResponse
    } as any);

    const token = await BkashPaymentProvider.getGrantToken(mockCreds);
    expect(token.idToken).toBe('fake_jwt_token_bkash_2026');
    expect(token.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should handle grant token failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ statusCode: '2001', statusMessage: 'Invalid App Key' })
    } as any);

    await expect(BkashPaymentProvider.getGrantToken({
      ...mockCreds,
      appKey: 'invalid_key'
    })).rejects.toThrow('bKash Token Grant Error');
  });

  it('should execute payment successfully with valid transaction status', async () => {
    // 1. Mock grant token
    const fakeTokenResponse = {
      statusCode: '0000',
      id_token: 'fake_jwt_token_bkash_2026',
      expires_in: '3600'
    };

    // 2. Mock execute payment response
    const fakeExecuteResponse = {
      statusCode: '0000',
      statusMessage: 'Successful',
      paymentID: 'PAY-BKASH-9481920',
      trxID: 'TRX-948192049182',
      transactionStatus: 'Completed',
      amount: '15000.00',
      currency: 'BDT',
      merchantInvoiceNumber: 'EDU-ORD-2026-TEST'
    };

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, status: 200, json: async () => fakeTokenResponse };
      }
      return { ok: true, status: 200, json: async () => fakeExecuteResponse };
    });

    // Provide env vars for this test
    process.env.BKASH_APP_KEY = mockCreds.appKey;
    process.env.BKASH_APP_SECRET = mockCreds.appSecret;
    process.env.BKASH_USERNAME = mockCreds.username;
    process.env.BKASH_PASSWORD = mockCreds.password;

    const result = await BkashPaymentProvider.executePayment('PAY-BKASH-9481920');
    expect(result.success).toBe(true);
    expect(result.trxId).toBe('TRX-948192049182');
    expect(result.amount).toBe(15000);
    expect(result.transactionStatus).toBe('Completed');
  });
});
