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

export async function setCurrentAcademicYear(tenantIdentifier: string, academicYearId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.academicYear.findFirst({
    where: { id: academicYearId, institutionId: tenant.institutionId }
  });
  if (!target) throw AppError.notFound('Academic Year not found.');

  await db.academicYear.updateMany({
    where: { institutionId: tenant.institutionId, isCurrent: true },
    data: { isCurrent: false }
  });

  const updated = await db.academicYear.update({
    where: { id: target.id },
    data: { isCurrent: true, status: 'ACTIVE' }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_YEAR_SET_CURRENT',
    resourceType: 'AcademicYear',
    resourceId: target.id,
    newState: { name: target.name, isCurrent: true }
  });

  return updated;
}

export async function updateAcademicYear(tenantIdentifier: string, academicYearId: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.academicYear.findFirst({
    where: { id: academicYearId, institutionId: tenant.institutionId }
  });
  if (!target) throw AppError.notFound('Academic Year not found.');

  if (rawData.isCurrent) {
    await db.academicYear.updateMany({
      where: { institutionId: tenant.institutionId, isCurrent: true },
      data: { isCurrent: false }
    });
  }

  const updated = await db.academicYear.update({
    where: { id: target.id },
    data: {
      name: rawData.name ?? target.name,
      code: rawData.code ?? target.code,
      startDate: rawData.startDate ? new Date(rawData.startDate) : target.startDate,
      endDate: rawData.endDate ? new Date(rawData.endDate) : target.endDate,
      admissionStartDate: rawData.admissionStartDate ? new Date(rawData.admissionStartDate) : target.admissionStartDate,
      admissionEndDate: rawData.admissionEndDate ? new Date(rawData.admissionEndDate) : target.admissionEndDate,
      status: rawData.status ?? target.status,
      isCurrent: rawData.isCurrent ?? target.isCurrent
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_YEAR_UPDATED',
    resourceType: 'AcademicYear',
    resourceId: target.id,
    newState: { name: updated.name, status: updated.status }
  });

  return updated;
}

export async function deleteAcademicYear(tenantIdentifier: string, academicYearId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.academicYear.findFirst({
    where: { id: academicYearId, institutionId: tenant.institutionId }
  });
  if (!target) throw AppError.notFound('Academic Year not found.');

  // Guard against deleting if students or applications are enrolled
  const appCount = await db.admissionApplication.count({ where: { academicYearId: target.id } });
  if (appCount > 0) {
    throw AppError.conflict(`Cannot delete academic year '${target.name}' because ${appCount} admission applications are associated with it.`);
  }

  await db.academicYear.delete({ where: { id: target.id } });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ACADEMIC_YEAR_DELETED',
    resourceType: 'AcademicYear',
    resourceId: target.id,
    newState: { name: target.name }
  });

  return { success: true, message: `Academic Year '${target.name}' deleted successfully.` };
}

export async function deleteSchoolClass(tenantIdentifier: string, classId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.class.findFirst({
    where: { id: classId, institutionId: tenant.institutionId }
  });
  if (!target) throw AppError.notFound('Class not found.');

  await db.class.delete({ where: { id: target.id } });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CLASS_DELETED',
    resourceType: 'Class',
    resourceId: target.id,
    newState: { name: target.name }
  });

  return { success: true, message: `Class '${target.name}' deleted successfully.` };
}

export async function deleteSchoolSection(tenantIdentifier: string, sectionId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.section.findFirst({
    where: { id: sectionId, class: { institutionId: tenant.institutionId } }
  });
  if (!target) throw AppError.notFound('Section not found.');

  await db.section.delete({ where: { id: target.id } });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SECTION_DELETED',
    resourceType: 'Section',
    resourceId: target.id,
    newState: { name: target.name }
  });

  return { success: true, message: `Section '${target.name}' deleted successfully.` };
}

export async function deleteSchoolSubject(tenantIdentifier: string, subjectId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const target = await db.subject.findFirst({
    where: { id: subjectId, class: { institutionId: tenant.institutionId } }
  });
  if (!target) throw AppError.notFound('Subject not found.');

  await db.subject.delete({ where: { id: target.id } });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SUBJECT_DELETED',
    resourceType: 'Subject',
    resourceId: target.id,
    newState: { name: target.name }
  });

  return { success: true, message: `Subject '${target.name}' deleted successfully.` };
}

/**
 * Applies the standard Bangladesh Madrasha Starter Academic Structure Template.
 * Creates an authoritative Academic Year (2026), Sessions, Madrasha Levels (Hifz Beginner/Intermediate/Advanced, Ebtedayee 1-5, Dakhil 6-10),
 * standard sections, and Madrasha curriculum subjects without creating fake students or results.
 */
