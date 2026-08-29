export type IntegrationEnvironment = 'DEVELOPMENT' | 'STAGING' | 'SANDBOX' | 'PRODUCTION';

export interface ProvisionCustomerData {
  walletmixCustomerId: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string; // Institution name
  country?: string;
  currency?: string;
}

export interface ProvisionPlanData {
  walletmixPlanId: string;
  externalPlanId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  studentsCount?: number;
  campusesCount?: number;
  teachersCount?: number;
}

export interface ProvisionConfigurationData {
  institutionType?: string; // School, College, University, Madrasha, Training Institute, Polytechnic
  boardAffiliation?: string;
  campusesCount?: number;
  studentsCount?: number;
  curriculum?: string;
  modules?: string[];
  currency?: string;
  country?: string;
  timezone?: string;
  isTest?: boolean;
  dryRun?: boolean;
  [key: string]: unknown;
}

export interface ProvisionTrialData {
  enabled: boolean;
  trialDays: number;
}

export interface ProvisionRequest {
  requestId: string;
  idempotencyKey: string;
  walletmixCustomerId: string;
  product: 'eduerp';
  environment: IntegrationEnvironment;
  customer: ProvisionCustomerData;
  plan: ProvisionPlanData;
  configuration?: ProvisionConfigurationData;
  trial?: ProvisionTrialData;
}

export interface ProvisionResponse {
  requestId: string;
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
  externalProvisioningId?: string;
  tenantId?: string | null;
  institutionId?: string | null;
  externalUserId?: string | null;
  tenantSlug?: string;
  launchUrl?: string;
  safeMessage: string;
  errorCode?: string;
  completedAt?: string;
}

export interface ProductWebhookEvent {
  eventId: string;
  eventType: 'tenant.provisioned' | 'tenant.suspended' | 'tenant.reactivated' | 'usage.reported';
  timestamp: number;
  productSlug: 'eduerp';
  tenantId: string;
  walletmixCustomerId: string;
  environment: IntegrationEnvironment;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface SSOClaims {
  sub: string; // Universal Customer ID: VN-CUS-XXXXXXXX
  email: string;
  name: string;
  product: 'eduerp';
  roles?: string[];
  aud: string; // eduerp.us
  iss: string; // https://venomin.com
  nonce?: string;
  exp: number;
  iat: number;
}

export interface SSOResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  sessionToken?: string;
  redirectUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface AccountSyncData {
  walletmixCustomerId: string;
  tenantId: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  planCode: string;
  subscriptionStatus: string;
  launchUrl: string;
  usageSummary: {
    campusesCount: number;
    studentsCount: number;
    teachersCount: number;
    staffCount: number;
    classesCount: number;
    sectionsCount: number;
    programsCount: number;
    departmentsCount: number;
  };
}

export interface ProductHealthResponse {
  status: 'ok' | 'degraded' | 'maintenance';
  product: 'eduerp';
  environment: string;
  integrationVersion: 'v1';
  version: string;
  timestamp: string;
  capabilities: {
    provisioning: boolean;
    sso: boolean;
    webhooks: boolean;
    usageSync: boolean;
    schoolEngine: boolean;
    collegeEngine: boolean;
    universityEngine: boolean;
    madrashaEngine: boolean;
  };
}

export interface ServiceAuthContext {
  authenticated: boolean;
  claims?: {
    sub: string;
    scope?: string[];
    product?: string;
    environment?: IntegrationEnvironment;
    [key: string]: unknown;
  };
  errorCode?: string;
  errorMessage?: string;
}
