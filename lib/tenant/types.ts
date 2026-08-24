import { InstitutionType, SubscriptionTier } from '@prisma/client';

export interface TenantContext {
  tenantId: string;
  institutionId: string;
  slug: string;
  name: string;
  institutionType: InstitutionType;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  isDemoTenant: boolean;
}

export interface DomainResolutionResult {
  tenantSlug: string;
  isCustomDomain: boolean;
  domain: string;
}
