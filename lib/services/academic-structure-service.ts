import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import {
  AcademicYearCreateSchema,
  AcademicSessionCreateSchema,
  ShiftCreateSchema,
  AcademicGroupCreateSchema,
  SubjectCombinationSchema,
  SchoolClassCreateSchema,
  SchoolSectionCreateSchema,
  SchoolSubjectCreateSchema,
  FacultyCreateSchema,
  DepartmentCreateSchema,
  ProgramCreateSchema,
  BatchCreateSchema,
  UniversityCourseCreateSchema,
  CourseOfferingCreateSchema,
  CurriculumCreateSchema,
  CurriculumVersionCreateSchema,
  BuildingCreateSchema,
  ClassroomCreateSchema,
  PeriodCreateSchema,
  TeacherAvailabilitySchema,
  TeacherAssignmentSchema,
  TechnologyTradeCreateSchema,
  WorkshopLogCreateSchema,
  IndustrialAttachmentCreateSchema,
  CalendarEventCreateSchema
} from '../validations/schemas';

/**
 * Aggregates complete academic structure hierarchy for the tenant.
 */
export async function getTenantAcademicStructure(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const [
    academicYears,
    campuses,
    shifts,
    groups,
    combinations,
    classes,
    faculties,
    departments,
    programs,
    curriculums,
    buildings,
    rooms,
    periods,
    trades,
    calendarEvents
  ] = await Promise.all([
    db.academicYear.findMany({
      where: { institutionId: tenant.institutionId },
      include: { sessions: true },
      orderBy: { startDate: 'desc' }
    }),
    db.campus.findMany({
      where: { institutionId: tenant.institutionId },
      orderBy: { name: 'asc' }
    }),
    db.shift.findMany({
      where: { institutionId: tenant.institutionId },
      orderBy: { startTime: 'asc' }
    }),
    db.academicGroup.findMany({
      where: { institutionId: tenant.institutionId },
      include: { combinations: true }
    }),
    db.subjectCombinationTemplate.findMany({
      where: { institutionId: tenant.institutionId }
    }),
    db.class.findMany({
      where: { institutionId: tenant.institutionId },
      include: {
        sections: true,
        subjects: true
      },
      orderBy: { sequence: 'asc' }
    }),
    db.faculty.findMany({
      where: { institutionId: tenant.institutionId },
      include: { departments: true }
    }),
    db.department.findMany({
      where: { institutionId: tenant.institutionId },
      include: {
        programs: {
          include: {
            courses: true,
            batches: true
          }
        }
      }
    }),
    db.program.findMany({
      where: { department: { institutionId: tenant.institutionId } },
      include: {
        courses: {
          include: {
            prerequisitesMain: { include: { prerequisiteCourse: true } }
          }
        },
        curriculums: {
          include: {
            versions: {
              include: { courses: { include: { course: true } } }
            }
          }
        }
      }
    }),
    db.curriculum.findMany({
      where: { institutionId: tenant.institutionId },
      include: {
        versions: {
          include: { courses: { include: { course: true } } }
        }
      }
    }),
    db.building.findMany({
      where: { institutionId: tenant.institutionId },
      include: { rooms: true }
    }),
    db.classroom.findMany({
      where: { campus: { institutionId: tenant.institutionId } }
    }),
    db.period.findMany({
      where: { institutionId: tenant.institutionId },
      orderBy: { periodNumber: 'asc' }
    }),
    db.technologyTrade.findMany({
      where: { institutionId: tenant.institutionId }
    }),
    db.academicCalendarEvent.findMany({
      where: { institutionId: tenant.institutionId },
      orderBy: { startDate: 'asc' }
    })
  ]);

  return {
    academicYears,
    campuses,
    shifts,
    groups,
    combinations,
    classes,
    faculties,
    departments,
    programs,
    curriculums,
    buildings,
    rooms,
    periods,
    trades,
    calendarEvents
  };
}

// ----------------------------------------------------
// Academic Year & Session Management
// ----------------------------------------------------

export async function createAcademicYear(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AcademicYearCreateSchema.parse(rawData);

  const existing = await db.academicYear.findFirst({
    where: { institutionId: tenant.institutionId, name: validated.name }
  });
  if (existing) {
    throw AppError.conflict(`Academic Year '${validated.name}' already exists.`);
  }

  // If marked as isCurrent, unmark previous active years
  if (validated.isCurrent) {
    await db.academicYear.updateMany({
      where: { institutionId: tenant.institutionId, isCurrent: true },
      data: { isCurrent: false }
    });
  }

  const academicYear = await db.academicYear.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code || `AY-${validated.name}`,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      admissionStartDate: validated.admissionStartDate ? new Date(validated.admissionStartDate) : null,
      admissionEndDate: validated.admissionEndDate ? new Date(validated.admissionEndDate) : null,
      classStartDate: validated.classStartDate ? new Date(validated.classStartDate) : null,
      status: validated.status || 'ACTIVE',
      isCurrent: validated.isCurrent
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_YEAR_CREATED',
    resourceType: 'AcademicYear',
    resourceId: academicYear.id,
    newState: { name: academicYear.name, status: academicYear.status }
  });

  return academicYear;
}

