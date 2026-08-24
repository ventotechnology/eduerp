import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLibrary, getLibraries } from '@/lib/services/library-service';
import { createHostelMaster, getHostels } from '@/lib/services/hostel-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Facility Cross-Tenant Security & RBAC Governance', () => {
  let instA: any;
  let instB: any;
  let campusA: any;
  let campusB: any;
  let actorA: SessionUser;
  let actorB: SessionUser;

  beforeEach(async () => {
    const tsA = Date.now() + Math.floor(Math.random() * 10000);
    const tsB = tsA + 1;

    const tenantA = await db.tenant.create({
      data: { slug: `alpha-${tsA}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });

    const tenantB = await db.tenant.create({
      data: { slug: `beta-${tsB}`, institutionType: 'COLLEGE', subscriptionTier: 'ENTERPRISE', isActive: true },
    });

    instA = await db.institution.create({
      data: {
        tenantId: tenantA.id,
        name: 'Institution Alpha',
        shortName: 'ALPHA',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711000000',
        email: `alpha-${tsA}@test.edu`,
      },
    });

    instB = await db.institution.create({
      data: {
        tenantId: tenantB.id,
        name: 'Institution Beta',
        shortName: 'BETA',
        address: 'Chittagong',
        district: 'Chittagong',
        division: 'Chittagong',
        upazilaThana: 'Panchlaish',
        phone: '01811000000',
        email: `beta-${tsB}@test.edu`,
      },
    });

    campusA = await db.campus.create({
      data: { institutionId: instA.id, name: 'Campus Alpha', code: `CA-${tsA}`, address: 'Dhaka' },
    });

    campusB = await db.campus.create({
      data: { institutionId: instB.id, name: 'Campus Beta', code: `CB-${tsB}`, address: 'Chittagong' },
    });

    actorA = {
      id: 'user-alpha-1',
      name: 'Admin Alpha',
      email: 'admin@alpha.edu',
      role: 'PRINCIPAL',
      tenantId: tenantA.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    actorB = {
      id: 'user-beta-1',
      name: 'Admin Beta',
      email: 'admin@beta.edu',
      role: 'PRINCIPAL',
      tenantId: tenantB.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('strictly isolates facilities data between tenants and forbids cross-tenant access', async () => {
    const libA = await createLibrary(
      actorA.tenantId!,
      { campusId: campusA.id, code: `LIB-A-${Date.now()}`, name: 'Alpha Main Library' },
      actorA
    );

    const hostB = await createHostelMaster(
      actorB.tenantId!,
      { campusId: campusB.id, code: `HST-B-${Date.now()}`, name: 'Beta Hall', capacity: 50 },
      actorB
    );

    const betaLibraries = await getLibraries(actorB.tenantId!);
    expect(betaLibraries.find((l) => l.id === libA.id)).toBeUndefined();

    const alphaHostels = await getHostels(actorA.tenantId!);
    expect(alphaHostels.find((h) => h.id === hostB.id)).toBeUndefined();

    await expect(
      createLibrary(
        actorA.tenantId!,
        { campusId: campusB.id, code: `LIB-CROSS-${Date.now()}`, name: 'Illegal Cross Campus Lib' },
        actorA
      )
    ).rejects.toThrow(/does not exist in this institution/i);
  });
});
