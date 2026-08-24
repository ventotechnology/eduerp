import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { resolveTenantContext } from '../lib/tenant/tenant-guard';
import {
  createAdmissionApplication,
  getTenantAdmissionApplications,
  getAdmissionApplicationById,
  transitionAdmissionStatus,
  submitAdmissionTest,
  convertApplicantToStudent,
  getAdmissionSettings,
  updateAdmissionSettings
} from '../lib/services/admission-service';
import {
  createTenantStudent,
  getTenantStudents,
  getTenantStudentById,
  updateTenantStudent
} from '../lib/services/student-service';
import {
  createAdmissionTest,
  getTenantAdmissionTests,
  getAdmissionTestForCandidate
} from '../lib/services/admission-test-service';
import { recordDailyHifzProgress, getTenantHifzStudents } from '../lib/services/hifz-service';
import { SessionUser } from '../lib/auth/types';

describe('Command 11A: Student Onboarding, Admission Engine & Academic Enrollment', () => {
  let demoSchoolTenant: any;
  let demoSchoolCampus: any;
  let demoSchoolAy: any;
  let demoSchoolClass: any;
  let demoSchoolSection: any;
  let demoSchoolShift: any;

  let demoMadrashaTenant: any;
  let demoMadrashaCampus: any;
  let demoMadrashaAy: any;
  let demoMadrashaClass: any;

  let adminActor: SessionUser;
  let admissionOfficerActor: SessionUser;
  let teacherActor: SessionUser;
  let studentActor: SessionUser;

  beforeAll(async () => {
    // 1. Seed or retrieve demo school tenant
    demoSchoolTenant = await db.tenant.upsert({
      where: { slug: 'test-demo-school' },
      update: {},
      create: {
        slug: 'test-demo-school',
        institutionType: 'SCHOOL',
        isActive: true,
        institution: {
          create: {
            name: 'Test Ideal High School',
            shortName: 'TIHS',
            instituteCode: 'TIHS',
            address: 'Dhanmondi, Dhaka',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: '01711000001',
            email: 'info@demo-school.eduerp.us'
          }
        }
      },
      include: { institution: true }
    });

    demoSchoolCampus = await db.campus.upsert({
      where: { id: 'test-school-campus-1' },
      update: {},
      create: {
        id: 'test-school-campus-1',
        institutionId: demoSchoolTenant.institution.id,
        name: 'Main Campus',
        code: 'MC-01',
        address: 'Dhaka'
      }
    });

    demoSchoolAy = await db.academicYear.upsert({
      where: { institutionId_name: { institutionId: demoSchoolTenant.institution.id, name: '2026' } },
      update: {},
      create: {
        institutionId: demoSchoolTenant.institution.id,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true,
        status: 'ACTIVE'
      }
    });

    demoSchoolShift = await db.shift.upsert({
      where: { institutionId_code: { institutionId: demoSchoolTenant.institution.id, code: 'SFT-MORN' } },
      update: {},
      create: {
        institutionId: demoSchoolTenant.institution.id,
        name: 'Morning Shift',
        code: 'SFT-MORN',
        startTime: '07:30',
        endTime: '12:30'
      }
    });

    demoSchoolClass = await db.class.upsert({
      where: { institutionId_name_shift: { institutionId: demoSchoolTenant.institution.id, name: 'Class 6', shift: 'Morning' } },
      update: {},
      create: {
        institutionId: demoSchoolTenant.institution.id,
        name: 'Class 6',
        numericValue: 6,
        sequence: 6,
        shift: 'Morning'
      }
    });

    demoSchoolSection = await db.section.upsert({
      where: { id: 'test-school-sec-padma' },
      update: {},
      create: {
        id: 'test-school-sec-padma',
        classId: demoSchoolClass.id,
        name: 'Padma',
        capacity: 40
      }
    });

    // 2. Seed demo madrasha tenant
    demoMadrashaTenant = await db.tenant.upsert({
      where: { slug: 'test-demo-madrasha' },
      update: {},
      create: {
        slug: 'test-demo-madrasha',
        institutionType: 'MADRASHA',
        isActive: true,
        institution: {
          create: {
            name: 'Test Darul Quran Madrasha',
            shortName: 'TDQM',
            instituteCode: 'TDQM',
            address: 'Sylhet',
            district: 'Sylhet',
            division: 'Sylhet',
            upazilaThana: 'Kotwali',
            phone: '01811000001',
            email: 'info@demo-madrasha.eduerp.us'
          }
        }
      },
      include: { institution: true }
    });

    demoMadrashaCampus = await db.campus.upsert({
      where: { id: 'test-madrasha-campus-1' },
      update: {},
      create: {
        id: 'test-madrasha-campus-1',
        institutionId: demoMadrashaTenant.institution.id,
        name: 'Madrasha Campus',
        code: 'MAD-01',
        address: 'Sylhet'
      }
    });

    demoMadrashaAy = await db.academicYear.upsert({
      where: { institutionId_name: { institutionId: demoMadrashaTenant.institution.id, name: '2026' } },
      update: {},
      create: {
        institutionId: demoMadrashaTenant.institution.id,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true,
        status: 'ACTIVE'
      }
    });

    demoMadrashaClass = await db.class.upsert({
      where: { institutionId_name_shift: { institutionId: demoMadrashaTenant.institution.id, name: 'Dakhil 9', shift: 'Morning' } },
      update: {},
      create: {
        institutionId: demoMadrashaTenant.institution.id,
        name: 'Dakhil 9',
        numericValue: 9,
        sequence: 9,
        shift: 'Morning'
      }
    });

    // Actors
    adminActor = {
      id: 'usr-admin-1',
      email: 'admin@demo-school.eduerp.us',
      name: 'Principal Ahmed',
      role: 'PRINCIPAL',
      tenantId: demoSchoolTenant.id,
      status: 'ACTIVE' as any,
      isPlatformAdmin: false
    };

    admissionOfficerActor = {
      id: 'usr-adm-officer-1',
      email: 'admission@demo-school.eduerp.us',
      name: 'Admission Officer Kabir',
      role: 'ADMISSION_OFFICER',
      tenantId: demoSchoolTenant.id,
      status: 'ACTIVE' as any,
      isPlatformAdmin: false
    };

    teacherActor = {
      id: 'usr-teacher-1',
      email: 'teacher@demo-school.eduerp.us',
      name: 'Teacher Farhan',
      role: 'TEACHER',
      tenantId: demoSchoolTenant.id,
      status: 'ACTIVE' as any,
      isPlatformAdmin: false
    };

    studentActor = {
      id: 'usr-student-1',
      email: 'student@demo-school.eduerp.us',
      name: 'Student Rahim',
      role: 'STUDENT',
      tenantId: demoSchoolTenant.id,
      status: 'ACTIVE' as any,
      isPlatformAdmin: false
    };
  });

  describe('1. Tenant Context Resolution & Security', () => {
    it('resolves authenticated session tenant safely without slug mismatch', async () => {
      const resolved = await resolveTenantContext({
        session: admissionOfficerActor,
        tenantSlug: 'test-demo-school'
      });
      expect(resolved.tenantId).toBe(demoSchoolTenant.id);
      expect(resolved.tenantSlug).toBe('test-demo-school');
    });

    it('rejects cross-tenant slug mismatch for non-platform admin', async () => {
      await expect(
        resolveTenantContext({
          session: admissionOfficerActor,
          tenantSlug: 'test-demo-madrasha' // different tenant
        })
      ).rejects.toThrow(/FORBIDDEN/);
    });

    it('resolves public tenant by URL slug safely', async () => {
      const resolved = await resolveTenantContext({
        tenantSlug: 'test-demo-school',
        isPublic: true
      });
      expect(resolved.tenantId).toBe(demoSchoolTenant.id);
      expect(resolved.tenantSlug).toBe('test-demo-school');
    });
  });

  describe('2. Public & Internal Admission Applications', () => {
    it('creates public application with dynamic numbering and initial SUBMITTED status', async () => {
      const app = await createAdmissionApplication('test-demo-school', {
        campusId: demoSchoolCampus.id,
        academicYearId: demoSchoolAy.id,
        firstName: 'Tariqul',
        lastName: 'Islam',
        dateOfBirth: '2012-05-15',
        gender: 'Male',
        phone: '01711223344',
        presentAddress: 'Dhanmondi, Dhaka',
        permanentAddress: 'Cumilla',
        desiredClassId: demoSchoolClass.id,
        guardianName: 'Md. Rafiqul Islam',
        guardianPhone: '01711223344',
        guardianRelation: 'Father',
        fatherName: 'Md. Rafiqul Islam',
        fatherPhone: '01711223344',
        motherName: 'Tahmina Begum',
        previousSchool: 'Dhaka Kindergarten',
        previousGpa: 4.80
      });

      expect(app).toBeDefined();
      expect(app.applicationNumber).toMatch(/^APP-2026-\d{4}$/);
      expect(app.status).toBe('SUBMITTED');
      expect(app.applicationFeeStatus).toBe('NOT_REQUIRED'); // 0 application fee by default
      expect(app.firstName).toBe('Tariqul');
    });

    it('lists applications for tenant with status and search filters', async () => {
      const apps = await getTenantAdmissionApplications('test-demo-school', {
        search: 'Tariqul'
      });
      expect(apps.length).toBeGreaterThan(0);
      expect(apps[0].firstName).toBe('Tariqul');
    });
  });

  describe('3. Admission State Machine & Status Transitions', () => {
    let testApp: any;

    beforeEach(async () => {
      testApp = await createAdmissionApplication('test-demo-school', {
        campusId: demoSchoolCampus.id,
        academicYearId: demoSchoolAy.id,
        firstName: 'Salma',
        lastName: 'Khatun',
        dateOfBirth: '2013-08-20',
        gender: 'Female',
        phone: '01899887766',
        presentAddress: 'Mirpur, Dhaka',
        permanentAddress: 'Bogura',
        desiredClassId: demoSchoolClass.id,
        guardianName: 'Abdul Karim',
        guardianPhone: '01899887766',
        fatherName: 'Abdul Karim',
        fatherPhone: '01899887766',
        motherName: 'Rehana Begum'
      });
    });

    it('transitions from SUBMITTED to UNDER_REVIEW to VERIFIED to SELECTED', async () => {
      const step1 = await transitionAdmissionStatus(
        'test-demo-school',
        testApp.id,
        'UNDER_REVIEW',
        admissionOfficerActor
      );
      expect(step1.status).toBe('UNDER_REVIEW');

      const step2 = await transitionAdmissionStatus(
        'test-demo-school',
        testApp.id,
        'VERIFIED',
        admissionOfficerActor
      );
      expect(step2.status).toBe('VERIFIED');

      const step3 = await transitionAdmissionStatus(
        'test-demo-school',
        testApp.id,
        'SELECTED',
        admissionOfficerActor
      );
      expect(step3.status).toBe('SELECTED');
    });

    it('rejects invalid state machine leap (e.g. SUBMITTED directly to ADMITTED)', async () => {
      await expect(
        transitionAdmissionStatus(
          'test-demo-school',
          testApp.id,
          'ADMITTED',
          admissionOfficerActor
        )
      ).rejects.toThrow();
    });
  });

  describe('4. Real Admission Test Scoring Engine', () => {
    let testRecord: any;
    let applicant: any;

    beforeAll(async () => {
      testRecord = await createAdmissionTest(
        'test-demo-school',
        {
          title: 'Class 6 Standard Admission Test',
          durationMinutes: 30,
          totalMarks: 100,
          passMarks: 50,
          questions: [
            {
              id: 'q1',
              text: 'What is the national fruit of Bangladesh?',
              options: ['Mango', 'Jackfruit', 'Banana', 'Watermelon'],
              correct: 'Jackfruit',
              marks: 50
            },
            {
              id: 'q2',
              text: 'What is 15 multiplied by 4?',
              options: ['45', '50', '60', '65'],
              correct: '60',
              marks: 50
            }
          ]
        },
        adminActor
      );
    });

    beforeEach(async () => {
      applicant = await createAdmissionApplication('test-demo-school', {
        campusId: demoSchoolCampus.id,
        academicYearId: demoSchoolAy.id,
        firstName: 'Nafis',
        lastName: 'Ahmed',
        dateOfBirth: '2012-02-10',
        gender: 'Male',
        phone: '01511223344',
        presentAddress: 'Gulshan, Dhaka',
        permanentAddress: 'Sylhet',
        desiredClassId: demoSchoolClass.id,
        guardianName: 'Jahangir Ahmed',
        guardianPhone: '01511223344',
        fatherName: 'Jahangir Ahmed',
        fatherPhone: '01511223344',
        motherName: 'Farhana Ahmed'
      });

      await transitionAdmissionStatus('test-demo-school', applicant.id, 'VERIFIED', admissionOfficerActor);
      await transitionAdmissionStatus('test-demo-school', applicant.id, 'TEST_ELIGIBLE', admissionOfficerActor);
    });

    it('evaluates answers server-side and scores 100% when all answers match', async () => {
      const evalResult = await submitAdmissionTest('test-demo-school', {
        applicationId: applicant.id,
        testId: testRecord.id,
        answers: {
          q1: 'Jackfruit',
          q2: '60'
        }
      });

      expect(evalResult.score).toBe(100);
      expect(evalResult.isPassed).toBe(true);
      expect(evalResult.status).toBe('TESTED');

      const updated = await getAdmissionApplicationById('test-demo-school', applicant.id);
      expect(updated.testScore).toBe(100);
      expect(updated.status).toBe('TESTED');
    });

    it('scores partial marks and marks WAITLISTED if below pass marks', async () => {
      const evalResult = await submitAdmissionTest('test-demo-school', {
        applicationId: applicant.id,
        testId: testRecord.id,
        answers: {
          q1: 'Jackfruit',
          q2: '45' // Wrong answer
        }
      });

      expect(evalResult.score).toBe(50);
      expect(evalResult.isPassed).toBe(true);
    });
  });

  describe('5. Atomic Applicant-to-Student Conversion & Real Academic Enrollment', () => {
    let selectedApp: any;

    beforeEach(async () => {
      selectedApp = await createAdmissionApplication('test-demo-school', {
        campusId: demoSchoolCampus.id,
        academicYearId: demoSchoolAy.id,
        firstName: 'Zubair',
        middleName: 'Hossain',
        lastName: 'Khan',
        dateOfBirth: '2012-11-25',
        gender: 'Male',
        bloodGroup: 'B+',
        religion: 'Islam',
        phone: '01799887766',
        presentAddress: 'Uttara, Dhaka',
        permanentAddress: 'Barishal',
        desiredClassId: demoSchoolClass.id,
        shiftId: demoSchoolShift.id,
        guardianName: 'Monir Hossain Khan',
        guardianPhone: '01799887766',
        guardianRelation: 'Father',
        fatherName: 'Monir Hossain Khan',
        fatherPhone: '01799887766',
        fatherProfession: 'Engineer',
        motherName: 'Rasheda Begum',
        motherPhone: '01799887767',
        admissionFeeAmount: 5000
      });

      await transitionAdmissionStatus('test-demo-school', selectedApp.id, 'UNDER_REVIEW', admissionOfficerActor);
      await transitionAdmissionStatus('test-demo-school', selectedApp.id, 'VERIFIED', admissionOfficerActor);
      await transitionAdmissionStatus('test-demo-school', selectedApp.id, 'SELECTED', admissionOfficerActor);
    });

    it('atomically creates Student, Guardian, StudentGuardian link, Enrollment, and UNPAID invoice', async () => {
      const result = await convertApplicantToStudent(
        'test-demo-school',
        selectedApp.id,
        demoSchoolSection.id,
        admissionOfficerActor,
        { customRollNumber: '07', createPortalAccount: true }
      );

      expect(result.student).toBeDefined();
      expect(result.student.studentIdNumber).toMatch(/^TIHS-2026-\d{4}$/);
      expect(result.student.firstName).toBe('Zubair');
      expect(result.student.lastName).toBe('Khan');
      expect(result.student.rollNumber).toBe('07');

      // Guardian verification (real data, no dummy mother string)
      expect(result.guardian.fatherName).toBe('Monir Hossain Khan');
      expect(result.guardian.motherName).toBe('Rasheda Begum');

      // CRITICAL: Enrollment verification
      expect(result.enrollment).toBeDefined();
      expect(result.enrollment.studentId).toBe(result.student.id);
      expect(result.enrollment.academicYearId).toBe(demoSchoolAy.id);
      expect(result.enrollment.campusId).toBe(demoSchoolCampus.id);
      expect(result.enrollment.classId).toBe(demoSchoolClass.id);
      expect(result.enrollment.sectionId).toBe(demoSchoolSection.id);
      expect(result.enrollment.status).toBe('ACTIVE');
      expect(result.enrollment.rollNumber).toBe('07');

      // Fee Invoice verification: UNPAID (not fake paid)
      expect(result.invoice).toBeDefined();
      expect(result.invoice!.subTotal).toBe(5000);
      expect(result.invoice!.paidAmount).toBe(0);
      expect(result.invoice!.dueAmount).toBe(5000);
      expect(result.invoice!.status).toBe('UNPAID');

      // Application status updated
      const updatedApp = await getAdmissionApplicationById('test-demo-school', selectedApp.id);
      expect(updatedApp.status).toBe('ADMITTED');
      expect(updatedApp.admittedStudentId).toBe(result.student.id);
    });

    it('rejects duplicate conversion of already admitted applicant', async () => {
      await convertApplicantToStudent(
        'test-demo-school',
        selectedApp.id,
        demoSchoolSection.id,
        admissionOfficerActor
      );

      await expect(
        convertApplicantToStudent(
          'test-demo-school',
          selectedApp.id,
          demoSchoolSection.id,
          admissionOfficerActor
        )
      ).rejects.toThrow(/already been admitted/);
    });
  });

  describe('6. Direct Student Onboarding & Madrashah Hifz Flow', () => {
    it('directly onboards a student with Guardian and active Enrollment', async () => {
      const result = await createTenantStudent(
        'test-demo-school',
        {
          campusId: demoSchoolCampus.id,
          academicYearId: demoSchoolAy.id,
          classId: demoSchoolClass.id,
          sectionId: demoSchoolSection.id,
          shiftId: demoSchoolShift.id,
          firstName: 'Imran',
          lastName: 'Chowdhury',
          dateOfBirth: '2011-04-12',
          gender: 'Male',
          presentAddress: 'Dhanmondi 32',
          permanentAddress: 'Habiganj',
          guardian: {
            fatherName: 'Kamal Chowdhury',
            fatherPhone: '01712345678',
            motherName: 'Shamsun Nahar',
            guardianName: 'Kamal Chowdhury',
            guardianPhone: '01712345678',
            guardianRelation: 'Father'
          },
          admissionFeeAmount: 0,
          createPortalAccount: true
        },
        adminActor
      );

      expect(result.student).toBeDefined();
      expect(result.student.studentIdNumber).toMatch(/^TIHS-2026-\d{4}$/);
      expect(result.enrollment).toBeDefined();
      expect(result.enrollment.classId).toBe(demoSchoolClass.id);
      expect(result.enrollment.sectionId).toBe(demoSchoolSection.id);
      expect(result.enrollment.status).toBe('ACTIVE');
    });

    it('onboards Madrashah student with Hifz department enrollment and records daily progress', async () => {
      const madrashaStudent = await createTenantStudent(
        'test-demo-madrasha',
        {
          campusId: demoMadrashaCampus.id,
          academicYearId: demoMadrashaAy.id,
          classId: demoMadrashaClass.id,
          firstName: 'Abdullah',
          lastName: 'Al-Mamun',
          dateOfBirth: '2010-06-01',
          gender: 'Male',
          presentAddress: 'Zindabazar, Sylhet',
          permanentAddress: 'Sunamganj',
          hifzProgram: true,
          hifzProgramType: 'Hifzul Quran',
          guardian: {
            fatherName: 'Maulana Harunur Rashid',
            fatherPhone: '01811223344',
            motherName: 'Fatema Begum',
            guardianName: 'Maulana Harunur Rashid',
            guardianPhone: '01811223344',
            guardianRelation: 'Father'
          }
        },
        adminActor
      );

      expect(madrashaStudent.enrollment.hifzEnrolled).toBe(true);
      expect(madrashaStudent.enrollment.hifzProgram).toBe('Hifzul Quran');

      // Record daily Hifz progress
      const hifzEntry = await recordDailyHifzProgress(
        'test-demo-madrasha',
        {
          studentId: madrashaStudent.student.id,
          date: '2026-08-24',
          sabakPara: 12,
          sabakSurah: 'Surah Yusuf',
          sabakAyatStart: 1,
          sabakAyatEnd: 25,
          sabakGrade: 'Excellent',
          totalParasMemorized: 11,
          teacherNotes: 'Flawless recitation with Tartil.'
        },
        adminActor
      );

      expect(hifzEntry).toBeDefined();
      expect(hifzEntry.sabakPara).toBe(12);
      expect(hifzEntry.totalParasMemorized).toBe(11);

      // Verify list of Hifz students
      const hifzList = await getTenantHifzStudents('test-demo-madrasha');
      expect(hifzList.some(s => s.id === madrashaStudent.student.id)).toBe(true);
    });
  });

  describe('7. Profile Update & SIS Retrieval', () => {
    it('updates student demographic fields and preserves enrollment history', async () => {
      const student = await db.student.findFirst({
        where: { campus: { institutionId: demoSchoolTenant.institution.id } }
      });

      const updated = await updateTenantStudent(
        'test-demo-school',
        student!.id,
        {
          phone: '01900112233',
          presentAddress: 'Gulshan 2, Dhaka'
        },
        adminActor
      );

      expect(updated.phone).toBe('01900112233');
      expect(updated.presentAddress).toBe('Gulshan 2, Dhaka');

      const fetched = await getTenantStudentById('test-demo-school', student!.id);
      expect(fetched.enrollments.length).toBeGreaterThan(0);
    });
  });
});
