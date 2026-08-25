import { db } from '@/lib/db';
import {
  encryptPaymentCredentials,
  decryptPaymentCredentials,
  maskPaymentCredentials
} from './payment-crypto';
import { BkashPaymentProvider, BkashCredentials } from '../payments/providers/bkash-provider';

export interface GatewayUpdatePayload {
  name?: string;
  displayName?: string;
  merchantName?: string;
  provider?: string;
  isEnabled?: boolean;
  isSandbox?: boolean;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  fixedFee?: number;
  percentageFee?: number;
  feeTreatment?: 'MERCHANT_ABSORBS' | 'CUSTOMER_PAYS' | 'SPLIT';
  displayOrder?: number;
  checkoutEnabled?: boolean;
  refundEnabled?: boolean;
  partialRefundEnabled?: boolean;
  recurringEnabled?: boolean;
  webhookEnabled?: boolean;
  callbackUrl?: string;
  webhookUrl?: string;
  allowTenantOverride?: boolean;
  sharedGatewayAvailable?: boolean;
  requiredPlanTier?: string | null;
  instructions?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankRouting?: string;
  bankSwift?: string;
  credentials?: Record<string, any>;
  configMetadata?: Record<string, any>;
}

export class PaymentGatewayService {
  /**
   * Seed default platform gateway configurations if not present
   */
  public static async ensureDefaultGateways() {
    const defaults = [
      {
        gateway: 'BKASH',
        name: 'bKash Tokenized Checkout',
        displayName: 'bKash',
        merchantName: 'EduERP SaaS Platform',
        provider: 'bKash Bangladesh',
        isEnabled: true,
        isSandbox: process.env.BKASH_IS_SANDBOX === 'true' || process.env.BKASH_MODE === 'sandbox' ? true : false,
        currency: 'BDT',
        minAmount: 10,
        maxAmount: 250000,
        fixedFee: 0,
        percentageFee: 1.5,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 1,
        checkoutEnabled: true,
        refundEnabled: true,
        partialRefundEnabled: false,
        webhookEnabled: true,
        sharedGatewayAvailable: true,
        allowTenantOverride: true,
        instructions: 'Pay securely using your personal bKash wallet account.'
      },
      {
        gateway: 'NAGAD',
        name: 'Nagad Direct Payment',
        displayName: 'Nagad',
        merchantName: 'EduERP Merchant',
        provider: 'Nagad Bangladesh',
        isEnabled: false,
        isSandbox: true,
        currency: 'BDT',
        minAmount: 10,
        maxAmount: 250000,
        fixedFee: 0,
        percentageFee: 1.45,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 2,
        checkoutEnabled: true,
        refundEnabled: false,
        webhookEnabled: false,
        sharedGatewayAvailable: false,
        allowTenantOverride: true,
        instructions: 'Pay using Nagad Digital Wallet PIN & OTP.'
      },
      {
        gateway: 'ROCKET',
        name: 'DBBL Rocket MFS',
        displayName: 'Rocket',
        merchantName: 'EduERP Merchant',
        provider: 'Dutch-Bangla Bank',
        isEnabled: false,
        isSandbox: true,
        currency: 'BDT',
        minAmount: 10,
        maxAmount: 200000,
        fixedFee: 0,
        percentageFee: 1.5,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 3,
        checkoutEnabled: true,
        refundEnabled: false,
        webhookEnabled: false,
        sharedGatewayAvailable: false,
        allowTenantOverride: true,
        instructions: 'Pay via DBBL Rocket mobile banking.'
      },
      {
        gateway: 'SSLCOMMERZ',
        name: 'SSLCommerz Payment Gateway',
        displayName: 'SSLCommerz',
        merchantName: 'EduERP Merchant',
        provider: 'SSL Wireless',
        isEnabled: false,
        isSandbox: true,
        currency: 'BDT',
        minAmount: 50,
        maxAmount: 500000,
        fixedFee: 0,
        percentageFee: 2.5,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 4,
        checkoutEnabled: true,
        refundEnabled: true,
        webhookEnabled: true,
        sharedGatewayAvailable: false,
        allowTenantOverride: true,
        instructions: 'Pay via Visa, Mastercard, AMEX, Internet Banking, and all MFS.'
      },
      {
        gateway: 'SHURJOPAY',
        name: 'ShurjoPay Payment Gateway',
        displayName: 'ShurjoPay',
        merchantName: 'EduERP Merchant',
        provider: 'ShurjoMukhi',
        isEnabled: false,
        isSandbox: true,
        currency: 'BDT',
        minAmount: 50,
        maxAmount: 500000,
        fixedFee: 0,
        percentageFee: 2.0,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 5,
        checkoutEnabled: true,
        refundEnabled: false,
        webhookEnabled: false,
        sharedGatewayAvailable: false,
        allowTenantOverride: true,
        instructions: 'Pay using local debit/credit cards and digital wallets.'
      },
      {
        gateway: 'CARD',
        name: 'Debit / Credit Card Processor',
        displayName: 'Card / Online Aggregator',
        merchantName: 'EduERP Card Gateway',
        provider: 'Card Processor',
        isEnabled: false,
        isSandbox: true,
        currency: 'BDT',
        minAmount: 100,
        maxAmount: 500000,
        fixedFee: 0,
        percentageFee: 2.5,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 6,
        checkoutEnabled: false,
        refundEnabled: true,
        webhookEnabled: false,
        sharedGatewayAvailable: false,
        allowTenantOverride: false,
        instructions: 'Card payments processed via verified banking gateway.'
      },
      {
        gateway: 'BANK_TRANSFER',
        name: 'Direct Bank Wire / EFT Transfer',
        displayName: 'Bank Transfer',
        merchantName: 'Vento Technology Banking',
        provider: 'Corporate Banking',
        isEnabled: true,
        isSandbox: false,
        currency: 'BDT',
        minAmount: 500,
        maxAmount: 1000000,
        fixedFee: 0,
        percentageFee: 0,
        feeTreatment: 'MERCHANT_ABSORBS',
        displayOrder: 7,
        checkoutEnabled: true,
        refundEnabled: false,
        webhookEnabled: false,
        sharedGatewayAvailable: true,
        allowTenantOverride: true,
        bankName: 'City Bank PLC',
        bankAccountName: 'Vento Technology',
        bankAccountNumber: '1102948192001',
        bankBranch: 'Principal Branch, Dhaka',
        bankRouting: '225275357',
        instructions: 'Deposit subscription wire to City Bank A/C: 1102948192001. Upload deposit slip or transaction reference after transfer.'
      }
    ];

    for (const gw of defaults) {
      const existing = await db.paymentGatewayConfig.findFirst({
        where: { scope: 'PLATFORM', gateway: gw.gateway, tenantId: null }
      });

      if (!existing) {
        // If bKash has env credentials, compute initial health
        let initialHealth = 'NOT_CONFIGURED';
        if (gw.gateway === 'BKASH') {
          const envCreds = BkashPaymentProvider.getCredentials();
          if (envCreds) {
            initialHealth = envCreds.isSandbox ? 'HEALTHY' : 'HEALTHY';
          }
        } else if (gw.gateway === 'BANK_TRANSFER') {
          initialHealth = 'HEALTHY';
        }

        await db.paymentGatewayConfig.create({
          data: {
            ...gw,
            scope: 'PLATFORM',
            healthStatus: initialHealth
          }
        });
      }
    }
  }

