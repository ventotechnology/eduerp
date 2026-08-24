import { db } from '../lib/db';

export async function migrateMisroutedApplications() {
  console.log('=== CHECKING FOR MISROUTED ADMISSION APPLICATIONS ===');

  const canonicalDemoSchoolTenant = await db.tenant.findUnique({
    where: { slug: 'demo-school' },
    include: {
      institution: {
        include: {
          campuses: true,
          academicYears: true,
          classes: true
        }
      }
    }
  });

  if (!canonicalDemoSchoolTenant || !canonicalDemoSchoolTenant.institution) {
    throw new Error('Canonical demo-school tenant/institution not found');
  }

  const canonicalInst = canonicalDemoSchoolTenant.institution;
  const canonicalCampus = canonicalInst.campuses[0];
  const canonicalAy = canonicalInst.academicYears.find(y => y.name === '2026') || canonicalInst.academicYears[0];
  const canonicalClass10 = canonicalInst.classes.find(c => c.name.includes('10')) || canonicalInst.classes[0];

  console.log(`Canonical Demo School: id=${canonicalInst.id}, campus=${canonicalCampus?.id}, ay=${canonicalAy?.id}`);

  // Find applications linked to other/legacy Dhaka Ideal School institution
  const legacyInst = await db.institution.findFirst({
    where: {
      id: { not: canonicalInst.id },
      name: { contains: 'Dhaka Ideal' }
    }
  });

  if (legacyInst) {
    console.log(`Found legacy institution: id=${legacyInst.id}, name=${legacyInst.name}`);
    const legacyApps = await db.admissionApplication.findMany({
      where: { institutionId: legacyInst.id }
    });

    console.log(`Found ${legacyApps.length} applications under legacy institution.`);

    for (const app of legacyApps) {
      console.log(`Migrating application ${app.applicationNumber} (${app.firstName} ${app.lastName}) to canonical institution...`);
      await db.admissionApplication.update({
        where: { id: app.id },
        data: {
          institutionId: canonicalInst.id,
          campusId: canonicalCampus ? canonicalCampus.id : app.campusId,
          academicYearId: canonicalAy ? canonicalAy.id : app.academicYearId,
          desiredClassId: canonicalClass10 ? canonicalClass10.id : app.desiredClassId
        }
      });
      console.log(`  ✅ Successfully migrated application ${app.applicationNumber}`);
    }
  } else {
    console.log('No legacy institution found.');
  }

  console.log('=== MIGRATION AUDIT COMPLETE ===');
}

if (require.main === module) {
  migrateMisroutedApplications()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
