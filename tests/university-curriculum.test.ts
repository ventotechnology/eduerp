import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createFaculty,
  createDepartment,
  createProgram,
  createUniversityCourse,
  createCurriculum,
  createCurriculumVersion,
  createCourseOffering
} from '../lib/services/academic-structure-service';
import { registerStudentCourse } from '../lib/services/course-registration-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-UNI-DEAN',
  name: 'Dean of Engineering',
  email: 'dean.eng@green.edu.bd',
  role: 'DEAN',
  tenantId: 'green-university',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('University Curriculum Versioning & Course Engine (COMMAND 3)', () => {
  let testCampusId: string;
  let progId: string;
  let cse101Id: string;
  let cse201Id: string;
  let cse302Id: string;
  let currId: string;
  let testStudentId: string;
  let testSessionId: string;

  beforeAll(async () => {
    const tenant = await db.tenant.upsert({
      where: { slug: 'green-university' },
      update: {},
      create: {
        slug: 'green-university',
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Green University of Bangladesh',
        shortName: 'GUB',
        eiin: '135901',
        boardAffiliation: 'UGC',
        address: 'Begum Rokeya Sarani, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '+880 2-9014705',
        email: 'info@green.edu.bd'
      }
    });

    const campus = await db.campus.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: 'CMP-MAIN'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'GUB Main Campus',
        code: 'CMP-MAIN',
        address: 'Begum Rokeya Sarani, Dhaka',
        isMain: true
      }
    });
    testCampusId = campus.id;

    const yr = await db.academicYear.upsert({
      where: {
        institutionId_name: {
          institutionId: institution.id,
          name: '2026'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });

    const sess = await db.session.create({
      data: {
        academicYearId: yr.id,
        name: 'Spring 2026 EEE',
        type: 'SEMESTER',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });

    testSessionId = sess.id;

    // Clean up test faculty, department, curriculum records from previous runs
    await db.curriculumCourse.deleteMany({ where: { curriculumVersion: { curriculum: { institutionId: institution.id } } } });
    await db.curriculumVersion.deleteMany({ where: { curriculum: { institutionId: institution.id } } });
    await db.curriculum.deleteMany({ where: { institutionId: institution.id, code: 'CURR-EEE-2026-TEST' } });
    await db.courseOffering.deleteMany({ where: { course: { program: { department: { institutionId: institution.id } } } } });
    await db.courseRegistration.deleteMany({ where: { student: { campus: { institutionId: institution.id } } } });
    await db.coursePrerequisite.deleteMany({ where: { course: { program: { department: { institutionId: institution.id } } } } });
    await db.course.deleteMany({ where: { program: { department: { institutionId: institution.id } } } });
    await db.program.deleteMany({ where: { department: { institutionId: institution.id } } });
    await db.department.deleteMany({ where: { institutionId: institution.id } });
    await db.faculty.deleteMany({ where: { institutionId: institution.id } });

    // Create Faculty & Department
    const faculty = await createFaculty(
      'green-university',
      {
        name: 'Faculty of Engineering & Technology',
        code: 'FET-TEST',
        deanName: 'Prof. Dr. Rahman'
      },
      mockAdmin
    );

    const dept = await createDepartment(
      'green-university',
      {
        facultyId: faculty.id,
        name: 'Electrical and Electronic Engineering',
        code: 'EEE-TEST',
        headName: 'Dr. Kabir'
      },
      mockAdmin
    );

    const prog = await createProgram(
      'green-university',
      {
        departmentId: dept.id,
        name: 'Bachelor of Science in EEE',
        code: 'BSC-EEE-TEST',
        degreeLevel: 'BACHELOR',
        durationYears: 4.0,
        totalCredits: 140
      },
      mockAdmin
    );
    progId = prog.id;

    // Create Student
    const user = await db.user.create({
      data: {
        email: `eee.student.${Date.now()}@green.edu.bd`,
        passwordHash: 'hash',
        name: 'Arif Hossain',
        role: 'STUDENT'
      }
    });

    const student = await db.student.create({
      data: {
        campusId: testCampusId,
        userId: user.id,
        studentIdNumber: `STU-EEE-${Date.now().toString().slice(-4)}`,
        admissionNumber: `ADM-EEE-${Date.now().toString().slice(-4)}`,
        firstName: 'Arif',
        lastName: 'Hossain',
        dateOfBirth: new Date('2004-02-10'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE'
      }
    });
    testStudentId = student.id;
  });

  it('creates university courses with lecture and lab credit separation', async () => {
    const cse101 = await createUniversityCourse(
      'green-university',
      {
        programId: progId,
        code: 'EEE-101-T',
        title: 'Circuit Analysis I',
        creditHours: 3.0,
        lectureCredits: 3.0,
        labCredits: 0.0,
        courseType: 'CORE'
      },
      mockAdmin
    );
    cse101Id = cse101.id;

    const cse201 = await createUniversityCourse(
      'green-university',
      {
        programId: progId,
        code: 'EEE-201-T',
        title: 'Electronic Circuits',
        creditHours: 3.0,
        lectureCredits: 3.0,
        labCredits: 0.0,
        courseType: 'CORE',
        prerequisiteCourseIds: [cse101.id]
      },
      mockAdmin
    );
    cse201Id = cse201.id;

    const cse302 = await createUniversityCourse(
      'green-university',
      {
        programId: progId,
        code: 'EEE-302-T',
        title: 'Microprocessor Systems & Interfacing',
        creditHours: 4.0,
        lectureCredits: 3.0,
        labCredits: 1.0,
        courseType: 'CORE',
        prerequisiteCourseIds: [cse201.id]
      },
      mockAdmin
    );
    cse302Id = cse302.id;

    expect(cse101.creditHours).toBe(3.0);
    expect(cse302.labCredits).toBe(1.0);
  });

  it('creates OBE Curriculum and Curriculum Versions with structured semester course maps', async () => {
    const curr = await createCurriculum(
      'green-university',
      {
        programId: progId,
        name: 'BSc in EEE OBE Curriculum 2026',
        code: 'CURR-EEE-2026-TEST'
      },
      mockAdmin
    );
    currId = curr.id;

    const currVersion = await createCurriculumVersion(
      'green-university',
      {
        curriculumId: curr.id,
        versionCode: '2026-V1.0-TEST',
        totalCredits: 140.0,
        minCgpa: 2.25,
        status: 'ACTIVE',
        courses: [
          { courseId: cse101Id, semesterNumber: 1, isRequired: true, minGradePoint: 2.0 },
          { courseId: cse201Id, semesterNumber: 2, isRequired: true, minGradePoint: 2.0 },
          { courseId: cse302Id, semesterNumber: 3, isRequired: true, minGradePoint: 2.0 }
        ]
      },
      mockAdmin
    );

    expect(currVersion).toBeDefined();
    expect(currVersion.versionCode).toBe('2026-V1.0-TEST');
    expect(currVersion.courses.length).toBe(3);
    expect(currVersion.courses.some((c) => c.semesterNumber === 1)).toBe(true);
  });

  it('creates a Course Offering section and enrolls a student', async () => {
    const offering = await createCourseOffering(
      'green-university',
      {
        courseId: cse101Id,
        sessionId: testSessionId,
        sectionName: 'Section 01 - Morning',
        capacity: 45,
        status: 'OPEN'
      },
      mockAdmin
    );

    expect(offering).toBeDefined();
    expect(offering.sectionName).toBe('Section 01 - Morning');

    // Register Student for course
    const reg = await registerStudentCourse(
      'green-university',
      {
        studentId: testStudentId,
        courseId: cse101Id,
        semester: 'Spring 2026'
      },
      mockAdmin
    );

    expect(reg).toBeDefined();
    expect(reg.status).toBe('ENROLLED');
  });

  it('enforces prerequisite validation: student cannot register for EEE-201 without passing EEE-101', async () => {
    await expect(
      registerStudentCourse(
        'green-university',
        {
          studentId: testStudentId,
          courseId: cse201Id, // Requires EEE-101 to be COMPLETED with passing grade
          semester: 'Spring 2026'
        },
        mockAdmin
      )
    ).rejects.toThrow(/Prerequisite not satisfied/);
  });
});
