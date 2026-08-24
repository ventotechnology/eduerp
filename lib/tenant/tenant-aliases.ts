/**
 * Canonical Tenant Slug and Friendly Alias Definitions for EduERP Multi-Tenant SaaS.
 * Provides unified, bidirectional mapping and canonicalization for all 8 educational verticals.
 */

export const TENANT_SLUG_ALIASES: Record<string, string> = {
  // 1. School (Dhaka Ideal Model School)
  'dims': 'demo-school',
  'dhaka-ideal-school': 'demo-school',
  'dhaka-ideal-model-school': 'demo-school',
  'dhaka-ideal-model-high-school': 'demo-school',

  // 2. College (Chittagong Model College)
  'cmc': 'demo-college',
  'dhaka-imperial-college': 'demo-college',
  'chittagong-model-college': 'demo-college',

  // 3. School & College (Rajshahi Model School & College)
  'rmsc': 'demo-school-college',
  'rajshahi-model-school-college': 'demo-school-college',
  'rajshahi-model-school-and-college': 'demo-school-college',

  // 4. Madrasha (Darul Uloom Islamia Madrasha)
  'duim': 'demo-madrasha',
  'al-jamiatul-islamia-madrasha': 'demo-madrasha',
  'sylhet-madrasha': 'demo-madrasha',
  'darul-uloom-islamia-madrasha': 'demo-madrasha',

  // 5. University (Metropolitan University Bangladesh)
  'mub': 'demo-university',
  'metropolitan-university': 'demo-university',
  'metropolitan-university-bangladesh': 'demo-university',

  // 6. Polytechnic (Dhaka Polytechnic Institute)
  'dpi': 'demo-polytechnic',
  'dhaka-polytechnic-institute': 'demo-polytechnic',

  // 7. Vocational (Bangladesh Technical Vocational Academy)
  'btva': 'demo-vocational',
  'bangladesh-technical-vocational-academy': 'demo-vocational',

  // 8. Training (National Institute of Professional Training)
  'nipt': 'demo-training',
  'national-institute-of-professional-training': 'demo-training',
};

/**
 * Resolves a raw tenant slug or alias into its authoritative canonical tenant slug.
 */
export function resolveCanonicalTenantSlug(rawSlug: string | null | undefined): string {
  if (!rawSlug) return 'demo-school';
  const normalized = rawSlug.trim().toLowerCase();
  return TENANT_SLUG_ALIASES[normalized] || normalized;
}

/**
 * Validates whether two tenant identifiers or aliases resolve to the same canonical tenant.
 */
export function isSameTenant(slugA: string | null | undefined, slugB: string | null | undefined): boolean {
  if (!slugA || !slugB) return false;
  return resolveCanonicalTenantSlug(slugA) === resolveCanonicalTenantSlug(slugB);
}

/**
 * Determines the appropriate route slug to preserve navigation context.
 */
export function getTenantRouteSlug(currentSlug: string | null | undefined, sessionSlug?: string | null): string {
  if (currentSlug) {
    return currentSlug.trim().toLowerCase();
  }
  if (sessionSlug) {
    return sessionSlug.trim().toLowerCase();
  }
  return 'demo-school';
}
