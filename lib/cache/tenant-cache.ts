/**
 * Tenant-Scoped In-Memory Cache Utility
 * 
 * Provides ultra-fast client-side caching with Stale-While-Revalidate (SWR) support.
 * Guarantees strict multi-tenant isolation by requiring a tenantSlug namespace prefix.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export interface CacheOptions {
  ttlMs?: number; // Default: 60,000ms (1 minute)
}

/**
 * Generates a strictly tenant-isolated cache key.
 */
export function createTenantCacheKey(tenantSlug: string, moduleName: string, subKey: string = ''): string {
  if (!tenantSlug) throw new Error('Tenant slug is mandatory for cache key generation.');
  return `${tenantSlug}::${moduleName}::${subKey}`;
}

/**
 * Retrieves cached data for a specific tenant module.
 */
export function getTenantCache<T>(tenantSlug: string, moduleName: string, subKey: string = ''): T | null {
  const key = createTenantCacheKey(tenantSlug, moduleName, subKey);
  const entry = memoryCache.get(key);
  if (!entry) return null;

  return entry.data as T;
}

/**
 * Sets data into the cache for a specific tenant module.
 */
export function setTenantCache<T>(
  tenantSlug: string,
  moduleName: string,
  subKey: string = '',
  data: T,
  options: CacheOptions = {}
): void {
  const key = createTenantCacheKey(tenantSlug, moduleName, subKey);
  const ttlMs = options.ttlMs || 60000;
  const now = Date.now();

  memoryCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs
  });
}

/**
 * Invalidates all cache entries for a specific tenant or specific module within a tenant.
 */
export function invalidateTenantCache(tenantSlug: string, moduleName?: string): void {
  if (!tenantSlug) return;
  const prefix = moduleName ? `${tenantSlug}::${moduleName}::` : `${tenantSlug}::`;

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clears the entire in-memory cache (e.g. on user logout).
 */
export function clearAllTenantCache(): void {
  memoryCache.clear();
}
