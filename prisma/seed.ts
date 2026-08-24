import { seedProductionQA } from "../scripts/seed-production-qa";
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth/password';
import { PRESET_DEMO_TENANTS } from '../lib/constants';
import { SaasPlanService } from '../lib/services/saas-plan.service';

async function main() {
  await seedProductionQA();

  console.log('Seeding Comprehensive EduERP Academic Operating Engine...');

  const defaultPasswordHash = hashPassword('Admin@123456');

  // 1. Seed SaaS Subscription Plans & Payment Gateways
  await SaasPlanService.seedInitialPlans();

  // 2. Global Platform Super Admin
  await db.user.upsert({
    where: { email: 'admin@eduerp.us' },
    update: {},
    create: {
      email: 'admin@eduerp.us',
      passwordHash: defaultPasswordHash,
      name: 'Platform Super Admin',
      role: 'PLATFORM_SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  await db.timetableEntry.deleteMany();
  await db.period.deleteMany();
  await db.classroom.deleteMany();
  await db.building.deleteMany();
  await db.shift.deleteMany();
  await db.marksEntry.deleteMany();
  await db.exam.deleteMany();
  await db.paymentAllocation.deleteMany();
  await db.paymentTransaction.deleteMany();
  await db.invoice.deleteMany();
  await db.courseOffering.deleteMany();
  await db.curriculumCourse.deleteMany();
  await db.curriculumVersion.deleteMany();
  await db.curriculum.deleteMany();
  await db.coursePrerequisite.deleteMany();
  await db.courseRegistration.deleteMany();
  await db.course.deleteMany();
  await db.program.deleteMany();
  await db.department.deleteMany();
  await db.faculty.deleteMany();
  await db.hifzDailyRecord.deleteMany();
  await db.studentGuardian.deleteMany();
  await db.studentSubjectRegistration.deleteMany();
  await db.enrollment.deleteMany();
  await db.student.deleteMany();
  await db.guardian.deleteMany();
  await db.subjectCombinationTemplate.deleteMany();
  await db.academicGroup.deleteMany();
  await db.subject.deleteMany();
  await db.section.deleteMany();
  await db.admissionTestAttempt.deleteMany();
  await db.admissionApplication.deleteMany();
  await db.admissionTest.deleteMany();
  await db.class.deleteMany();
  await db.technologyTrade.deleteMany();
  await db.academicCalendarEvent.deleteMany();
  await db.session.deleteMany();
  await db.academicYear.deleteMany();

  // 3. Seed Preset Institutions
  for (const preset of PRESET_DEMO_TENANTS) {
    const tenant = await db.tenant.upsert({
      where: { slug: preset.slug },
      update: {},
      create: {
        slug: preset.slug,
        institutionType: preset.type,
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
        isDemoTenant: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: preset.name,
        shortName: preset.shortName,
        eiin: preset.eiin,
        boardAffiliation: preset.board,
        address: preset.address,
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Motijheel',
        phone: '+880 2-9568123',
        email: `info@${preset.slug}.edu.bd`,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        principalHeadName: preset.headName,
        principalHeadTitle: preset.headTitle
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
        name: `${preset.shortName} Main Campus`,
        code: 'CMP-MAIN',
        type: 'Main Campus',
        address: preset.address,
        isMain: true
      }
    });

    // Seed Shifts
    const morningShift = await db.shift.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: 'SFT-MORN'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'Morning Shift',
        code: 'SFT-MORN',
        startTime: '07:30',
        endTime: '12:30',
        breakStartTime: '10:00',
        breakEndTime: '10:30',
        isActive: true
      }
    });

    // Seed Buildings & Classrooms
    const building = await db.building.upsert({
      where: {
        campusId_code: {
          campusId: campus.id,
          code: 'BLD-MAIN'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        campusId: campus.id,
        name: 'Main Academic Complex',
        code: 'BLD-MAIN',
        totalFloors: 6
      }
    });

    const room201 = await db.classroom.create({
      data: {
        campusId: campus.id,
        buildingId: building.id,
        floorNumber: 2,
        roomNumber: 'Room 201',
        capacity: 45,
        type: 'CLASSROOM',
        hasProjector: true,
        hasAirConditioner: true
      }
    });

    const roomLab = await db.classroom.create({
      data: {
        campusId: campus.id,
        buildingId: building.id,
        floorNumber: 3,
        roomNumber: 'Science Lab 1',
        capacity: 40,
        type: 'LAB',
        hasProjector: true,
        hasAirConditioner: true
      }
    });

    // Seed Periods
    const p1 = await db.period.create({
      data: {
        institutionId: institution.id,
        campusId: campus.id,
        shiftId: morningShift.id,
        periodNumber: 1,
        name: 'Period 1',
        startTime: '08:00',
        endTime: '08:45',
        isBreak: false
      }
    });

    const p2 = await db.period.create({
      data: {
        institutionId: institution.id,
        campusId: campus.id,
        shiftId: morningShift.id,
        periodNumber: 2,
        name: 'Period 2',
        startTime: '08:45',
        endTime: '09:30',
        isBreak: false
      }
    });

    const p3 = await db.period.create({
      data: {
        institutionId: institution.id,
        campusId: campus.id,
        shiftId: morningShift.id,
        periodNumber: 3,
        name: 'Period 3',
        startTime: '09:30',
        endTime: '10:15',
        isBreak: false
      }
    });

    // Seed Academic Year & Session
    const academicYear = await db.academicYear.upsert({
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
        admissionStartDate: new Date('2025-11-01'),
        admissionEndDate: new Date('2025-12-31'),
        classStartDate: new Date('2026-01-10'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });

    const session = await db.session.create({
      data: {
        academicYearId: academicYear.id,
        name: preset.type === 'UNIVERSITY' ? 'Spring 2026' : 'Annual Term 2026',
        type: preset.type === 'UNIVERSITY' ? 'SEMESTER' : 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });

    // Seed Academic Groups
    const sciGroup = await db.academicGroup.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: 'SCI'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'Science',
        code: 'SCI',
        description: 'Science Stream with Physics, Chemistry, Biology & Higher Math'
      }
    });

    // Seed Calendar Events
    await db.academicCalendarEvent.create({
      data: {
        institutionId: institution.id,
        title: 'Midterm Examination 2026',
        eventType: 'EXAM',
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-25'),
        isHoliday: false
      }
    });

    await db.academicCalendarEvent.create({
      data: {
        institutionId: institution.id,
        title: 'Eid-ul-Fitr Holiday',
        eventType: 'HOLIDAY',
        startDate: new Date('2026-03-28'),
        endDate: new Date('2026-04-05'),
        isHoliday: true
      }
    });

    // ---------------------------------------------
    // VERTICAL 1: SCHOOL (Classes, Sections, Subjects, Students, Timetable)
    // ---------------------------------------------
    if (preset.type === 'SCHOOL' || preset.type === 'COLLEGE' || preset.type === 'SCHOOL_AND_COLLEGE') {
      const cls = await db.class.create({
        data: {
          institutionId: institution.id,
          name: preset.type === 'COLLEGE' ? 'Class XI' : 'Grade 10',
          numericValue: preset.type === 'COLLEGE' ? 11 : 10,
          sequence: preset.type === 'COLLEGE' ? 11 : 10,
          stage: preset.type === 'COLLEGE' ? 'HIGHER_SECONDARY' : 'SECONDARY',
          shift: 'Morning'
        }
      });

      const section = await db.section.create({
        data: {
          classId: cls.id,
          name: 'Green (Science)',
          group: 'Science',
          capacity: 40
        }
      });

      const sub1 = await db.subject.create({
        data: {
          classId: cls.id,
          name: 'Bangla 1st Paper',
          code: '101',
          type: 'COMPULSORY',
          fullMarks: 100,
          passMarks: 33,
          theoryMarks: 70,
          assignmentMarks: 20,
          attendanceMarks: 10
        }
      });

      const sub2 = await db.subject.create({
        data: {
          classId: cls.id,
          name: 'Higher Mathematics',
          code: '126',
          type: 'ELECTIVE',
          fullMarks: 100,
          passMarks: 33,
          theoryMarks: 50,
          practicalMarks: 25,
          assignmentMarks: 15,
          attendanceMarks: 10
        }
      });

      // Subject Combination for College
      if (preset.type === 'COLLEGE') {
        await db.subjectCombinationTemplate.create({
          data: {
            institutionId: institution.id,
            groupId: sciGroup.id,
            name: 'HSC Science - Higher Math (Compulsory) & Biology (4th)',
            code: 'HSC-SCI-01',
            compulsorySubjectCodes: JSON.stringify(['101', '107', '174', '176']),
            electiveSubjectCodes: JSON.stringify(['126']),
            fourthSubjectChoices: JSON.stringify(['178']),
            practicalSubjectCodes: JSON.stringify(['174', '176', '126', '178'])
          }
        });
      }

      // Guardian & Student
      const guardian = await db.guardian.create({
        data: {
          fatherName: 'Mahmudur Rahman',
          fatherPhone: '+880 1711-234567',
          fatherProfession: 'Engineer',
          motherName: 'Rokeya Begum',
          guardianName: 'Mahmudur Rahman',
          guardianPhone: '+880 1711-234567',
          guardianRelation: 'Father'
        }
      });

      const student = await db.student.create({
        data: {
          campusId: campus.id,
          studentIdNumber: `${preset.shortName}-2026-0101`,
          admissionNumber: 'ADM-2026-0101',
          rollNumber: '01',
          firstName: 'Tahmid',
          lastName: 'Rahman',
          dateOfBirth: new Date('2009-04-15'),
          gender: 'Male',
          bloodGroup: 'B+',
          religion: 'Islam',
          presentAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
          permanentAddress: 'Village: Joypurhat Sadar',
          phone: '+880 1711-987654',
          email: `tahmid.rahman@${preset.slug}.edu.bd`,
          sectionId: section.id,
          guardianId: guardian.id,
          status: 'ACTIVE'
        }
      });

      await db.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          relationshipType: 'PRIMARY',
          isPrimary: true
        }
      });

      // Timetable Routine Entries (Conflict Free)
      await db.timetableEntry.create({
        data: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          sessionId: session.id,
          campusId: campus.id,
          sectionId: section.id,
          periodId: p1.id,
          classroomId: room201.id,
          dayOfWeek: 'SUNDAY',
          startTime: '08:00',
          endTime: '08:45',
          subjectName: 'Bangla 1st Paper',
          teacherName: 'Nazmul Haque'
        }
      });

      await db.timetableEntry.create({
        data: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          sessionId: session.id,
          campusId: campus.id,
          sectionId: section.id,
          periodId: p2.id,
          classroomId: room201.id,
          dayOfWeek: 'SUNDAY',
          startTime: '08:45',
          endTime: '09:30',
          subjectName: 'Higher Mathematics',
          teacherName: 'Tariqul Islam'
        }
      });

      await db.timetableEntry.create({
        data: {
          institutionId: institution.id,
          academicYearId: academicYear.id,
          sessionId: session.id,
          campusId: campus.id,
          sectionId: section.id,
          periodId: p3.id,
          classroomId: roomLab.id,
          dayOfWeek: 'SUNDAY',
          startTime: '09:30',
          endTime: '10:15',
          subjectName: 'Physics Practical Lab',
          teacherName: 'Dr. Rafiqul Islam'
        }
      });

      // Invoice
      await db.invoice.create({
        data: {
          studentId: student.id,
          invoiceNumber: `INV-${preset.shortName}-2026-0091`,
          title: 'Monthly Tuition & Lab Fee - August 2026',
          subTotal: 3500,
          discountAmount: 0,
          fineAmount: 0,
          totalAmount: 3500,
          paidAmount: 3500,
          dueAmount: 0,
          dueDate: new Date('2026-08-20'),
          status: 'PAID'
        }
      });

      // Exam & Marks
      const exam = await db.exam.create({
        data: {
          sessionId: session.id,
          name: 'Midterm Examination 2026',
          type: 'MIDTERM',
          startDate: new Date('2026-06-10'),
          endDate: new Date('2026-06-25'),
          isPublished: true
        }
      });

      await db.marksEntry.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          subjectId: sub1.id,
          theoryMarks: 62,
          assignmentMarks: 18,
          attendanceMarks: 9,
          totalMarks: 89,
          letterGrade: 'A+',
          gradePoint: 5.0,
          status: 'PASS'
        }
      });

      await db.marksEntry.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          subjectId: sub2.id,
          theoryMarks: 45,
          practicalMarks: 24,
          assignmentMarks: 14,
          attendanceMarks: 9,
          totalMarks: 92,
          letterGrade: 'A+',
          gradePoint: 5.0,
          status: 'PASS'
        }
      });
    }

    // ---------------------------------------------
    // VERTICAL 2: UNIVERSITY (Faculty, Department, Program, Curriculum, Course Offerings)
    // ---------------------------------------------
    if (preset.type === 'UNIVERSITY') {
      const faculty = await db.faculty.create({
        data: {
          institutionId: institution.id,
          name: 'Faculty of Science and Engineering',
          code: 'FSE',
          deanName: 'Prof. Dr. M. A. Sobhan'
        }
      });

      const dept = await db.department.create({
        data: {
          institutionId: institution.id,
          facultyId: faculty.id,
          name: 'Computer Science and Engineering',
          code: 'CSE',
          headName: 'Prof. Dr. Shamim Hossain'
        }
      });

      const prog = await db.program.create({
        data: {
          departmentId: dept.id,
          name: 'Bachelor of Science in CSE',
          code: 'BSC-CSE',
          degreeLevel: 'BACHELOR',
          durationYears: 4.0,
          totalCredits: 144
        }
      });

      const cse101 = await db.course.create({
        data: {
          programId: prog.id,
          code: 'CSE-101',
          title: 'Introduction to Computer Science & Python',
          creditHours: 3.0,
          lectureCredits: 3.0,
          labCredits: 0.0,
          courseType: 'CORE'
        }
      });

      const cse201 = await db.course.create({
        data: {
          programId: prog.id,
          code: 'CSE-201',
          title: 'Data Structures and Algorithms',
          creditHours: 3.0,
          lectureCredits: 3.0,
          labCredits: 0.0,
          courseType: 'CORE'
        }
      });

      const cse302 = await db.course.create({
        data: {
          programId: prog.id,
          code: 'CSE-302',
          title: 'Advanced Algorithms and Graph Theory',
          creditHours: 3.0,
          lectureCredits: 3.0,
          labCredits: 0.0,
          courseType: 'CORE'
        }
      });

      // Prerequisite: CSE-302 requires CSE-201
      await db.coursePrerequisite.create({
        data: {
          courseId: cse302.id,
          prerequisiteCourseId: cse201.id,
          minGradePoint: 2.0
        }
      });

      // Seed Curriculum & Versioning
      const curr = await db.curriculum.create({
        data: {
          institutionId: institution.id,
          programId: prog.id,
          name: 'BSc in CSE OBE Curriculum 2026',
          code: 'CURR-CSE-2026'
        }
      });

      await db.curriculumVersion.create({
        data: {
          curriculumId: curr.id,
          versionCode: '2026-V1.0',
          totalCredits: 144.0,
          minCgpa: 2.00,
          status: 'ACTIVE',
          courses: {
            create: [
              { courseId: cse101.id, semesterNumber: 1, isRequired: true, minGradePoint: 2.00 },
              { courseId: cse201.id, semesterNumber: 2, isRequired: true, minGradePoint: 2.00 },
              { courseId: cse302.id, semesterNumber: 3, isRequired: true, minGradePoint: 2.00 }
            ]
          }
        }
      });

      // Seed Course Offering
      await db.courseOffering.create({
        data: {
          courseId: cse101.id,
          sessionId: session.id,
          sectionName: 'Section 01',
          classroomId: room201.id,
          capacity: 45,
          enrolledCount: 1,
          scheduleJson: JSON.stringify([{ dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '11:30' }]),
          status: 'OPEN'
        }
      });
    }

    // ---------------------------------------------
    // VERTICAL 3: MADRASHA (Madrasha Level, Hifz Recitations)
    // ---------------------------------------------
    if (preset.type === 'MADRASHA') {
      const clsDakhil = await db.class.create({
        data: {
          institutionId: institution.id,
          name: 'Dakhil 9th',
          numericValue: 9,
          sequence: 9,
          stage: 'DAKHIL',
          shift: 'Morning'
        }
      });

      const dakhilSec = await db.section.create({
        data: {
          classId: clsDakhil.id,
          name: 'Section Al-Farooq',
          group: 'General',
          capacity: 40
        }
      });

      await db.subject.create({
        data: {
          classId: clsDakhil.id,
          name: 'Quran Mazid & Tajweed',
          code: 'MAD-101',
          type: 'COMPULSORY',
          fullMarks: 100,
          passMarks: 33,
          theoryMarks: 80,
          attendanceMarks: 20
        }
      });

      await db.subject.create({
        data: {
          classId: clsDakhil.id,
          name: 'Hadith Sharif & Usul-ul-Hadith',
          code: 'MAD-102',
          type: 'COMPULSORY',
          fullMarks: 100,
          passMarks: 33,
          theoryMarks: 80,
          attendanceMarks: 20
        }
      });

      const guardianHifz = await db.guardian.create({
        data: {
          fatherName: 'Maulana Hafizullah',
          fatherPhone: '+880 1819-334455',
          motherName: 'Ayesha Khatun',
          guardianName: 'Maulana Hafizullah',
          guardianPhone: '+880 1819-334455'
        }
      });

      const hifzStudent = await db.student.create({
        data: {
          campusId: campus.id,
          studentIdNumber: 'AIMC-2026-0001',
          admissionNumber: 'ADM-HIFZ-001',
          rollNumber: '01',
          firstName: 'Abdullah',
          lastName: 'Al Mamun',
          dateOfBirth: new Date('2013-05-10'),
          gender: 'Male',
          bloodGroup: 'O+',
          religion: 'Islam',
          presentAddress: 'Complex Dormitory Room 204, Uttara, Dhaka',
          permanentAddress: 'Chittagong, Bangladesh',
          phone: '+880 1819-334455',
          sectionId: dakhilSec.id,
          guardianId: guardianHifz.id,
          status: 'ACTIVE'
        }
      });

      await db.hifzDailyRecord.create({
        data: {
          studentId: hifzStudent.id,
          date: new Date(),
          sabakPara: 18,
          sabakSurah: 'Surah Al-Muminum',
          sabakAyatStart: 1,
          sabakAyatEnd: 25,
          sabakGrade: 'Excellent',
          sabkiPara: 17,
          sabkiPages: 5,
          sabkiGrade: 'Very Good',
          dourParaStart: 1,
          dourParaEnd: 5,
          dourGrade: 'Excellent',
          totalParasMemorized: 17.5,
          teacherNotes: 'MashaAllah excellent Makhraj and Tajweed precision.',
          evaluatedBy: 'Ustad Hafiz Qari Nurul Islam'
        }
      });
    }

    // ---------------------------------------------
    // VERTICAL 4: POLYTECHNIC / VOCATIONAL (Technology Trades & Workshop Logbook)
    // ---------------------------------------------
    const cmtTrade = await db.technologyTrade.create({
      data: {
        institutionId: institution.id,
        name: 'Computer Technology',
        code: 'CMT',
        btebCode: '685',
        durationSemesters: 8,
        description: 'BTEB 4-Year Diploma in Computer Technology'
      }
    });

    const etTrade = await db.technologyTrade.create({
      data: {
        institutionId: institution.id,
        name: 'Electrical Technology',
        code: 'ET',
        btebCode: '667',
        durationSemesters: 8,
        description: 'BTEB 4-Year Diploma in Electrical Technology'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
