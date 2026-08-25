import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentGatewayService } from '../lib/services/payment-gateway.service';
import { db } from '../lib/db';

describe('Command 12A.5D — Payment Gateway Configuration & Multi-Scope Engine', () => {
  beforeEach(async () => {
    // Ensure baseline defaults exist
    await PaymentGatewayService.ensureDefaultGateways();
  });

  it('should seed default platform payment gateways with correct default attributes', async () => {
    const platformGateways = await PaymentGatewayService.getPlatformGateways();
    expect(platformGateways.length).toBeGreaterThanOrEqual(5);

    const bkash = platformGateways.find(g => g.gateway === 'BKASH');
    expect(bkash).toBeDefined();
    expect(bkash?.displayName).toContain('bKash');
    expect(bkash?.currency).toBe('BDT');
    expect(bkash?.isEnabled).toBe(true);

    const bankTransfer = platformGateways.find(g => g.gateway === 'BANK_TRANSFER');
    expect(bankTransfer).toBeDefined();
    expect(bankTransfer?.isEnabled).toBe(true);
  });

  it('should allow Super Admin to update platform gateway metadata, limits, and fees', async () => {
    const bkash = await db.paymentGatewayConfig.findFirst({
      where: { scope: 'PLATFORM', gateway: 'BKASH', tenantId: null }
    });
    expect(bkash).toBeDefined();

    const updated = await PaymentGatewayService.saveGatewayConfig({
      id: bkash!.id,
      gateway: 'BKASH',
      scope: 'PLATFORM',
      tenantId: null,
      data: {
        displayName: 'bKash Merchant Direct',
        minAmount: 20,
        maxAmount: 300000,
        percentageFee: 1.75,
        feeTreatment: 'CUSTOMER_PAYS',
        instructions: 'Test instructions'
      },
      actor: {
        userId: 'admin-1',
        role: 'PLATFORM_SUPER_ADMIN',
        email: 'admin@eduerp.us'
      }
    });

    expect(updated.displayName).toBe('bKash Merchant Direct');
    expect(updated.minAmount).toBe(20);
    expect(updated.maxAmount).toBe(300000);
    expect(updated.percentageFee).toBe(1.75);
    expect(updated.feeTreatment).toBe('CUSTOMER_PAYS');
    expect(updated.instructions).toBe('Test instructions');
  });

  it('should reject invalid transaction limits where minAmount > maxAmount', async () => {
    await expect(
      PaymentGatewayService.saveGatewayConfig({
        gateway: 'BKASH',
        scope: 'PLATFORM',
        tenantId: null,
        data: {
          minAmount: 50000,
          maxAmount: 1000 // invalid
        },
        actor: {
          userId: 'admin-1',
          role: 'PLATFORM_SUPER_ADMIN'
        }
      })
    ).rejects.toThrow(/Invalid amount limits/);
  });
});
