import { describe, it, expect } from 'vitest';
import {
  TENANT_SLUG_ALIASES,
  resolveCanonicalTenantSlug,
  isSameTenant,
  getTenantRouteSlug
} from '@/lib/tenant/tenant-aliases';

describe('Tenant Alias & Canonicalization Engine', () => {
  it('resolves dims alias and variants to canonical demo-school', () => {
    expect(resolveCanonicalTenantSlug('dims')).toBe('demo-school');
    expect(resolveCanonicalTenantSlug('DIMS')).toBe('demo-school');
    expect(resolveCanonicalTenantSlug('dhaka-ideal-school')).toBe('demo-school');
    expect(resolveCanonicalTenantSlug('dhaka-ideal-model-school')).toBe('demo-school');
    expect(resolveCanonicalTenantSlug('demo-school')).toBe('demo-school');
  });

  it('resolves all 8 canonical educational vertical shortName aliases', () => {
    expect(resolveCanonicalTenantSlug('dims')).toBe('demo-school');
    expect(resolveCanonicalTenantSlug('cmc')).toBe('demo-college');
    expect(resolveCanonicalTenantSlug('rmsc')).toBe('demo-school-college');
    expect(resolveCanonicalTenantSlug('duim')).toBe('demo-madrasha');
    expect(resolveCanonicalTenantSlug('mub')).toBe('demo-university');
    expect(resolveCanonicalTenantSlug('dpi')).toBe('demo-polytechnic');
    expect(resolveCanonicalTenantSlug('btva')).toBe('demo-vocational');
    expect(resolveCanonicalTenantSlug('nipt')).toBe('demo-training');
  });

  it('preserves unknown or custom tenant slugs without cross-mapping', () => {
    expect(resolveCanonicalTenantSlug('custom-institution-abc')).toBe('custom-institution-abc');
    expect(resolveCanonicalTenantSlug('oxford-international')).toBe('oxford-international');
  });

  it('correctly evaluates isSameTenant across canonical and friendly aliases', () => {
    expect(isSameTenant('dims', 'demo-school')).toBe(true);
    expect(isSameTenant('DIMS', 'demo-school')).toBe(true);
    expect(isSameTenant('demo-school', 'dims')).toBe(true);
    expect(isSameTenant('duim', 'demo-madrasha')).toBe(true);
    expect(isSameTenant('cmc', 'demo-college')).toBe(true);

    // Cross-tenant mismatch must strictly return false
    expect(isSameTenant('dims', 'demo-madrasha')).toBe(false);
    expect(isSameTenant('dims', 'duim')).toBe(false);
    expect(isSameTenant('demo-school', 'demo-madrasha')).toBe(false);
    expect(isSameTenant('demo-college', 'demo-university')).toBe(false);
  });

  it('determines the route slug preserving current navigation context', () => {
    expect(getTenantRouteSlug('dims', 'demo-school')).toBe('dims');
    expect(getTenantRouteSlug('demo-school', 'demo-school')).toBe('demo-school');
    expect(getTenantRouteSlug(null, 'demo-madrasha')).toBe('demo-madrasha');
    expect(getTenantRouteSlug('', 'demo-college')).toBe('demo-college');
    expect(getTenantRouteSlug(null, null)).toBe('demo-school');
  });
});
