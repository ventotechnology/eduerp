import { describe, it, expect } from 'vitest';
import {
  encryptPaymentValue,
  decryptPaymentValue,
  encryptPaymentCredentials,
  decryptPaymentCredentials,
  maskPaymentCredentials
} from '../lib/services/payment-crypto';
import { PaymentGatewayService } from '../lib/services/payment-gateway.service';

describe('Command 12A.5D — Payment Gateway Secret Security & Encryption', () => {
  it('should encrypt and decrypt sensitive strings using authenticated AES-256-GCM', () => {
    const rawSecret = 'bkash_super_secret_live_key_2026_x99';
    const encrypted = encryptPaymentValue(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted).toMatch(/^v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    const decrypted = decryptPaymentValue(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should encrypt credential objects into ciphertext and decrypt cleanly', () => {
    const creds = {
      appKey: '4f0194819200000000000000',
      appSecret: 'test_app_secret_123456789',
      username: '01700000000',
      password: 'LivePassword!2026'
    };

    const encrypted = encryptPaymentCredentials(creds);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toContain('LivePassword!2026');
    expect(encrypted).not.toContain('test_app_secret');

    const decrypted = decryptPaymentCredentials(encrypted);
    expect(decrypted.appKey).toBe(creds.appKey);
    expect(decrypted.appSecret).toBe(creds.appSecret);
    expect(decrypted.username).toBe(creds.username);
    expect(decrypted.password).toBe(creds.password);
  });

  it('should securely mask credentials for API and UI rendering', () => {
    const creds = {
      appKey: '4f019481920000001234',
      appSecret: 'secret_key_abcdef9876',
      username: '01711223344',
      password: 'VerySecretPassword99'
    };

    const masked = maskPaymentCredentials(creds);
    expect(masked.appKey).toBe('••••••••1234');
    expect(masked.appSecret).toBe('••••••••9876');
    expect(masked.password).toBe('••••••••rd99');
    expect(masked.username).toBe('01711223344'); // Non-secret identifiers kept for display
  });

  it('should never expose raw plaintext credentials in getPlatformGateways() output', async () => {
    // Save gateway with credentials
    await PaymentGatewayService.saveGatewayConfig({
      gateway: 'SSLCOMMERZ',
      scope: 'PLATFORM',
      tenantId: null,
      data: {
        credentials: {
          storeId: 'eduerp_live_store',
          storePassword: 'ultra_secure_store_password_55'
        }
      },
      actor: {
        userId: 'admin-1',
        role: 'PLATFORM_SUPER_ADMIN'
      }
    });

    const gateways = await PaymentGatewayService.getPlatformGateways();
    const ssl = gateways.find(g => g.gateway === 'SSLCOMMERZ');

    expect(ssl).toBeDefined();
    // Raw credentials must NOT exist
    expect((ssl as any).encryptedCredentials).toBeUndefined();
    expect((ssl as any).storePassword).toBeUndefined();
    expect(ssl?.maskedCredentials.storePassword).toBe('••••••••d_55');
  });
});
