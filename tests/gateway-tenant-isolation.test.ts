import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentGatewayService } from '../lib/services/payment-gateway.service';
import { db } from '../lib/db';

describe('Command 12A.5D — Payment Gateway Tenant Isolation & Policy Enforcement', () => {
  let sitaTenant: any;
  let otherTenant: any;

  beforeEach(async () => {
    await PaymentGatewayService.ensureDefaultGateways();

    // Ensure test tenant exists
    sitaTenant = await db.tenant.upsert({
      where: { slug: 'test-gateway-isolation-sita' },
      update: {},
      create: {
        slug: 'test-gateway-isolation-sita',
        institutionType: 'MADRASHA',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
        institution: {
          create: {
            name: 'Test Gateway Isolation Madrasah',
            shortName: 'TGM',
            address: 'House 12, Road 4, Dhanmondi',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: '01700000001',
            email: 'admin@tgm.edu.bd'
          }
        }
      }
    });

    otherTenant = await db.tenant.upsert({
      where: { slug: 'test-isolation-school' },
      update: {},
      create: {
        slug: 'test-isolation-school',
        institutionType: 'SCHOOL',
        subscriptionTier: 'STARTER',
        isActive: true,
        institution: {
          create: {
            name: 'Test Isolation School',
            shortName: 'TIS',
            address: 'Chittagong GEC',
            district: 'Chittagong',
            division: 'Chittagong',
            upazilaThana: 'Panchlaish',
            phone: '01700000002',
            email: 'admin@tis.edu.bd'
          }
        }
      }
    });
  });

  it('should allow tenant to configure their own custom merchant credentials without leaking to other tenants', async () => {
    // Save custom Nagad merchant credentials
    await PaymentGatewayService.saveGatewayConfig({
      gateway: 'NAGAD',
      scope: 'TENANT',
      tenantId: sitaTenant.id,
      data: {
        displayName: 'TGM Official Nagad',
        isEnabled: true,
        instructions: 'Pay directly to TGM Nagad Account',
        credentials: {
          merchantId: 'NAGAD_TGM_1001',
          privateKey: 'tgm_private_secret_key_888'
        }
      },
      actor: {
        userId: 'tgm-principal',
        role: 'PRINCIPAL',
        email: 'principal@tgm.edu.bd'
      }
    });

    // 1. Fetch TGM gateways: should see their own custom merchant
    const sitaGateways = await PaymentGatewayService.getTenantGateways(sitaTenant.id);
    const sitaNagad = sitaGateways.find(g => g.gateway === 'NAGAD');
    expect(sitaNagad).toBeDefined();
    expect(sitaNagad?.displayName).toBe('TGM Official Nagad');
    expect(sitaNagad?.scope).toBe('TENANT');
    expect(sitaNagad?.hasOwnCredentials).toBe(true);

    // 2. Fetch Other Tenant gateways: should NOT see TGM's credentials
    const otherGateways = await PaymentGatewayService.getTenantGateways(otherTenant.id);
    const otherNagad = otherGateways.find(g => g.gateway === 'NAGAD');
    expect(otherNagad?.hasOwnCredentials).toBe(false);
    expect(otherNagad?.displayName).not.toBe('TGM Official Nagad');
  });

  it('should NEVER leak platform merchant secrets to tenant in getTenantGateways()', async () => {
    // Save Platform bKash credentials
    await PaymentGatewayService.saveGatewayConfig({
      gateway: 'BKASH',
      scope: 'PLATFORM',
      tenantId: null,
      data: {
        sharedGatewayAvailable: true,
        credentials: {
          appKey: 'platform_master_key_999',
          appSecret: 'platform_master_secret_888',
          username: 'platform_mfs_root',
          password: 'PlatformMasterPassword123'
        }
      },
      actor: {
        userId: 'admin-1',
        role: 'PLATFORM_SUPER_ADMIN'
      }
    });

    const tenantGateways = await PaymentGatewayService.getTenantGateways(sitaTenant.id);
    const bkashShared = tenantGateways.find(g => g.gateway === 'BKASH');

    expect(bkashShared).toBeDefined();
    expect(bkashShared?.isShared).toBe(true);
    // Platform secrets dictionary must be empty for tenant
    expect(Object.keys(bkashShared?.maskedCredentials || {}).length).toBe(0);
  });
});
