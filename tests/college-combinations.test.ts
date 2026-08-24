import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createAcademicGroup,
  createSubjectCombination,
  createSchoolClass,
  createSchoolSubject
} from '../lib/services/academic-structure-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-COLLEGE-ADMIN',
  name: 'College Vice Principal',
  email: 'vp@ideal.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'ideal-college',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('College Subject Combination & 4th Subject Engine (COMMAND 3)', () => {
  let sciGroupId: string;
  let subBanglaId: string;
  let subMathId: string;
  let subBioId: string;

  beforeAll(async () => {
    const tenant = await db.tenant.upsert({
      where: { slug: 'ideal-college' },
      update: {},
      create: {
        slug: 'ideal-college',
        institutionType: 'COLLEGE',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Ideal College Dhanmondi',
        shortName: 'ICD',
        eiin: '108214',
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '+880 1711-000000',
        email: 'info@ideal.edu.bd'
      }
    });

    // Cleanup previous test combination & group records
    await db.subjectCombinationTemplate.deleteMany({ where: { institutionId: institution.id } });
    await db.academicGroup.deleteMany({ where: { institutionId: institution.id } });
    await db.subject.deleteMany({ where: { class: { institutionId: institution.id } } });
    await db.class.deleteMany({ where: { institutionId: institution.id, name: 'HSC Class XI Test' } });

    // Create Group
    const sciGroup = await createAcademicGroup(
      'ideal-college',
      {
        name: 'Science Group XI',
        code: 'SCI-XI',
        description: 'HSC Science Stream'
      },
      mockAdmin
    );
    sciGroupId = sciGroup.id;

    // Create Class XI
    const cls = await createSchoolClass(
      'ideal-college',
      {
        name: 'HSC Class XI Test',
        numericValue: 11,
        sequence: 11,
        stage: 'HIGHER_SECONDARY',
        shift: 'Morning'
      },
      mockAdmin
    );

    // Create Subjects
    const bangla = await createSchoolSubject(
      'ideal-college',
      {
        classId: cls.id,
        name: 'Bangla 1st Paper',
        code: '101',
        type: 'COMPULSORY',
        fullMarks: 100
      },
      mockAdmin
    );
    subBanglaId = bangla.id;

    const math = await createSchoolSubject(
      'ideal-college',
      {
        classId: cls.id,
        name: 'Higher Mathematics 1st',
        code: '126',
        type: 'ELECTIVE',
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      },
      mockAdmin
    );
    subMathId = math.id;

    const bio = await createSchoolSubject(
      'ideal-college',
      {
        classId: cls.id,
        name: 'Biology 1st',
        code: '178',
        type: '4TH_SUBJECT',
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      },
      mockAdmin
    );
    subBioId = bio.id;
  });

  it('creates an HSC Subject Combination Template with compulsory, elective, and 4th subject choices', async () => {
    const combination = await createSubjectCombination(
      'ideal-college',
      {
        groupId: sciGroupId,
        name: 'HSC Science - Higher Math (Compulsory) & Biology (4th Subject)',
        code: 'COMB-HSC-SCI-01',
        compulsorySubjectCodes: ['101', '107', '174', '176'],
        electiveSubjectCodes: ['126'],
        fourthSubjectChoices: ['178', '154'],
        practicalSubjectCodes: ['174', '176', '126', '178']
      },
      mockAdmin
    );

    expect(combination).toBeDefined();
    expect(combination.name).toContain('Higher Math');
    expect(JSON.parse(combination.compulsorySubjectCodes)).toContain('101');
    expect(JSON.parse(combination.electiveSubjectCodes)).toContain('126');
    expect(JSON.parse(combination.fourthSubjectChoices)).toContain('178');
  });
});
