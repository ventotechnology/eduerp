import { db } from '../lib/db';

export async function consolidateDuplicateTenants() {
  console.log('=== EDUERP TENANT CONSOLIDATION & CANONICAL CLEANUP ===');

  const legacyMap: Record<string, string> = {
    'dhaka-ideal-school': 'demo-school',
    'dhaka-imperial-college': 'demo-college',
    'al-jamiatul-islamia-madrasha': 'demo-madrasha',
    'metropolitan-university': 'demo-university',
  };

  for (const [legacySlug, canonicalSlug] of Object.entries(legacyMap)) {
    const legacyTenant = await db.tenant.findUnique({
      where: { slug: legacySlug },
      include: {
        institution: {
          include: {
            campuses: true,
          }
        },
        users: true
      }
    });

    const canonicalTenant = await db.tenant.findUnique({
      where: { slug: canonicalSlug },
      include: {
        institution: {
          include: {
            campuses: true
          }
        }
      }
    });

    if (!legacyTenant) {
      console.log(`ℹ️ Legacy tenant '${legacySlug}' does not exist (already clean).`);
      continue;
    }

    if (!canonicalTenant || !canonicalTenant.institution) {
      console.warn(`⚠️ Canonical tenant '${canonicalSlug}' not found! Skipping migration for '${legacySlug}'.`);
      continue;
    }

    const canonicalCampus = canonicalTenant.institution.campuses[0];
    const legacyCampus = legacyTenant.institution?.campuses[0];

    console.log(`🔄 Consolidating '${legacySlug}' -> '${canonicalSlug}'...`);

    // 1. Move Students if any
    if (legacyCampus && canonicalCampus) {
      const movedStudents = await db.student.updateMany({
        where: { campusId: legacyCampus.id },
        data: { campusId: canonicalCampus.id }
      });
      if (movedStudents.count > 0) {
        console.log(`   - Moved ${movedStudents.count} students to canonical campus.`);
      }

      const movedAdmissions = await db.admissionApplication.updateMany({
        where: { campusId: legacyCampus.id },
        data: { campusId: canonicalCampus.id }
      });
      if (movedAdmissions.count > 0) {
        console.log(`   - Moved ${movedAdmissions.count} admission applications to canonical campus.`);
      }
    }

    // 2. Move Users if any
    const movedUsers = await db.user.updateMany({
      where: { tenantId: legacyTenant.id },
      data: { tenantId: canonicalTenant.id }
    });
    if (movedUsers.count > 0) {
      console.log(`   - Moved ${movedUsers.count} users to canonical tenant.`);
    }

    // 3. Remove Legacy Institution and Tenant
    if (legacyTenant.institution) {
      await db.campus.deleteMany({ where: { institutionId: legacyTenant.institution.id } });
      await db.admissionSetting.deleteMany({ where: { institutionId: legacyTenant.institution.id } });
      await db.academicYear.deleteMany({ where: { institutionId: legacyTenant.institution.id } });
      await db.shift.deleteMany({ where: { institutionId: legacyTenant.institution.id } });
      await db.class.deleteMany({ where: { institutionId: legacyTenant.institution.id } });
      await db.institution.delete({ where: { id: legacyTenant.institution.id } });
    }

    await db.tenant.delete({ where: { id: legacyTenant.id } });
    console.log(`✅ Removed legacy duplicate tenant '${legacySlug}'. Canonical '${canonicalSlug}' is active.`);
  }

  // Verify Owner Application APP-2026-0002
  const ownerApp = await db.admissionApplication.findFirst({
    where: { applicationNumber: 'APP-2026-0002' }
  });
  if (ownerApp) {
    console.log(`✅ Verified Owner Application APP-2026-0002 (Applicant: ${ownerApp.firstName} ${ownerApp.lastName}) is intact.`);
  } else {
    console.warn(`⚠️ Warning: APP-2026-0002 was not found in the database.`);
  }

  // Count active tenants
  const remainingTenants = await db.tenant.findMany({
    select: { slug: true, isDemoTenant: true, isActive: true }
  });
  console.log(`📊 Total remaining tenants: ${remainingTenants.length}`);
  remainingTenants.forEach(t => console.log(`   - /${t.slug} (demo: ${t.isDemoTenant}, active: ${t.isActive})`));
}

if (require.main === module) {
  consolidateDuplicateTenants()
    .then(() => {
      console.log('🎉 Tenant consolidation completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during consolidation:', err);
      process.exit(1);
    });
}