  /**
   * Retrieves all Platform payment gateways with masked credentials and real health
   */
  public static async getPlatformGateways() {
    await this.ensureDefaultGateways();

    const gateways = await db.paymentGatewayConfig.findMany({
      where: { scope: 'PLATFORM', tenantId: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        healthLogs: {
          take: 5,
          orderBy: { checkedAt: 'desc' }
        }
      }
    });

    // Check environment bKash fallback
    const envBkash = BkashPaymentProvider.getCredentials();

    return gateways.map((gw) => {
      const decrypted = decryptPaymentCredentials(gw.encryptedCredentials);
      const masked = maskPaymentCredentials(decrypted);

      // If bKash has env credentials and no db credentials, indicate configured
      let effectiveHealth = gw.healthStatus;
      let hasCredentials = Object.keys(decrypted).length > 0;

      if (gw.gateway === 'BKASH') {
        if (!hasCredentials && envBkash) {
          hasCredentials = true;
          masked['appKey'] = envBkash.appKey ? `••••••••${envBkash.appKey.slice(-4)}` : 'Configured';
          masked['username'] = envBkash.username ? `••••••••${envBkash.username.slice(-4)}` : 'Configured';
          masked['hasEnvCredentials'] = true;
          if (effectiveHealth === 'NOT_CONFIGURED') {
            effectiveHealth = 'HEALTHY';
          }
        }
      } else if (gw.gateway === 'BANK_TRANSFER') {
        hasCredentials = Boolean(gw.bankAccountNumber);
        if (hasCredentials && effectiveHealth === 'NOT_CONFIGURED') {
          effectiveHealth = 'HEALTHY';
        }
      }

      return {
        id: gw.id,
        scope: gw.scope,
        gateway: gw.gateway,
        name: gw.name,
        displayName: gw.displayName,
        merchantName: gw.merchantName,
        provider: gw.provider,
        isEnabled: gw.isEnabled,
        isSandbox: gw.isSandbox,
        currency: gw.currency,
        minAmount: gw.minAmount,
        maxAmount: gw.maxAmount,
        fixedFee: gw.fixedFee,
        percentageFee: gw.percentageFee,
        feeTreatment: gw.feeTreatment,
        displayOrder: gw.displayOrder,
        checkoutEnabled: gw.checkoutEnabled,
        refundEnabled: gw.refundEnabled,
        partialRefundEnabled: gw.partialRefundEnabled,
        recurringEnabled: gw.recurringEnabled,
        webhookEnabled: gw.webhookEnabled,
        callbackUrl: gw.callbackUrl,
        webhookUrl: gw.webhookUrl,
        healthStatus: effectiveHealth,
        lastHealthCheckAt: gw.lastHealthCheckAt,
        lastHealthCheckLatency: gw.lastHealthCheckLatency,
        lastHealthCheckError: gw.lastHealthCheckError,
        lastSuccessfulTransactionAt: gw.lastSuccessfulTransactionAt,
        allowTenantOverride: gw.allowTenantOverride,
        sharedGatewayAvailable: gw.sharedGatewayAvailable,
        requiredPlanTier: gw.requiredPlanTier,
        instructions: gw.instructions,
        bankName: gw.bankName,
        bankAccountName: gw.bankAccountName,
        bankAccountNumber: gw.bankAccountNumber,
        bankBranch: gw.bankBranch,
        bankRouting: gw.bankRouting,
        bankSwift: gw.bankSwift,
        hasCredentials,
        maskedCredentials: masked,
        configMetadata: gw.configMetadata,
        recentLogs: gw.healthLogs,
        createdAt: gw.createdAt,
        updatedAt: gw.updatedAt
      };
    });
  }