export async function createAcademicSession(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AcademicSessionCreateSchema.parse(rawData);

  const year = await db.academicYear.findFirst({
    where: { id: validated.academicYearId, institutionId: tenant.institutionId }
  });
  if (!year) throw AppError.notFound('Academic Year not found.');

  const session = await db.session.create({
    data: {
      academicYearId: year.id,
      name: validated.name,
      type: validated.type,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      registrationStartDate: validated.registrationStartDate ? new Date(validated.registrationStartDate) : null,
      registrationEndDate: validated.registrationEndDate ? new Date(validated.registrationEndDate) : null,
      addDropDeadline: validated.addDropDeadline ? new Date(validated.addDropDeadline) : null,
      examStartDate: validated.examStartDate ? new Date(validated.examStartDate) : null,
      examEndDate: validated.examEndDate ? new Date(validated.examEndDate) : null,
      resultPublishDate: validated.resultPublishDate ? new Date(validated.resultPublishDate) : null,
      status: validated.status,
      isCurrent: validated.isCurrent
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_SESSION_CREATED',
    resourceType: 'Session',
    resourceId: session.id,
    newState: { name: session.name, type: session.type }
  });

  return session;
}

// ----------------------------------------------------
// Shift & Group Management
// ----------------------------------------------------

export async function createShift(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ShiftCreateSchema.parse(rawData);

  const shift = await db.shift.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      startTime: validated.startTime,
      endTime: validated.endTime,
      breakStartTime: validated.breakStartTime || null,
      breakEndTime: validated.breakEndTime || null,
      applicableLevel: validated.applicableLevel || null,
      isActive: validated.isActive
    }
  });

  return shift;
}

export async function createAcademicGroup(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AcademicGroupCreateSchema.parse(rawData);

  return db.academicGroup.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      description: validated.description || null
    }
  });
}

export async function createSubjectCombination(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = SubjectCombinationSchema.parse(rawData);

  return db.subjectCombinationTemplate.create({
    data: {
      institutionId: tenant.institutionId,
      groupId: validated.groupId,
      name: validated.name,
      code: validated.code,
      compulsorySubjectCodes: JSON.stringify(validated.compulsorySubjectCodes),
      electiveSubjectCodes: JSON.stringify(validated.electiveSubjectCodes),
      fourthSubjectChoices: JSON.stringify(validated.fourthSubjectChoices),
      practicalSubjectCodes: validated.practicalSubjectCodes ? JSON.stringify(validated.practicalSubjectCodes) : null
    }
  });
}

// ----------------------------------------------------
// School Class, Section & Subject Management
// ----------------------------------------------------

export async function createSchoolClass(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = SchoolClassCreateSchema.parse(rawData);

  const existing = await db.class.findFirst({
    where: {
      institutionId: tenant.institutionId,
      name: validated.name,
      shift: validated.shift
    }
  });
  if (existing) throw AppError.conflict(`Class '${validated.name}' (${validated.shift} shift) already exists.`);

  return db.class.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      numericValue: validated.numericValue,
      sequence: validated.sequence,
      stage: validated.stage || null,
      promotionTargetClass: validated.promotionTargetClass || null,
      shift: validated.shift
    }
  });
}

export async function createSchoolSection(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = SchoolSectionCreateSchema.parse(rawData);

  const cls = await db.class.findFirst({
    where: { id: validated.classId, institutionId: tenant.institutionId }
  });
  if (!cls) throw AppError.notFound('Class not found.');

  return db.section.create({
    data: {
      classId: cls.id,
      name: validated.name,
      group: validated.group || null,
      roomNumber: validated.roomNumber || null,
      capacity: validated.capacity
    }
  });
}

export async function createSchoolSubject(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = SchoolSubjectCreateSchema.parse(rawData);

  const cls = await db.class.findFirst({
    where: { id: validated.classId, institutionId: tenant.institutionId }
  });
  if (!cls) throw AppError.notFound('Class not found.');

  return db.subject.create({
    data: {
      classId: cls.id,
      name: validated.name,
      code: validated.code,
      type: validated.type,
      fullMarks: validated.fullMarks,
      passMarks: validated.passMarks,
      theoryMarks: validated.theoryMarks,
      practicalMarks: validated.practicalMarks,
      assignmentMarks: validated.assignmentMarks,
      attendanceMarks: validated.attendanceMarks
    }
  });
}

