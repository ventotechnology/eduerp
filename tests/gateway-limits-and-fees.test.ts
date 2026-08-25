import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentGatewayService } from '../lib/services/payment-gateway.service';

describe('Command 12A.5D — Payment Gateway Limits & Fee Calculations', () => {
  beforeEach(async () => {
    await PaymentGatewayService.ensureDefaultGateways();
  });

  it('should filter out gateways if requested checkout amount is below minimum or above maximum', async () => {
    // Configure bKash: min 100, max 5000
    await PaymentGatewayService.saveGatewayConfig({
      gateway: 'BKASH',
      scope: 'PLATFORM',
      tenantId: null,
      data: {
        isEnabled: true,
        checkoutEnabled: true,
        minAmount: 100,
        maxAmount: 5000
      },
      actor: {
        userId: 'admin-1',
        role: 'PLATFORM_SUPER_ADMIN'
      }
    });

    // 1. Amount 50 (below min 100): bKash should not be in checkout
    const belowMinGateways = await PaymentGatewayService.getCheckoutGateways({
      scope: 'PLATFORM',
      amount: 50
    });
    expect(belowMinGateways.find(g => g.gateway === 'BKASH')).toBeUndefined();

    // 2. Amount 2500 (within range 100-5000): bKash should be included
    const validGateways = await PaymentGatewayService.getCheckoutGateways({
      scope: 'PLATFORM',
      amount: 2500
    });
    expect(validGateways.find(g => g.gateway === 'BKASH')).toBeDefined();

    // 3. Amount 10000 (above max 5000): bKash should not be in checkout
    const aboveMaxGateways = await PaymentGatewayService.getCheckoutGateways({
      scope: 'PLATFORM',
      amount: 10000
    });
    expect(aboveMaxGateways.find(g => g.gateway === 'BKASH')).toBeUndefined();
  });

  it('should accurately calculate percentage and fixed fees on dynamic checkout', async () => {
    await PaymentGatewayService.saveGatewayConfig({
      gateway: 'SSLCOMMERZ',
      scope: 'PLATFORM',
      tenantId: null,
      data: {
        isEnabled: true,
        checkoutEnabled: true,
        minAmount: 50,
        maxAmount: 100000,
        percentageFee: 2.5,
        fixedFee: 10,
        feeTreatment: 'CUSTOMER_PAYS'
      },
      actor: {
        userId: 'admin-1',
        role: 'PLATFORM_SUPER_ADMIN'
      }
    });

    const checkout = await PaymentGatewayService.getCheckoutGateways({
      scope: 'PLATFORM',
      amount: 2000
    });

    const ssl = checkout.find(g => g.gateway === 'SSLCOMMERZ');
    expect(ssl).toBeDefined();
    // 2000 * 2.5% = 50 + 10 fixed = 60
    expect(ssl?.calculatedFee).toBe(60);
    expect(ssl?.feeTreatment).toBe('CUSTOMER_PAYS');
  });
});
