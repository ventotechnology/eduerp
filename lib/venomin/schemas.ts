import { z } from 'zod';

export const VenominCustomerIdRegex = /^(VN|WM)-CUS-[A-Za-z0-9_-]{6,32}$/;

export const ProvisionCustomerSchema = z.object({
  walletmixCustomerId: z.string().regex(VenominCustomerIdRegex, 'Invalid Venomin customer ID format'),
  name: z.string().min(2, 'Customer name is required'),
  email: z.string().email('Valid customer email is required'),
  phone: z.string().optional(),
  companyName: z.string().optional(), // Institution name
  country: z.string().default('Bangladesh'),
  currency: z.string().default('BDT'),
});

export const ProvisionPlanSchema = z.object({
  walletmixPlanId: z.string().min(1, 'Walletmix plan ID is required'),
  externalPlanId: z.string().min(1, 'External plan ID is required'),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).default('ANNUAL'),
  studentsCount: z.number().int().positive().optional(),
  campusesCount: z.number().int().positive().optional(),
  teachersCount: z.number().int().positive().optional(),
});

export const ProvisionConfigurationSchema = z
  .object({
    institutionType: z.string().optional(),
    boardAffiliation: z.string().optional(),
    campusesCount: z.number().int().nonnegative().optional(),
    studentsCount: z.number().int().nonnegative().optional(),
    curriculum: z.string().optional(),
    modules: z.array(z.string()).optional(),
    currency: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    isTest: z.boolean().optional(),
    dryRun: z.boolean().optional(),
  })
  .passthrough()
  .optional();

export const ProvisionTrialSchema = z
  .object({
    enabled: z.boolean().default(true),
    trialDays: z.number().int().min(1).max(90).default(14),
  })
  .optional();

export const ProvisionRequestSchema = z.object({
  requestId: z.string().min(6, 'Request ID is required'),
  idempotencyKey: z.string().min(8, 'Idempotency key is required'),
  walletmixCustomerId: z.string().regex(VenominCustomerIdRegex, 'Invalid Venomin customer ID format'),
  product: z.literal('eduerp'),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'SANDBOX', 'PRODUCTION']).default('STAGING'),
  customer: ProvisionCustomerSchema,
  plan: ProvisionPlanSchema,
  configuration: ProvisionConfigurationSchema,
  trial: ProvisionTrialSchema,
});

export const SuspendRequestSchema = z.object({
  walletmixCustomerId: z.string().regex(VenominCustomerIdRegex),
  reason: z.string().optional(),
  tenantId: z.string().optional(),
});

export const ReactivateRequestSchema = z.object({
  walletmixCustomerId: z.string().regex(VenominCustomerIdRegex),
  reason: z.string().optional(),
  tenantId: z.string().optional(),
});

export const SSOExchangeSchema = z.object({
  token: z.string().min(20, 'SSO token is required'),
});

export const WebhookEventSchema = z.object({
  eventId: z.string().min(6),
  eventType: z.enum(['tenant.provisioned', 'tenant.suspended', 'tenant.reactivated', 'usage.reported']),
  timestamp: z.number().int(),
  productSlug: z.literal('eduerp'),
  tenantId: z.string(),
  walletmixCustomerId: z.string().regex(VenominCustomerIdRegex),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'SANDBOX', 'PRODUCTION']),
  payload: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().optional(),
});