export async function applyMadrashaStarterTemplate(tenantIdentifier: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const institutionId = tenant.institutionId;

  // 1. Create or Find Academic Year 2026
  let academicYear = await db.academicYear.findFirst({
    where: { institutionId, name: '2026' }
  });

  if (!academicYear) {
    // Unmark any previous active years if needed
    await db.academicYear.updateMany({
      where: { institutionId, isCurrent: true },
      data: { isCurrent: false }
    });

    academicYear = await db.academicYear.create({
      data: {
        institutionId,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        admissionStartDate: new Date('2025-11-01'),
        admissionEndDate: new Date('2026-03-31'),
        classStartDate: new Date('2026-01-10'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });

    // Create default session
    await db.session.create({
      data: {
        academicYearId: academicYear.id,
        name: 'Academic Session 2026',
        type: 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isCurrent: true
      }
    });
  }

  // 2. Ensure Primary Shift exists
  let shift = await db.shift.findFirst({
    where: { institutionId, code: 'SFT-MORN' }
  });
  if (!shift) {
    shift = await db.shift.create({
      data: {
        institutionId,
        name: 'Morning Shift',
        code: 'SFT-MORN',
        startTime: '07:30',
        endTime: '13:00'
      }
    });
  }

  // 3. Madrasha Levels & Classes definitions
  const madrashaClasses = [
    { name: 'Hifz Beginner', numericValue: 1, sequence: 1, stage: 'HIFZ' },
    { name: 'Hifz Intermediate', numericValue: 2, sequence: 2, stage: 'HIFZ' },
    { name: 'Hifz Advanced / Dawra-e-Quran', numericValue: 3, sequence: 3, stage: 'HIFZ' },
    { name: 'Nazera', numericValue: 4, sequence: 4, stage: 'NAZERA' },
    { name: 'Ebtedayee Grade 1', numericValue: 5, sequence: 5, stage: 'EBTEDAYEE' },
    { name: 'Ebtedayee Grade 5', numericValue: 9, sequence: 9, stage: 'EBTEDAYEE' },
    { name: 'Dakhil 6', numericValue: 10, sequence: 10, stage: 'DAKHIL' },
    { name: 'Dakhil 10', numericValue: 14, sequence: 14, stage: 'DAKHIL' }
  ];

  const standardSubjects = [
    { name: 'Quran Mazid & Tajweed', code: 'QRN-101', type: 'COMPULSORY', fullMarks: 100, passMarks: 40, theoryMarks: 50, practicalMarks: 50 },
    { name: 'Hadith Sharif', code: 'HDT-102', type: 'COMPULSORY', fullMarks: 100, passMarks: 40, theoryMarks: 80, practicalMarks: 0 },
    { name: 'Fiqh & Islamic Jurisprudence', code: 'FQH-103', type: 'COMPULSORY', fullMarks: 100, passMarks: 40, theoryMarks: 80, practicalMarks: 0 },
    { name: 'Arabic Language & Grammar', code: 'ARB-104', type: 'COMPULSORY', fullMarks: 100, passMarks: 33, theoryMarks: 70, practicalMarks: 0 },
    { name: 'Bangla Literature', code: 'BNG-105', type: 'COMPULSORY', fullMarks: 100, passMarks: 33, theoryMarks: 70, practicalMarks: 0 },
    { name: 'English Language', code: 'ENG-106', type: 'COMPULSORY', fullMarks: 100, passMarks: 33, theoryMarks: 70, practicalMarks: 0 },
    { name: 'General Mathematics', code: 'MTH-107', type: 'COMPULSORY', fullMarks: 100, passMarks: 33, theoryMarks: 70, practicalMarks: 0 }
  ];

  let classesCreated = 0;
  let sectionsCreated = 0;
  let subjectsCreated = 0;

  for (const cDef of madrashaClasses) {
    let cls = await db.class.findFirst({
      where: { institutionId, name: cDef.name, shift: 'Morning' }
    });

    if (!cls) {
      cls = await db.class.create({
        data: {
          institutionId,
          name: cDef.name,
          numericValue: cDef.numericValue,
          sequence: cDef.sequence,
          stage: cDef.stage,
          shift: 'Morning'
        }
      });
      classesCreated++;
    }

    // Ensure Section A exists
    let section = await db.section.findFirst({
      where: { classId: cls.id, name: 'A' }
    });
    if (!section) {
      await db.section.create({
        data: {
          classId: cls.id,
          name: 'A',
          capacity: 40
        }
      });
      sectionsCreated++;
    }

    // Ensure Subjects exist
    for (const sDef of standardSubjects) {
      const subjectCode = `${sDef.code}-${cls.numericValue}`;
      const sub = await db.subject.findFirst({
        where: { classId: cls.id, code: subjectCode }
      });
      if (!sub) {
        await db.subject.create({
          data: {
            classId: cls.id,
            name: sDef.name,
            code: subjectCode,
            type: sDef.type,
            fullMarks: sDef.fullMarks,
            passMarks: sDef.passMarks,
            theoryMarks: sDef.theoryMarks,
            practicalMarks: sDef.practicalMarks,
            assignmentMarks: 20,
            attendanceMarks: 10
          }
        });
        subjectsCreated++;
      }
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'MADRASHA_TEMPLATE_APPLIED',
    resourceType: 'AcademicStructure',
    resourceId: academicYear.id,
    newState: {
      academicYear: academicYear.name,
      classesCreated,
      sectionsCreated,
      subjectsCreated
    }
  });

  return {
    success: true,
    academicYear,
    classesCreated,
    sectionsCreated,
    subjectsCreated,
    message: 'Madrasha Starter Template applied successfully with draft academic structure.'
  };
}

