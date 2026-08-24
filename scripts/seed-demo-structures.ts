import { db } from '../lib/db';

export async function seedAllInstitutionStructures() {
  const institutions = await db.institution.findMany({
    include: {
      tenant: true,
      academicYears: true,
      campuses: true,
      shifts: true,
      classes: true,
      admissionSetting: true
    }
  });

  console.log(`Found ${institutions.length} institutions in database.`);

  for (const inst of institutions) {
    console.log(`Setting up structures for ${inst.name} (${inst.tenant?.slug})...`);

    // 1. Campus
    let campus = inst.campuses[0];
    if (!campus) {
      campus = await db.campus.create({
        data: {
          institutionId: inst.id,
          name: `${inst.name} (Main Campus)`,
          code: 'MAIN',
          address: inst.address || 'Dhaka',
          isMain: true
        }
      });
      console.log(`  Created campus: ${campus.name}`);
    }

    // 2. Academic Year
    let ay = inst.academicYears.find(y => y.name === '2026') || inst.academicYears[0];
    if (!ay) {
      ay = await db.academicYear.create({
        data: {
          institutionId: inst.id,
          name: '2026',
          code: 'AY-2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: 'ACTIVE',
          isCurrent: true
        }
      });
      console.log(`  Created academic year: 2026`);
    }

    // 3. Shift
    let shift = inst.shifts[0];
    if (!shift) {
      shift = await db.shift.create({
        data: {
          institutionId: inst.id,
          name: 'Morning Shift',
          code: 'SFT-MORN',
          startTime: '07:30',
          endTime: '12:30',
          isActive: true
        }
      });
      console.log(`  Created shift: Morning Shift`);
    }

    // 4. Classes & Sections
    if (inst.classes.length === 0) {
      const type = inst.tenant?.institutionType || 'SCHOOL';
      const classNames = type === 'COLLEGE'
        ? ['Class 11 (Science)', 'Class 11 (Commerce)', 'Class 12 (Science)', 'Class 12 (Commerce)']
        : type === 'MADRASHA'
        ? ['Dakhil 6', 'Dakhil 7', 'Dakhil 8', 'Dakhil 9', 'Dakhil 10']
        : type === 'UNIVERSITY'
        ? ['Undergraduate Year 1', 'Undergraduate Year 2', 'Undergraduate Year 3', 'Undergraduate Year 4']
        : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

      for (let i = 0; i < classNames.length; i++) {
        const clsName = classNames[i];
        const cls = await db.class.create({
          data: {
            institutionId: inst.id,
            name: clsName,
            numericValue: i + 6,
            sequence: i + 1,
            shift: 'Morning',
            stage: 'SECONDARY'
          }
        });

        await db.section.create({
          data: {
            classId: cls.id,
            name: 'Padma',
            capacity: 40
          }
        });
      }
      console.log(`  Created ${classNames.length} classes and sections`);
    }

    // 5. Admission Setting
    if (!inst.admissionSetting) {
      await db.admissionSetting.create({
        data: {
          institutionId: inst.id,
          isOnlineAdmissionOpen: true,
          applicationFee: 0,
          admissionFeeDefault: 5000,
          isTestRequired: false,
          maxCapacityPerClass: 40,
          applicationNumberPrefix: inst.shortName || 'APP'
        }
      });
      console.log(`  Created admission settings`);
    }
  }
}

if (require.main === module) {
  seedAllInstitutionStructures()
    .then(() => {
      console.log('✅ ALL INSTITUTION STRUCTURES POPULATED');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