// ----------------------------------------------------
// University Faculty, Department, Program & Course Management
// ----------------------------------------------------

export async function createFaculty(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FacultyCreateSchema.parse(rawData);

  return db.faculty.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      deanName: validated.deanName || null
    }
  });
}

export async function createDepartment(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = DepartmentCreateSchema.parse(rawData);

  return db.department.create({
    data: {
      institutionId: tenant.institutionId,
      facultyId: validated.facultyId || null,
      name: validated.name,
      code: validated.code,
      headName: validated.headName || null
    }
  });
}

export async function createProgram(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ProgramCreateSchema.parse(rawData);

  const dept = await db.department.findFirst({
    where: { id: validated.departmentId, institutionId: tenant.institutionId }
  });
  if (!dept) throw AppError.notFound('Department not found.');

  return db.program.create({
    data: {
      departmentId: dept.id,
      name: validated.name,
      code: validated.code,
      degreeLevel: validated.degreeLevel,
      durationYears: validated.durationYears,
      totalCredits: validated.totalCredits || null
    }
  });
}

export async function createUniversityCourse(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = UniversityCourseCreateSchema.parse(rawData);

  const prog = await db.program.findFirst({
    where: { id: validated.programId, department: { institutionId: tenant.institutionId } }
  });
  if (!prog) throw AppError.notFound('Program not found.');

  const course = await db.course.create({
    data: {
      programId: prog.id,
      code: validated.code,
      title: validated.title,
      creditHours: validated.creditHours,
      lectureCredits: validated.lectureCredits,
      labCredits: validated.labCredits,
      courseType: validated.courseType
    }
  });

  if (validated.prerequisiteCourseIds && validated.prerequisiteCourseIds.length > 0) {
    for (const prereqId of validated.prerequisiteCourseIds) {
      await db.coursePrerequisite.create({
        data: {
          courseId: course.id,
          prerequisiteCourseId: prereqId,
          minGradePoint: 2.00
        }
      });
    }
  }

  return course;
}

export async function createCourseOffering(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CourseOfferingCreateSchema.parse(rawData);

  const course = await db.course.findFirst({
    where: { id: validated.courseId, program: { department: { institutionId: tenant.institutionId } } }
  });
  if (!course) throw AppError.notFound('Course not found.');

  const session = await db.session.findFirst({
    where: { id: validated.sessionId, academicYear: { institutionId: tenant.institutionId } }
  });
  if (!session) throw AppError.notFound('Session not found.');

  return db.courseOffering.create({
    data: {
      courseId: course.id,
      sessionId: session.id,
      sectionName: validated.sectionName,
      teacherId: validated.teacherId || null,
      classroomId: validated.classroomId || null,
      capacity: validated.capacity,
      scheduleJson: validated.scheduleJson || null,
      status: validated.status
    }
  });
}

// ----------------------------------------------------
// Curriculum & Curriculum Versioning
// ----------------------------------------------------

export async function createCurriculum(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CurriculumCreateSchema.parse(rawData);

  return db.curriculum.create({
    data: {
      institutionId: tenant.institutionId,
      programId: validated.programId,
      name: validated.name,
      code: validated.code
    }
  });
}

export async function createCurriculumVersion(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CurriculumVersionCreateSchema.parse(rawData);

  const curriculum = await db.curriculum.findFirst({
    where: { id: validated.curriculumId, institutionId: tenant.institutionId }
  });
  if (!curriculum) throw AppError.notFound('Curriculum not found.');

  return db.curriculumVersion.create({
    data: {
      curriculumId: curriculum.id,
      versionCode: validated.versionCode,
      effectiveSessionId: validated.effectiveSessionId || null,
      totalCredits: validated.totalCredits,
      minCgpa: validated.minCgpa,
      status: validated.status,
      courses: {
        create: validated.courses.map((c) => ({
          courseId: c.courseId,
          semesterNumber: c.semesterNumber,
          isRequired: c.isRequired,
          minGradePoint: c.minGradePoint
        }))
      }
    },
    include: {
      courses: {
        include: { course: true }
      }
    }
  });
}

// ----------------------------------------------------
// Facility & Scheduling (Building, Classroom, Period, Teacher Availability)
// ----------------------------------------------------

export async function createBuilding(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BuildingCreateSchema.parse(rawData);

  return db.building.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      name: validated.name,
      code: validated.code,
      totalFloors: validated.totalFloors
    }
  });
}

