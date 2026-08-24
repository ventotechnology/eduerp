import { ENV } from '../env';
import { db } from '../db';
import { DomainResolutionResult } from './types';

/**
 * Resolves incoming hostname to a specific tenant slug.
 * Supports:
 * - Subdomain: [slug].eduerp.us
 * - Custom domain: erp.examplecollege.edu.bd
 */
export async function resolveDomainToTenant(hostname: string): Promise<DomainResolutionResult | null> {
  const cleanHost = hostname.toLowerCase().split(':')[0]; // Strip port

  // 1. Check if Root Domain / Super Admin Portal
  if (cleanHost === ENV.NEXT_PUBLIC_ROOT_DOMAIN || cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return null;
  }

  // 2. Check if standard SaaS Subdomain (e.g. "dims.eduerp.us")
  if (cleanHost.endsWith(`.${ENV.NEXT_PUBLIC_ROOT_DOMAIN}`)) {
    const slug = cleanHost.replace(`.${ENV.NEXT_PUBLIC_ROOT_DOMAIN}`, '');
    return {
      tenantSlug: slug,
      isCustomDomain: false,
      domain: cleanHost
    };
  }

  // 3. Check Custom Domain Registry in Database
  try {
    const domainRecord = await db.tenantDomain.findUnique({
      where: { domain: cleanHost },
      include: { tenant: true }
    });

    if (domainRecord && domainRecord.isVerified && domainRecord.tenant.isActive) {
      return {
        tenantSlug: domainRecord.tenant.slug,
        isCustomDomain: true,
        domain: cleanHost
      };
    }
  } catch (err) {
    console.error('Failed to resolve custom domain from database', err);
  }

  return null;
}