  /**
   * Retrieves tenant-visible gateways:
   * 1. Platform shared gateways (no platform secrets leaked)
   * 2. Tenant custom configured gateways
   */
  public static async getTenantGateways(tenantId: string) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true }
        }
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found.');
    }

    const tenantTier = tenant.subscriptions?.[0]?.plan?.tier || tenant.subscriptionTier || 'STARTER';

    // 1. Fetch Platform Gateways (both shared and override-eligible)
    const platformGateways = await db.paymentGatewayConfig.findMany({
      where: {
        scope: 'PLATFORM',
        tenantId: null
      },
      orderBy: { displayOrder: 'asc' }
    });

    // 2. Fetch Tenant's own gateway configurations
    const tenantConfigs = await db.paymentGatewayConfig.findMany({
      where: {
        scope: 'TENANT',
        tenantId: tenant.id
      },
      orderBy: { displayOrder: 'asc' }
    });

    const tenantConfigMap = new Map(tenantConfigs.map(tc => [tc.gateway, tc]));

    return platformGateways.map(pg => {
      const tc = tenantConfigMap.get(pg.gateway);
      const isOverridden = Boolean(tc && tc.isEnabled);

      const activeConfig = isOverridden ? tc! : pg;
      const decrypted = tc ? decryptPaymentCredentials(tc.encryptedCredentials) : {};
      const masked = maskPaymentCredentials(decrypted);

      return {
        id: tc?.id || pg.id,
        gateway: pg.gateway,
        name: isOverridden ? (tc?.name || pg.name) : pg.name,
        displayName: isOverridden ? (tc?.displayName || pg.displayName) : pg.displayName,
        provider: pg.provider,
        scope: isOverridden ? 'TENANT' : 'PLATFORM_SHARED',
        isShared: !isOverridden,
        sharedAvailable: pg.sharedGatewayAvailable,
        allowOverride: pg.allowTenantOverride,
        isEnabled: isOverridden ? tc!.isEnabled : pg.isEnabled,
        isSandbox: isOverridden ? tc!.isSandbox : pg.isSandbox,
        currency: activeConfig.currency,
        minAmount: activeConfig.minAmount,
        maxAmount: activeConfig.maxAmount,
        fixedFee: activeConfig.fixedFee,
        percentageFee: activeConfig.percentageFee,
        feeTreatment: activeConfig.feeTreatment,
        instructions: activeConfig.instructions,
        bankName: activeConfig.bankName,
        bankAccountName: activeConfig.bankAccountName,
        bankAccountNumber: isOverridden ? activeConfig.bankAccountNumber : (activeConfig.bankAccountNumber ? `••••••••${activeConfig.bankAccountNumber.slice(-4)}` : null),
        bankBranch: activeConfig.bankBranch,
        bankRouting: activeConfig.bankRouting,
        hasOwnCredentials: Boolean(tc && Object.keys(decrypted).length > 0),
        maskedCredentials: isOverridden ? masked : {}, // Never leak platform secrets
        healthStatus: isOverridden ? tc!.healthStatus : pg.healthStatus,
        requiredPlanTier: pg.requiredPlanTier,
        tenantTier
      };
    });
  }

  /**
   * Resolves available gateways for Checkout dynamically
   */
  public static async getCheckoutGateways(params: {
    scope: 'PLATFORM' | 'TENANT';
    tenantId?: string;
    amount?: number;
  }) {
    const { scope, tenantId, amount } = params;

    if (scope === 'PLATFORM') {
      const gateways = await db.paymentGatewayConfig.findMany({
        where: {
          scope: 'PLATFORM',
          tenantId: null,
          isEnabled: true,
          checkoutEnabled: true
        },
        orderBy: { displayOrder: 'asc' }
      });

      return gateways
        .filter(gw => {
          if (amount !== undefined) {
            if (amount < gw.minAmount || amount > gw.maxAmount) return false;
          }
          return true;
        })
        .map(gw => {
          let calculatedFee = 0;
          if (amount !== undefined) {
            calculatedFee = gw.fixedFee + (amount * (gw.percentageFee / 100));
          }

          return {
            id: gw.id,
            gateway: gw.gateway,
            displayName: gw.displayName,
            instructions: gw.instructions,
            isSandbox: gw.isSandbox,
            currency: gw.currency,
            minAmount: gw.minAmount,
            maxAmount: gw.maxAmount,
            fixedFee: gw.fixedFee,
            percentageFee: gw.percentageFee,
            feeTreatment: gw.feeTreatment,
            calculatedFee: Math.round(calculatedFee * 100) / 100,
            displayOrder: gw.displayOrder,
            bankDetails: gw.gateway === 'BANK_TRANSFER' ? {
              bankName: gw.bankName,
              accountName: gw.bankAccountName,
              accountNumber: gw.bankAccountNumber,
              branch: gw.bankBranch,
              routing: gw.bankRouting,
              swift: gw.bankSwift
            } : null
          };
        });
    }

    // Tenant Scope Checkout
    if (!tenantId) {
      throw new Error('Tenant ID is required for tenant checkout gateways.');
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant not found.');
    }

    // Fetch tenant's own active gateways
    const tenantGateways = await db.paymentGatewayConfig.findMany({
      where: {
        scope: 'TENANT',
        tenantId,
        isEnabled: true,
        checkoutEnabled: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    const tenantGatewayMap = new Map(tenantGateways.map(g => [g.gateway, g]));

    // Fetch platform shared gateways
    const platformShared = await db.paymentGatewayConfig.findMany({
      where: {
        scope: 'PLATFORM',
        tenantId: null,
        sharedGatewayAvailable: true,
        isEnabled: true,
        checkoutEnabled: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    const activeList = [];
    for (const pg of platformShared) {
      const tc = tenantGatewayMap.get(pg.gateway);
      const chosen = tc || pg;

      if (amount !== undefined) {
        if (amount < chosen.minAmount || amount > chosen.maxAmount) continue;
      }

      let calculatedFee = 0;
      if (amount !== undefined) {
        calculatedFee = chosen.fixedFee + (amount * (chosen.percentageFee / 100));
      }

      activeList.push({
        id: chosen.id,
        gateway: chosen.gateway,
        displayName: chosen.displayName,
        instructions: chosen.instructions,
        isSandbox: chosen.isSandbox,
        currency: chosen.currency,
        minAmount: chosen.minAmount,
        maxAmount: chosen.maxAmount,
        fixedFee: chosen.fixedFee,
        percentageFee: chosen.percentageFee,
        feeTreatment: chosen.feeTreatment,
        calculatedFee: Math.round(calculatedFee * 100) / 100,
        displayOrder: chosen.displayOrder,
        isShared: chosen.id === pg.id,
        bankDetails: chosen.gateway === 'BANK_TRANSFER' ? {
          bankName: chosen.bankName,
          accountName: chosen.bankAccountName,
          accountNumber: chosen.bankAccountNumber,
          branch: chosen.bankBranch,
          routing: chosen.bankRouting,
          swift: chosen.bankSwift
        } : null
      });
    }

    return activeList.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Updates or creates a gateway configuration securely
   */
  public static async saveGatewayConfig(params: {
    id?: string;
    gateway: string;
    scope?: 'PLATFORM' | 'TENANT';
    tenantId?: string | null;
    data: GatewayUpdatePayload;
    actor: { userId: string; role: string; email?: string };
  }) {
    const { id, gateway, scope = 'PLATFORM', tenantId = null, data, actor } = params;

    // Validate min/max amounts
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      if (data.minAmount < 0 || data.maxAmount < data.minAmount) {
        throw new Error('Invalid amount limits: Minimum must be >= 0 and Maximum must be >= Minimum.');
      }
    }

    // Encrypt credentials if provided
    let encryptedCreds: string | undefined = undefined;
    if (data.credentials && Object.keys(data.credentials).length > 0) {
      encryptedCreds = encryptPaymentCredentials(data.credentials);
    }

    let existing = null;
    if (id) {
      existing = await db.paymentGatewayConfig.findUnique({ where: { id } });
    } else {
      existing = await db.paymentGatewayConfig.findFirst({
        where: { scope, gateway, tenantId }
      });
    }

    const payload: any = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.displayName ? { displayName: data.displayName } : {}),
      ...(data.merchantName !== undefined ? { merchantName: data.merchantName } : {}),
      ...(data.provider ? { provider: data.provider } : {}),
      ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
      ...(data.isSandbox !== undefined ? { isSandbox: data.isSandbox } : {}),
      ...(data.currency ? { currency: data.currency } : {}),
      ...(data.minAmount !== undefined ? { minAmount: Number(data.minAmount) } : {}),
      ...(data.maxAmount !== undefined ? { maxAmount: Number(data.maxAmount) } : {}),
      ...(data.fixedFee !== undefined ? { fixedFee: Number(data.fixedFee) } : {}),
      ...(data.percentageFee !== undefined ? { percentageFee: Number(data.percentageFee) } : {}),
      ...(data.feeTreatment ? { feeTreatment: data.feeTreatment } : {}),
      ...(data.displayOrder !== undefined ? { displayOrder: Number(data.displayOrder) } : {}),
      ...(data.checkoutEnabled !== undefined ? { checkoutEnabled: data.checkoutEnabled } : {}),
      ...(data.refundEnabled !== undefined ? { refundEnabled: data.refundEnabled } : {}),
      ...(data.partialRefundEnabled !== undefined ? { partialRefundEnabled: data.partialRefundEnabled } : {}),
      ...(data.recurringEnabled !== undefined ? { recurringEnabled: data.recurringEnabled } : {}),
      ...(data.webhookEnabled !== undefined ? { webhookEnabled: data.webhookEnabled } : {}),
      ...(data.callbackUrl !== undefined ? { callbackUrl: data.callbackUrl } : {}),
      ...(data.webhookUrl !== undefined ? { webhookUrl: data.webhookUrl } : {}),
      ...(data.allowTenantOverride !== undefined ? { allowTenantOverride: data.allowTenantOverride } : {}),
      ...(data.sharedGatewayAvailable !== undefined ? { sharedGatewayAvailable: data.sharedGatewayAvailable } : {}),
      ...(data.requiredPlanTier !== undefined ? { requiredPlanTier: data.requiredPlanTier } : {}),
      ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
      ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
      ...(data.bankAccountName !== undefined ? { bankAccountName: data.bankAccountName } : {}),
      ...(data.bankAccountNumber !== undefined ? { bankAccountNumber: data.bankAccountNumber } : {}),
      ...(data.bankBranch !== undefined ? { bankBranch: data.bankBranch } : {}),
      ...(data.bankRouting !== undefined ? { bankRouting: data.bankRouting } : {}),
      ...(data.bankSwift !== undefined ? { bankSwift: data.bankSwift } : {}),
      ...(data.configMetadata !== undefined ? { configMetadata: data.configMetadata } : {}),
      ...(encryptedCreds ? { encryptedCredentials: encryptedCreds } : {}),
      updatedBy: actor.email || actor.userId
    };

    let result;
    if (existing) {
      result = await db.paymentGatewayConfig.update({
        where: { id: existing.id },
        data: payload
      });
    } else {
      result = await db.paymentGatewayConfig.create({
        data: {
          gateway,
          scope,
          tenantId,
          name: data.name || `${gateway} Gateway`,
          displayName: data.displayName || gateway,
          ...payload
        }
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: tenantId || undefined,
        action: 'PAYMENT_GATEWAY_CONFIG_UPDATED',
        resourceType: 'PAYMENT_GATEWAY',
        resourceId: result.id,
        userId: actor.userId,
        userName: actor.email || actor.userId,
        userRole: actor.role,
        newState: JSON.stringify({
          gateway,
          scope,
          isEnabled: result.isEnabled,
          isSandbox: result.isSandbox,
          credentialsReplaced: Boolean(encryptedCreds)
        })
      }
    });

    return result;
  }

  /**
   * Executes a live non-financial connection test for a payment gateway
   */
  public static async testGatewayConnection(params: {
    gatewayId?: string;
    gateway: string;
    scope?: 'PLATFORM' | 'TENANT';
    tenantId?: string | null;
    actor: { userId: string; email?: string };
  }) {
    const { gatewayId, gateway, scope = 'PLATFORM', tenantId = null, actor } = params;

    let config = null;
    if (gatewayId) {
      config = await db.paymentGatewayConfig.findUnique({ where: { id: gatewayId } });
    } else {
      config = await db.paymentGatewayConfig.findFirst({ where: { scope, gateway, tenantId } });
    }

    const startTime = Date.now();
    let status = 'HEALTHY';
    let latencyMs = 0;
    let errorCode: string | undefined = undefined;
    let errorMessage: string | undefined = undefined;

    try {
      if (gateway === 'BKASH') {
        let creds: BkashCredentials | null = null;

        if (config?.encryptedCredentials) {
          const decrypted = decryptPaymentCredentials(config.encryptedCredentials);
          if (decrypted.appKey && decrypted.appSecret && decrypted.username && decrypted.password) {
            creds = {
              appKey: decrypted.appKey,
              appSecret: decrypted.appSecret,
              username: decrypted.username,
              password: decrypted.password,
              baseUrl: decrypted.baseUrl || (config.isSandbox ? 'https://checkout.sandbox.bka.sh/v1.2.0-beta' : 'https://checkout.pay.bka.sh/v1.2.0-beta'),
              isSandbox: config.isSandbox
            };
          }
        }

        // Fallback to environment credentials if DB empty
        if (!creds) {
          creds = BkashPaymentProvider.getCredentials();
        }

        if (!creds) {
          status = 'NOT_CONFIGURED';
          errorCode = 'CREDENTIALS_MISSING';
          errorMessage = 'No bKash merchant API credentials configured in database or environment.';
        } else {
          // Perform live grant token authentication ping
          const tokenRes = await BkashPaymentProvider.getGrantToken(creds);
          latencyMs = Date.now() - startTime;

          if (!tokenRes || !tokenRes.idToken) {
            status = 'AUTH_FAILED';
            errorCode = 'GRANT_TOKEN_FAILED';
            errorMessage = 'bKash server rejected credentials or authentication failed.';
          } else {
            status = 'HEALTHY';
          }
        }
      } else if (gateway === 'BANK_TRANSFER') {
        latencyMs = Date.now() - startTime;
        if (!config?.bankAccountNumber) {
          status = 'NOT_CONFIGURED';
          errorMessage = 'Bank account number not configured.';
        } else {
          status = 'HEALTHY';
        }
      } else {
        // Other gateways (Nagad, Rocket, SSLCommerz, ShurjoPay)
        const decrypted = config?.encryptedCredentials ? decryptPaymentCredentials(config.encryptedCredentials) : {};
        latencyMs = Date.now() - startTime;

        if (!decrypted || Object.keys(decrypted).length === 0) {
          status = 'NOT_CONFIGURED';
          errorCode = 'KEYS_MISSING';
          errorMessage = `${gateway} merchant credentials have not been configured yet.`;
        } else {
          status = 'HEALTHY';
        }
      }
    } catch (err: any) {
      latencyMs = Date.now() - startTime;
      status = 'UNREACHABLE';
      errorCode = 'CONNECTION_EXCEPTION';
      errorMessage = err.message || 'Error communicating with provider API.';
    }

    // Save Health Check Log
    const log = await db.paymentHealthCheckLog.create({
      data: {
        gatewayId: config?.id,
        gateway,
        scope,
        tenantId,
        environment: config?.isSandbox ? 'SANDBOX' : 'PRODUCTION',
        status,
        latencyMs,
        errorCode,
        errorMessage,
        checkedBy: actor.email || actor.userId
      }
    });

    // Update config health status
    if (config) {
      await db.paymentGatewayConfig.update({
        where: { id: config.id },
        data: {
          healthStatus: status,
          lastHealthCheckAt: new Date(),
          lastHealthCheckLatency: latencyMs,
          lastHealthCheckError: errorMessage || null
        }
      });
    }

    return {
      success: status === 'HEALTHY',
      gateway,
      scope,
      environment: config?.isSandbox ? 'SANDBOX' : 'PRODUCTION',
      status,
      latencyMs,
      errorCode,
      errorMessage,
      checkedAt: log.checkedAt
    };
  }

  /**
   * Submits an offline payment (Bank Wire / Cheque / Cash / Manual MFS)
   */
  public static async submitOfflinePayment(params: {
    tenantId: string;
    invoiceId?: string;
    orderId?: string;
    paymentMethod: string;
    amount: number;
    currency?: string;
    referenceNumber: string;
    proofDocumentUrl?: string;
    notes?: string;
    submittedBy: string;
  }) {
    const {
      tenantId,
      invoiceId,
      orderId,
      paymentMethod,
      amount,
      currency = 'BDT',
      referenceNumber,
      proofDocumentUrl,
      notes,
      submittedBy
    } = params;

    if (!referenceNumber || referenceNumber.trim() === '') {
      throw new Error('Transaction reference number is required.');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0.');
    }

    const record = await db.offlinePaymentRecord.create({
      data: {
        tenantId,
        invoiceId,
        orderId,
        paymentMethod,
        amount,
        currency,
        referenceNumber: referenceNumber.trim(),
        proofDocumentUrl,
        notes,
        status: 'UNDER_REVIEW',
        submittedBy,
        approvedBy: 'PENDING_REVIEW'
      }
    });

    return record;
  }

  /**
   * Verifies or Rejects an offline payment submission
   */
  public static async verifyOfflinePayment(params: {
    recordId: string;
    action: 'VERIFY' | 'REJECT';
    rejectionReason?: string;
    actor: { userId: string; email?: string; role: string };
  }) {
    const { recordId, action, rejectionReason, actor } = params;

    const record = await db.offlinePaymentRecord.findUnique({
      where: { id: recordId },
      include: { tenant: true }
    });

    if (!record) {
      throw new Error('Offline payment record not found.');
    }

    if (record.status === 'VERIFIED' || record.status === 'PAID') {
      throw new Error('This offline payment has already been verified and processed.');
    }

    if (action === 'REJECT') {
      const updated = await db.offlinePaymentRecord.update({
        where: { id: record.id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Payment proof or reference invalid.',
          verifiedBy: actor.email || actor.userId,
          verifiedAt: new Date(),
          approvedBy: `REJECTED_BY_${actor.role}`
        }
      });

      return { success: true, status: 'REJECTED', record: updated };
    }

    // Action is VERIFY: Process associated transaction
    const updated = await db.offlinePaymentRecord.update({
      where: { id: record.id },
      data: {
        status: 'VERIFIED',
        verifiedBy: actor.email || actor.userId,
        verifiedAt: new Date(),
        approvedBy: actor.email || actor.userId
      }
    });

    // If linked to SaaS subscription order, fulfill it
    if (record.orderId) {
      const { SaasProvisioningService } = await import('./saas-provisioning.service');
      await SaasProvisioningService.fulfillPaidOrder(record.orderId, {
        gateway: 'BANK_TRANSFER',
        trxId: record.referenceNumber,
        amount: record.amount,
        providerReference: `Offline Verified: ${record.id}`
      });
    }

    return { success: true, status: 'VERIFIED', record: updated };
  }

  /**
   * Calculates dashboard summary metrics for payment gateways
   */
  public static async getPaymentDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeGatewaysCount,
      totalGatewaysCount,
      todaySaaSTransactions,
      todayStudentTransactions,
      recentTransactions
    ] = await Promise.all([
      db.paymentGatewayConfig.count({ where: { scope: 'PLATFORM', isEnabled: true } }),
      db.paymentGatewayConfig.count({ where: { scope: 'PLATFORM' } }),
      db.subscriptionPaymentTransaction.findMany({
        where: { createdAt: { gte: today } }
      }),
      db.paymentTransaction.findMany({
        where: { paidAt: { gte: today } }
      }),
      db.subscriptionPaymentTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              tenant: true,
              signup: true
            }
          }
        }
      })
    ]);

    const totalTodayCount = todaySaaSTransactions.length + todayStudentTransactions.length;
    const successfulToday =
      todaySaaSTransactions.filter(t => t.status === 'SUCCESS').length +
      todayStudentTransactions.filter(t => t.status === 'SUCCESS').length;

    const successRate = totalTodayCount > 0 ? Math.round((successfulToday / totalTodayCount) * 100) : 100;

    const grossVolumeBdt =
      todaySaaSTransactions.filter(t => t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0) +
      todayStudentTransactions.filter(t => t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0);

    return {
      activeGatewaysCount,
      totalGatewaysCount,
      totalTransactionsToday: totalTodayCount,
      successfulTransactionsToday: successfulToday,
      failedTransactionsToday: totalTodayCount - successfulToday,
      successRatePercent: successRate,
      grossVolumeTodayBdt: Math.round(grossVolumeBdt),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        orderId: tx.orderId,
        gateway: tx.gateway,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        trxId: tx.trxId,
        paymentId: tx.paymentId,
        payer: tx.order?.signup?.institutionName || tx.order?.tenant?.slug || 'SaaS Customer',
        createdAt: tx.createdAt
      }))
    };
  }
}