export async function createClassroom(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ClassroomCreateSchema.parse(rawData);

  return db.classroom.create({
    data: {
      campusId: validated.campusId,
      buildingId: validated.buildingId || null,
      floorNumber: validated.floorNumber || 1,
      roomNumber: validated.roomNumber,
      capacity: validated.capacity,
      type: validated.type,
      hasProjector: validated.hasProjector,
      hasAirConditioner: validated.hasAirConditioner
    }
  });
}

export async function createPeriod(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PeriodCreateSchema.parse(rawData);

  return db.period.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId || null,
      shiftId: validated.shiftId || null,
      periodNumber: validated.periodNumber,
      name: validated.name,
      startTime: validated.startTime,
      endTime: validated.endTime,
      isBreak: validated.isBreak
    }
  });
}

export async function setTeacherAvailability(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TeacherAvailabilitySchema.parse(rawData);

  return db.teacherAvailability.create({
    data: {
      teacherId: validated.teacherId,
      dayOfWeek: validated.dayOfWeek,
      periodId: validated.periodId || null,
      startTime: validated.startTime || null,
      endTime: validated.endTime || null,
      isAvailable: validated.isAvailable,
      reason: validated.reason || null
    }
  });
}

// ----------------------------------------------------
// Polytechnic & Vocational Models
// ----------------------------------------------------

export async function createTechnologyTrade(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TechnologyTradeCreateSchema.parse(rawData);

  return db.technologyTrade.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      btebCode: validated.btebCode || null,
      durationSemesters: validated.durationSemesters,
      description: validated.description || null
    }
  });
}

export async function recordWorkshopLog(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = WorkshopLogCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } }
  });
  if (!student) throw AppError.notFound('Student not found.');

  return db.workshopLogEntry.create({
    data: {
      studentId: student.id,
      date: new Date(validated.date),
      taskTitle: validated.taskTitle,
      instructorName: validated.instructorName,
      completionStatus: validated.completionStatus,
      score: validated.score || null,
      teacherRemarks: validated.teacherRemarks || null
    }
  });
}

export async function recordIndustrialAttachment(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = IndustrialAttachmentCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } }
  });
  if (!student) throw AppError.notFound('Student not found.');

  return db.industrialAttachment.create({
    data: {
      studentId: student.id,
      organizationName: validated.organizationName,
      supervisorName: validated.supervisorName,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      evaluationScore: validated.evaluationScore || null,
      reportStatus: validated.reportStatus
    }
  });
}

// ----------------------------------------------------
// Calendar & Academic Events
// ----------------------------------------------------

export async function createAcademicCalendarEvent(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CalendarEventCreateSchema.parse(rawData);

  return db.academicCalendarEvent.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId || null,
      title: validated.title,
      eventType: validated.eventType,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      description: validated.description || null,
      isHoliday: validated.isHoliday
    }
  });
}

// ----------------------------------------------------
// Duplicate Next-Year Setup Helper (Phase 64)
// ----------------------------------------------------

export async function duplicateAcademicYearStructure(
  tenantIdentifier: string,
  sourceYearId: string,
  newYearName: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const sourceYear = await db.academicYear.findFirst({
    where: { id: sourceYearId, institutionId: tenant.institutionId },
    include: {
      sessions: true
    }
  });

  if (!sourceYear) throw AppError.notFound('Source academic year not found.');

  const existing = await db.academicYear.findFirst({
    where: { institutionId: tenant.institutionId, name: newYearName }
  });
  if (existing) throw AppError.conflict(`Academic year '${newYearName}' already exists.`);

  const startYear = parseInt(newYearName.split('-')[0], 10) || 2027;
  const newStartDate = new Date(`${startYear}-01-01`);
  const newEndDate = new Date(`${startYear}-12-31`);

  const newYear = await db.academicYear.create({
    data: {
      institutionId: tenant.institutionId,
      name: newYearName,
      code: `AY-${newYearName}`,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'DRAFT',
      isCurrent: false,
      sessions: {
        create: sourceYear.sessions.map((s) => ({
          name: s.name.replace(/\d{4}/g, startYear.toString()),
          type: s.type,
          startDate: newStartDate,
          endDate: newEndDate,
          status: 'DRAFT',
          isCurrent: false
        }))
      }
    },
    include: {
      sessions: true
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_YEAR_DUPLICATED',
    resourceType: 'AcademicYear',
    resourceId: newYear.id,
    newState: {
      sourceYearName: sourceYear.name,
      newYearName: newYear.name,
      sessionsCreated: newYear.sessions.length
    }
  });

  return newYear;
}
