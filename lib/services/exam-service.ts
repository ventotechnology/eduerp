import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { GRADING_SYSTEMS } from '../constants';
import {
  AssessmentComponentSchema,
  MarkDistributionTemplateSchema,
  ExamCreateSchema,
  ExamScheduleCreateSchema,
  ExamEligibilityOverrideSchema,
  MarksEntryBulkSchema,
  MarksWorkflowTransitionSchema,
  MarkCorrectionSchema,
  ResultPublicationSchema
} from '../validations/schemas';

// ==========================================
// Types & Helper Interfaces
// ==========================================
export interface SubjectScoreInput {
  subjectCode: string;
  theoryMarks: number;
  practicalMarks?: number;
  assignmentMarks?: number;
  attendanceMarks?: number;
  fullMarks?: number;
  isOptionalFourthSubject?: boolean;
}

export interface SubjectCalculatedResult {
  subjectCode: string;
  subjectName?: string;
  totalMarks: number;
  fullMarks: number;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
}

export interface OverallResultSummary {
  totalObtainedMarks: number;
  totalFullMarks: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  failedCount: number;
  subjectResults: SubjectCalculatedResult[];
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const [aStart, aEnd] = [timeToMinutes(startA), timeToMinutes(endA)];
  const [bStart, bEnd] = [timeToMinutes(startB), timeToMinutes(endB)];
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

// ==========================================
// 1. Assessment Components & Templates
// ==========================================

export async function createAssessmentComponent(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AssessmentComponentSchema.parse(rawData);

  const existing = await db.assessmentComponent.findUnique({
    where: {
      institutionId_code: {
        institutionId: tenant.institutionId,
        code: validated.code
      }
    }
  });

  if (existing) {
    throw AppError.conflict(`Assessment component '${validated.code}' already exists.`);
  }

  const component = await db.assessmentComponent.create({
    data: {
      institutionId: tenant.institutionId,
      ...validated
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ASSESSMENT_COMPONENT_CREATED',
    resourceType: 'AssessmentComponent',
    resourceId: component.id,
    newState: component
  });

  return component;
}

export async function getAssessmentComponents(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.assessmentComponent.findMany({
    where: { institutionId: tenant.institutionId },
    orderBy: { sequence: 'asc' }
  });
}

export async function createMarkDistributionTemplate(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MarkDistributionTemplateSchema.parse(rawData);

  const totalMarks = validated.components.reduce((sum, c) => sum + c.maxMarks, 0);

  const template = await db.markDistributionTemplate.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      academicLevel: validated.academicLevel,
      componentsJson: JSON.stringify(validated.components),
      totalMarks,
      isDefault: validated.isDefault
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'MARK_DISTRIBUTION_TEMPLATE_CREATED',
    resourceType: 'MarkDistributionTemplate',
    resourceId: template.id,
    newState: { name: validated.name, code: validated.code, totalMarks }
  });

  return template;
}

export async function getMarkDistributionTemplates(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.markDistributionTemplate.findMany({
    where: { institutionId: tenant.institutionId },
    orderBy: { createdAt: 'desc' }
  });
}

// ==========================================
// 2. Examination Master & Context
// ==========================================

export async function createExam(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ExamCreateSchema.parse(rawData);

  const session = await db.session.findFirst({
    where: {
      id: validated.sessionId,
      academicYear: { institutionId: tenant.institutionId }
    }
  });

  if (!session) {
    throw AppError.notFound('Academic session not found in this institution.');
  }

  const exam = await db.exam.create({
    data: {
      institutionId: tenant.institutionId,
      sessionId: validated.sessionId,
      name: validated.name,
      type: validated.type,
      examTypeCode: validated.examTypeCode,
      termNumber: validated.termNumber,
      targetClassId: validated.targetClassId,
      targetProgramId: validated.targetProgramId,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      markEntryDeadline: validated.markEntryDeadline ? new Date(validated.markEntryDeadline) : null,
      moderationDeadline: validated.moderationDeadline ? new Date(validated.moderationDeadline) : null,
      publicationDeadline: validated.publicationDeadline ? new Date(validated.publicationDeadline) : null,
      publicationStatus: 'INTERNAL',
      isPublished: false
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXAMINATION_CREATED',
    resourceType: 'Exam',
    resourceId: exam.id,
    newState: { name: exam.name, type: exam.type, sessionId: exam.sessionId }
  });

  return exam;
}

export async function getTenantExams(tenantIdentifier: string, sessionId?: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.exam.findMany({
    where: {
      institutionId: tenant.institutionId,
      ...(sessionId ? { sessionId } : {})
    },
    include: {
      session: { include: { academicYear: true } },
      targetClass: true,
      targetProgram: true,
      _count: {
        select: {
          marksEntries: true,
          results: true,
          schedules: true,
          eligibilities: true
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });
}

// ==========================================
// 3. Exam Scheduling & Conflict Engine
// ==========================================

export async function scheduleExam(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ExamScheduleCreateSchema.parse(rawData);

  const exam = await db.exam.findFirst({
    where: {
      id: validated.examId,
      OR: [
        { institutionId: tenant.institutionId },
        { session: { academicYear: { institutionId: tenant.institutionId } } }
      ]
    }
  });
  if (!exam) throw AppError.notFound('Exam not found.');

  const scheduleDate = new Date(validated.date);
  const startOfDay = new Date(scheduleDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduleDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all existing exam schedules on the same day
  const existingSchedules = await db.examSchedule.findMany({
    where: {
      exam: { institutionId: tenant.institutionId },
      date: { gte: startOfDay, lte: endOfDay }
    },
    include: {
      room: true,
      subject: true,
      course: true,
      section: true,
      class: true
    }
  });

  for (const es of existingSchedules) {
    if (isTimeOverlapping(validated.startTime, validated.endTime, es.startTime, es.endTime)) {
      // 1. Room Conflict
      if (validated.roomId && es.roomId === validated.roomId) {
        throw new AppError(
          `Exam Room Conflict: Room '${es.room?.roomNumber || 'Unknown'}' is already booked on ${scheduleDate.toISOString().slice(0, 10)} between ${es.startTime} and ${es.endTime}.`,
          'ROOM_CONFLICT',
          409
        );
      }

      // 2. Invigilator Conflict
      if (validated.invigilatorId && es.invigilatorId === validated.invigilatorId) {
        throw new AppError(
          `Invigilator Conflict: Invigilator '${es.invigilatorName || 'Assigned Staff'}' is already scheduled for another exam room between ${es.startTime} and ${es.endTime}.`,
          'TEACHER_CONFLICT',
          409
        );
      }

      // 3. Section / Cohort Conflict
      if (validated.sectionId && es.sectionId === validated.sectionId) {
        throw new AppError(
          `Student Cohort Conflict: Section '${es.section?.name}' already has an exam scheduled for '${es.subject?.name || es.course?.title}' between ${es.startTime} and ${es.endTime}.`,
          'SECTION_CONFLICT',
          409
        );
      }

      // 4. Class Conflict (when section is omitted)
      if (validated.classId && es.classId === validated.classId && !validated.sectionId && !es.sectionId) {
        throw new AppError(
          `Class Exam Conflict: Class '${es.class?.name}' already has an exam scheduled between ${es.startTime} and ${es.endTime}.`,
          'SECTION_CONFLICT',
          409
        );
      }
    }
  }

  const schedule = await db.examSchedule.create({
    data: {
      examId: validated.examId,
      subjectId: validated.subjectId,
      courseId: validated.courseId,
      courseOfferingId: validated.courseOfferingId,
      classId: validated.classId,
      sectionId: validated.sectionId,
      date: scheduleDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      durationMinutes: validated.durationMinutes,
      roomId: validated.roomId,
      invigilatorName: validated.invigilatorName,
      invigilatorId: validated.invigilatorId,
      maxMarks: validated.maxMarks,
      instructions: validated.instructions,
      status: 'SCHEDULED'
    },
    include: {
      room: true,
      subject: true,
      course: true,
      class: true,
      section: true
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXAM_SCHEDULE_CREATED',
    resourceType: 'ExamSchedule',
    resourceId: schedule.id,
    newState: {
      examId: schedule.examId,
      date: schedule.date,
      time: `${schedule.startTime}-${schedule.endTime}`,
      room: schedule.room?.roomNumber
    }
  });

  return schedule;
}

export async function getExamSchedules(tenantIdentifier: string, examId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.examSchedule.findMany({
    where: {
      examId,
      exam: { institutionId: tenant.institutionId }
    },
    include: {
      room: true,
      subject: true,
      course: true,
      class: true,
      section: true
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
  });
}

// ==========================================
// 4. Student Exam Eligibility Engine
// ==========================================

export async function calculateStudentExamEligibility(
  tenantIdentifier: string,
  examId: string,
  actor: SessionUser,
  requiredAttendancePercent = 75.0
) {
  const tenant = await requireTenant(tenantIdentifier);

  const exam = await db.exam.findFirst({
    where: {
      id: examId,
      OR: [
        { institutionId: tenant.institutionId },
        { session: { academicYear: { institutionId: tenant.institutionId } } }
      ]
    },
    include: { session: { include: { academicYear: true } } }
  });
  if (!exam) throw AppError.notFound('Exam not found.');

  // Fetch enrolled students for target class/program
  const students = await db.student.findMany({
    where: {
      campus: { institutionId: tenant.institutionId },
      status: 'ACTIVE',
      ...(exam.targetClassId ? { enrollments: { some: { classId: exam.targetClassId, status: 'ACTIVE' } } } : {})
    },
    include: {
      attendances: true,
      invoices: { include: { payments: true } }
    }
  });

  const eligibilities = [];

  for (const student of students) {
    const totalAttendanceSessions = student.attendances.length;
    const presentCount = student.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercentage = totalAttendanceSessions > 0 ? (presentCount / totalAttendanceSessions) * 100 : 100.0;

    // Check financial clearance (unpaid overdue invoices)
    const hasUnpaidOverdue = student.invoices.some(
      (inv) => inv.status !== 'PAID' && inv.dueDate < new Date() && inv.dueAmount > 0
    );

    let status = 'ELIGIBLE';
    if (attendancePercentage < requiredAttendancePercent) {
      status = 'INELIGIBLE_ATTENDANCE';
    } else if (hasUnpaidOverdue) {
      status = 'INELIGIBLE_FINANCIAL';
    }

    const hallTicketNumber = `HT-${exam.id.slice(-4).toUpperCase()}-${student.studentIdNumber}`;

    const rec = await db.examEligibility.upsert({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id
        }
      },
      update: {
        status: status,
        attendancePercentage,
        financialClearance: !hasUnpaidOverdue,
        hallTicketNumber
      },
      create: {
        examId,
        studentId: student.id,
        status,
        attendancePercentage,
        financialClearance: !hasUnpaidOverdue,
        hallTicketNumber
      }
    });

    eligibilities.push(rec);
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXAM_ELIGIBILITY_CALCULATED',
    resourceType: 'ExamEligibility',
    resourceId: examId,
    newState: { totalStudents: eligibilities.length, requiredAttendancePercent }
  });

  return eligibilities;
}

export async function overrideStudentExamEligibility(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ExamEligibilityOverrideSchema.parse(rawData);

  const existing = await db.examEligibility.findUnique({
    where: {
      examId_studentId: {
        examId: validated.examId,
        studentId: validated.studentId
      }
    }
  });

  if (!existing) {
    throw AppError.notFound('Student eligibility record not found for this exam.');
  }

  const updated = await db.examEligibility.update({
    where: { id: existing.id },
    data: {
      status: validated.status,
      isOverridden: true,
      overrideReason: validated.overrideReason,
      overriddenBy: actor.name || actor.email,
      overriddenAt: new Date()
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXAM_ELIGIBILITY_OVERRIDDEN',
    resourceType: 'ExamEligibility',
    resourceId: updated.id,
    newState: {
      studentId: validated.studentId,
      newStatus: validated.status,
      reason: validated.overrideReason
    }
  });

  return updated;
}

// ==========================================
// 5. Marks Entry & Server Authorization
// ==========================================

export async function recordBulkMarks(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MarksEntryBulkSchema.parse(rawData);

  const exam = await db.exam.findFirst({
    where: {
      id: validated.examId,
      OR: [
        { institutionId: tenant.institutionId },
        { session: { academicYear: { institutionId: tenant.institutionId } } }
      ]
    }
  });
  if (!exam) throw AppError.notFound('Exam not found.');

  // Teacher authorization check: if TEACHER role, must be assigned to subject/class or course offering
  if (actor.role === 'TEACHER') {
    const teacherProfile = await db.teacher.findFirst({
      where: { employee: { userId: actor.id } }
    });

    if (!teacherProfile) {
      throw AppError.forbidden('Teacher profile not found for the active user.');
    }

    if (validated.subjectId) {
      const assignment = await db.teacherAssignment.findFirst({
        where: { teacherId: teacherProfile.id, subjectId: validated.subjectId }
      });
      if (!assignment) {
        throw AppError.forbidden('Unauthorized: You are not assigned as the instructor for this subject.');
      }
    }

    if (validated.courseOfferingId) {
      const offering = await db.courseOffering.findFirst({
        where: { id: validated.courseOfferingId, teacherId: teacherProfile.id }
      });
      if (!offering) {
        throw AppError.forbidden('Unauthorized: You are not assigned as the instructor for this course offering.');
      }
    }
  }

  let fullMarks = 100;
  let passMarks = 33;

  if (validated.subjectId) {
    const sub = await db.subject.findUnique({ where: { id: validated.subjectId } });
    if (sub) {
      fullMarks = sub.fullMarks;
      passMarks = sub.passMarks;
    }
  }

  const savedEntries = [];

  for (const item of validated.entries) {
    // Check eligibility
    const eligibility = await db.examEligibility.findUnique({
      where: {
        examId_studentId: {
          examId: validated.examId,
          studentId: item.studentId
        }
      }
    });

    if (eligibility && !eligibility.isOverridden && eligibility.status.startsWith('INELIGIBLE')) {
      throw AppError.validation(
        `Cannot enter marks: Student '${item.studentId}' is marked ${eligibility.status} and has no authorized override.`
      );
    }

    // Check if existing marks entry is locked
    const existing = await db.marksEntry.findFirst({
      where: {
        examId: validated.examId,
        studentId: item.studentId,
        ...(validated.subjectId ? { subjectId: validated.subjectId } : {}),
        ...(validated.courseOfferingId ? { courseOfferingId: validated.courseOfferingId } : {})
      }
    });

    if (existing && existing.isLocked) {
      throw AppError.conflict('Marks for this student have already been LOCKED and cannot be modified without an approved correction request.');
    }

    // Calculate total score
    let total = 0;
    if (item.markStatus === 'MARK') {
      total = item.theoryMarks + item.practicalMarks + item.assignmentMarks + item.attendanceMarks;
      if (total < 0 || total > fullMarks) {
        throw AppError.validation(`Total marks (${total}) out of range [0, ${fullMarks}] for student ${item.studentId}`);
      }
    }

    const percentage = fullMarks > 0 ? (total / fullMarks) * 100 : 0;
    let letterGrade = 'F';
    let gradePoint = 0.0;

    if (item.markStatus === 'MARK') {
      for (const tier of GRADING_SYSTEMS.SCHOOL_GPA_5) {
        if (percentage >= tier.minMarks) {
          letterGrade = tier.grade;
          gradePoint = tier.point;
          break;
        }
      }
    } else {
      letterGrade = item.markStatus; // ABSENT, EXEMPT, etc.
      gradePoint = 0.0;
    }

    const record = await db.marksEntry.upsert({
      where: {
        id: existing?.id || 'temp-id-create'
      },
      update: {
        theoryMarks: item.theoryMarks,
        practicalMarks: item.practicalMarks,
        assignmentMarks: item.assignmentMarks,
        attendanceMarks: item.attendanceMarks,
        totalMarks: total,
        letterGrade,
        gradePoint,
        status: gradePoint > 0 && total >= passMarks ? 'PASS' : 'FAIL',
        markStatus: item.markStatus,
        componentScoresJson: item.componentScores ? JSON.stringify(item.componentScores) : null,
        enteredByUserId: actor.id,
        remarks: item.remarks
      },
      create: {
        examId: validated.examId,
        studentId: item.studentId,
        subjectId: validated.subjectId,
        courseOfferingId: validated.courseOfferingId,
        theoryMarks: item.theoryMarks,
        practicalMarks: item.practicalMarks,
        assignmentMarks: item.assignmentMarks,
        attendanceMarks: item.attendanceMarks,
        totalMarks: total,
        letterGrade,
        gradePoint,
        status: gradePoint > 0 && total >= passMarks ? 'PASS' : 'FAIL',
        workflowStatus: 'DRAFT',
        markStatus: item.markStatus,
        componentScoresJson: item.componentScores ? JSON.stringify(item.componentScores) : null,
        enteredByUserId: actor.id,
        remarks: item.remarks
      }
    });

    savedEntries.push(record);
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'MARKS_BULK_RECORDED',
    resourceType: 'MarksEntry',
    resourceId: validated.examId,
    newState: {
      examId: validated.examId,
      subjectId: validated.subjectId,
      courseOfferingId: validated.courseOfferingId,
      count: savedEntries.length
    }
  });

  return savedEntries;
}

// ==========================================
// 6. Marks Workflow & Correction
// ==========================================

export async function transitionMarksWorkflow(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MarksWorkflowTransitionSchema.parse(rawData);

  const whereClause = {
    examId: validated.examId,
    ...(validated.subjectId ? { subjectId: validated.subjectId } : {}),
    ...(validated.courseOfferingId ? { courseOfferingId: validated.courseOfferingId } : {})
  };

  const updateData: any = {
    workflowStatus: validated.targetStatus
  };

  const now = new Date();
  const userName = actor.name || actor.email;

  if (validated.targetStatus === 'SUBMITTED') {
    updateData.submittedAt = now;
    updateData.submittedBy = userName;
  } else if (validated.targetStatus === 'UNDER_REVIEW') {
    updateData.reviewedAt = now;
    updateData.reviewedBy = userName;
  } else if (validated.targetStatus === 'APPROVED') {
    updateData.approvedAt = now;
    updateData.approvedBy = userName;
  } else if (validated.targetStatus === 'LOCKED') {
    updateData.isLocked = true;
    updateData.lockedAt = now;
    updateData.lockedBy = userName;
  }

  const result = await db.marksEntry.updateMany({
    where: whereClause,
    data: updateData
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: `MARKS_WORKFLOW_${validated.targetStatus}`,
    resourceType: 'MarksEntry',
    resourceId: validated.examId,
    newState: { targetStatus: validated.targetStatus, affectedRows: result.count, remarks: validated.reviewRemarks }
  });

  return { targetStatus: validated.targetStatus, count: result.count };
}

export async function correctMarkEntry(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MarkCorrectionSchema.parse(rawData);

  const entry = await db.marksEntry.findUnique({
    where: { id: validated.marksEntryId },
    include: { subject: true, exam: true }
  });

  if (!entry) throw AppError.notFound('Marks entry not found.');

  const previousScore = entry.totalMarks;
  const newTotal = validated.newScore;
  const fullMarks = entry.subject?.fullMarks || 100;
  const passMarks = entry.subject?.passMarks || 33;

  if (newTotal < 0 || newTotal > fullMarks) {
    throw AppError.validation(`Corrected score (${newTotal}) out of bounds [0, ${fullMarks}].`);
  }

  const percentage = (newTotal / fullMarks) * 100;
  let letterGrade = 'F';
  let gradePoint = 0.0;

  for (const tier of GRADING_SYSTEMS.SCHOOL_GPA_5) {
    if (percentage >= tier.minMarks) {
      letterGrade = tier.grade;
      gradePoint = tier.point;
      break;
    }
  }

  // Create audit record
  await db.markAuditLog.create({
    data: {
      marksEntryId: entry.id,
      previousScore,
      newScore: newTotal,
      componentName: validated.componentName,
      previousStatus: entry.status,
      newStatus: gradePoint > 0 && newTotal >= passMarks ? 'PASS' : 'FAIL',
      reason: validated.reason,
      changedByUserId: actor.id,
      changedByName: actor.name || actor.email
    }
  });

  // Update mark
  const updated = await db.marksEntry.update({
    where: { id: entry.id },
    data: {
      totalMarks: newTotal,
      theoryMarks: validated.componentName === 'TH' ? newTotal : entry.theoryMarks,
      letterGrade,
      gradePoint,
      status: gradePoint > 0 && newTotal >= passMarks ? 'PASS' : 'FAIL'
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'MARK_ENTRY_CORRECTED',
    resourceType: 'MarksEntry',
    resourceId: entry.id,
    newState: {
      studentId: entry.studentId,
      previousScore,
      newScore: newTotal,
      reason: validated.reason
    }
  });

  return updated;
}

// ==========================================
// 7. Result Calculation, Snapshots & Versioning
// ==========================================

export async function calculateAndFinalizeExamResults(
  tenantIdentifier: string,
  examId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const exam = await db.exam.findFirst({
    where: {
      id: examId,
      OR: [
        { institutionId: tenant.institutionId },
        { session: { academicYear: { institutionId: tenant.institutionId } } }
      ]
    },
    include: {
      session: { include: { academicYear: true } },
      targetClass: true,
      targetProgram: true
    }
  });

  if (!exam) throw AppError.notFound('Exam not found.');

  // Fetch all marks for this exam grouped by student
  const marks = await db.marksEntry.findMany({
    where: { examId },
    include: {
      subject: true,
      courseOffering: { include: { course: true } },
      student: { include: { subjectRegistrations: true } }
    }
  });

  const studentsMap = new Map<string, typeof marks>();
  for (const m of marks) {
    if (!studentsMap.has(m.studentId)) {
      studentsMap.set(m.studentId, []);
    }
    studentsMap.get(m.studentId)!.push(m);
  }

  const results = [];

  for (const [studentId, studentMarks] of studentsMap.entries()) {
    // Determine institution type calculation
    const institutionType = tenant.institutionType;

    let overallGpa = 0.0;
    let overallGrade = 'F';
    let isPassed = true;
    let totalObtained = 0;
    let totalFull = 0;
    let failedCount = 0;

    if (institutionType === 'UNIVERSITY') {
      // University Credit-Weighted CGPA
      const courseList = studentMarks.map((sm) => ({
        courseCode: sm.courseOffering?.course.code || 'COURSE',
        creditHours: sm.courseOffering?.course.creditHours || 3.0,
        gradePoint: sm.gradePoint
      }));

      const uniCalc = calculateUniversityCgpa(courseList);
      overallGpa = uniCalc.cgpa;
      isPassed = overallGpa >= 2.00;
      overallGrade = overallGpa >= 4.0 ? 'A+' : overallGpa >= 3.75 ? 'A' : overallGpa >= 3.0 ? 'B' : overallGpa >= 2.0 ? 'C' : 'F';
      totalObtained = studentMarks.reduce((sum, sm) => sum + sm.totalMarks, 0);
      totalFull = studentMarks.length * 100;
      failedCount = studentMarks.filter((sm) => sm.gradePoint < 2.0).length;
    } else {
      // School / College / Madrasha GPA 5.0 with optional 4th Subject Bonus
      const subjectInputs: SubjectScoreInput[] = studentMarks.map((sm) => {
        const is4th = sm.subject?.type === '4TH_SUBJECT' ||
          sm.student.subjectRegistrations.some((sr) => sr.subjectId === sm.subjectId && sr.isFourthSubject);

        return {
          subjectCode: sm.subject?.code || 'SUB',
          theoryMarks: sm.theoryMarks,
          practicalMarks: sm.practicalMarks,
          assignmentMarks: sm.assignmentMarks,
          attendanceMarks: sm.attendanceMarks,
          fullMarks: sm.subject?.fullMarks || 100,
          isOptionalFourthSubject: is4th
        };
      });

      const schoolCalc = calculateSchoolGpa(subjectInputs);
      overallGpa = schoolCalc.gpa;
      overallGrade = schoolCalc.letterGrade;
      isPassed = schoolCalc.isPassed;
      totalObtained = schoolCalc.totalObtainedMarks;
      totalFull = schoolCalc.totalFullMarks;
      failedCount = schoolCalc.failedCount;
    }

    const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;

    // Check previous snapshots to handle Version 1 -> Version 2 increment
    const previousSnapshots = await db.examResultSnapshot.findMany({
      where: { examId, studentId },
      orderBy: { version: 'desc' }
    });

    const nextVersion = previousSnapshots.length > 0 ? previousSnapshots[0].version + 1 : 1;

    // Mark previous snapshots as not current
    if (previousSnapshots.length > 0) {
      await db.examResultSnapshot.updateMany({
        where: { examId, studentId },
        data: { isCurrent: false }
      });
    }

    const snapshot = await db.examResultSnapshot.create({
      data: {
        examId,
        studentId,
        version: nextVersion,
        isCurrent: true,
        gpa: overallGpa,
        cgpa: overallGpa,
        totalMarks: totalObtained,
        percentage,
        letterGrade: overallGrade,
        isPassed,
        failedSubjectsCount: failedCount,
        subjectResultsJson: JSON.stringify(
          studentMarks.map((sm) => ({
            code: sm.subject?.code || sm.courseOffering?.course.code,
            name: sm.subject?.name || sm.courseOffering?.course.title,
            theoryMarks: sm.theoryMarks,
            practicalMarks: sm.practicalMarks,
            assignmentMarks: sm.assignmentMarks,
            attendanceMarks: sm.attendanceMarks,
            totalMarks: sm.totalMarks,
            gradePoint: sm.gradePoint,
            letterGrade: sm.letterGrade,
            status: sm.status,
            markStatus: sm.markStatus
          }))
        ),
        gradingScaleSnapshot: JSON.stringify(GRADING_SYSTEMS.SCHOOL_GPA_5),
        publicationStatus: 'PUBLISHED',
        approvedBy: actor.name || actor.email,
        approvedAt: new Date()
      }
    });

    // Also update current legacy Result table for backward compatibility
    await db.result.upsert({
      where: {
        examId_studentId: { examId, studentId }
      },
      update: {
        totalMarks: totalObtained,
        gpaOrCgpa: overallGpa,
        letterGrade: overallGrade,
        isPassed
      },
      create: {
        examId,
        studentId,
        totalMarks: totalObtained,
        gpaOrCgpa: overallGpa,
        letterGrade: overallGrade,
        isPassed
      }
    });

    results.push(snapshot);
  }

  // Calculate ranks/positions
  results.sort((a, b) => b.gpa - a.gpa || b.totalMarks - a.totalMarks);
  for (let i = 0; i < results.length; i++) {
    await db.examResultSnapshot.update({
      where: { id: results[i].id },
      data: { positionInClass: i + 1 }
    });
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXAM_RESULTS_FINALIZED_AND_SNAPSHOTTED',
    resourceType: 'ExamResultSnapshot',
    resourceId: examId,
    newState: { totalStudents: results.length, examName: exam.name }
  });

  return results;
}

export async function publishExamResults(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ResultPublicationSchema.parse(rawData);

  const exam = await db.exam.findFirst({
    where: {
      id: validated.examId,
      OR: [
        { institutionId: tenant.institutionId },
        { session: { academicYear: { institutionId: tenant.institutionId } } }
      ]
    }
  });
  if (!exam) throw AppError.notFound('Exam not found.');

  const isPub = validated.publicationStatus === 'PUBLISHED';
  const now = new Date();

  await db.exam.update({
    where: { id: exam.id },
    data: {
      publicationStatus: validated.publicationStatus,
      isPublished: isPub,
      publishedAt: isPub ? now : null,
      publishedBy: isPub ? actor.name || actor.email : null
    }
  });

  await db.examResultSnapshot.updateMany({
    where: { examId: exam.id, isCurrent: true },
    data: { publicationStatus: validated.publicationStatus }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: `EXAM_RESULTS_${validated.publicationStatus}`,
    resourceType: 'Exam',
    resourceId: exam.id,
    newState: { publicationStatus: validated.publicationStatus, remarks: validated.remarks }
  });

  return { examId: exam.id, status: validated.publicationStatus };
}

// ==========================================
// 8. Public & Authenticated Result Lookups
// ==========================================

export async function getStudentExamResults(
  tenantIdentifier: string,
  studentId: string,
  actor: SessionUser,
  examId?: string
) {
  const tenant = await requireTenant(tenantIdentifier);

  // Authorization Check
  if (actor.role === 'STUDENT') {
    const studentUser = await db.student.findFirst({
      where: { userId: actor.id }
    });
    if (!studentUser || studentUser.id !== studentId) {
      throw AppError.forbidden('Access denied: You can only view your own results.');
    }
  } else if (actor.role === 'PARENT') {
    const guardian = await db.guardian.findFirst({
      where: { userId: actor.id },
      include: { students: true, studentLinks: true }
    });

    const isLinked =
      guardian?.students.some((s) => s.id === studentId) ||
      guardian?.studentLinks.some((l) => l.studentId === studentId);

    if (!isLinked) {
      throw AppError.forbidden('Access denied: You are not authorized to view results for this student.');
    }
  }

  // Fetch only published results for students/parents
  const isPrivileged = actor.role === 'SUPER_ADMIN' || actor.role === 'PRINCIPAL' || actor.role === 'DEAN';

  return db.examResultSnapshot.findMany({
    where: {
      studentId,
      ...(examId ? { examId } : { exam: { institutionId: tenant.institutionId } }),
      isCurrent: true,
      ...(isPrivileged ? {} : { publicationStatus: 'PUBLISHED' })
    },
    include: {
      exam: { include: { session: { include: { academicYear: true } } } },
      student: { include: { campus: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getPublicExamResult(
  tenantSlug: string,
  query: { studentIdNumber?: string; rollNumber?: string; registrationNumber?: string; examId?: string }
) {
  const tenant = await requireTenant(tenantSlug);

  if (!query.studentIdNumber && !query.rollNumber && !query.registrationNumber) {
    throw AppError.validation('Student ID Number, Roll Number, or Registration Number is required.');
  }

  const student = await db.student.findFirst({
    where: {
      campus: { institutionId: tenant.institutionId },
      ...(query.studentIdNumber ? { studentIdNumber: query.studentIdNumber } : {}),
      ...(query.rollNumber ? { rollNumber: query.rollNumber } : {}),
      ...(query.registrationNumber ? { registrationNumber: query.registrationNumber } : {})
    }
  });

  if (!student) {
    throw AppError.notFound('No student record found matching the search criteria.');
  }

  const result = await db.examResultSnapshot.findFirst({
    where: {
      studentId: student.id,
      publicationStatus: 'PUBLISHED',
      isCurrent: true,
      ...(query.examId ? { examId: query.examId } : {})
    },
    include: {
      exam: { include: { session: { include: { academicYear: true } } } },
      student: { include: { campus: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!result) {
    throw AppError.notFound('No published examination result found for this student.');
  }

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    studentIdNumber: student.studentIdNumber,
    rollNumber: student.rollNumber,
    examName: result.exam.name,
    academicYear: result.exam.session.academicYear.name,
    gpa: result.gpa,
    letterGrade: result.letterGrade,
    isPassed: result.isPassed,
    subjectResults: JSON.parse(result.subjectResultsJson || '[]'),
    publishedAt: result.approvedAt
  };
}

export function calculateSchoolGpa(subjects: SubjectScoreInput[]): OverallResultSummary {
  const scale = GRADING_SYSTEMS.SCHOOL_GPA_5;
  let totalObtained = 0;
  let totalFull = 0;
  let totalGradePoints = 0;
  let hasFailedSubject = false;
  let compulsoryCount = 0;
  let failedCount = 0;

  const subjectResults: SubjectCalculatedResult[] = subjects.map((sub) => {
    const total =
      (sub.theoryMarks || 0) +
      (sub.practicalMarks || 0) +
      (sub.assignmentMarks || 0) +
      (sub.attendanceMarks || 0);

    const full = sub.fullMarks || 100;
    const percentage = full > 0 ? (total / full) * 100 : 0;

    let letterGrade = 'F';
    let gradePoint = 0.0;

    for (const tier of scale) {
      if (percentage >= tier.minMarks) {
        letterGrade = tier.grade;
        gradePoint = tier.point;
        break;
      }
    }

    const isPassed = gradePoint > 0.0;

    if (!sub.isOptionalFourthSubject) {
      compulsoryCount += 1;
      totalGradePoints += gradePoint;
      if (!isPassed) {
        hasFailedSubject = true;
        failedCount += 1;
      }
    } else {
      // 4th Subject Rule in Bangladesh: Points above 2.00 are added as bonus
      const bonus = Math.max(0, gradePoint - 2.0);
      totalGradePoints += bonus;
    }

    totalObtained += total;
    totalFull += full;

    return {
      subjectCode: sub.subjectCode,
      totalMarks: total,
      fullMarks: full,
      letterGrade,
      gradePoint,
      isPassed
    };
  });

  if (hasFailedSubject || compulsoryCount === 0) {
    return {
      totalObtainedMarks: totalObtained,
      totalFullMarks: totalFull,
      gpa: 0.0,
      letterGrade: 'F',
      isPassed: false,
      failedCount,
      subjectResults
    };
  }

  let finalGpa = totalGradePoints / compulsoryCount;
  finalGpa = Math.min(5.0, Math.round(finalGpa * 100) / 100);

  let overallGrade = 'F';
  if (finalGpa >= 5.0) overallGrade = 'A+';
  else if (finalGpa >= 4.0) overallGrade = 'A';
  else if (finalGpa >= 3.5) overallGrade = 'A-';
  else if (finalGpa >= 3.0) overallGrade = 'B';
  else if (finalGpa >= 2.0) overallGrade = 'C';
  else if (finalGpa >= 1.0) overallGrade = 'D';

  return {
    totalObtainedMarks: totalObtained,
    totalFullMarks: totalFull,
    gpa: finalGpa,
    letterGrade: overallGrade,
    isPassed: true,
    failedCount: 0,
    subjectResults
  };
}

export function calculateUniversityCgpa(
  courses: { courseCode: string; creditHours: number; gradePoint: number }[]
): { totalCredits: number; earnedCredits: number; cgpa: number } {
  let totalCredits = 0;
  let earnedCredits = 0;
  let totalWeightedPoints = 0;

  for (const c of courses) {
    totalCredits += c.creditHours;
    if (c.gradePoint >= 2.0) {
      earnedCredits += c.creditHours;
    }
    totalWeightedPoints += c.gradePoint * c.creditHours;
  }

  const cgpa = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 100) / 100 : 0.0;

  return {
    totalCredits,
    earnedCredits,
    cgpa
  };
}

export async function saveMarksEntries(
  tenantIdentifier: string,
  examId: string,
  subjectId: string,
  entries: Array<{
    studentId: string;
    theoryMarks: number;
    practicalMarks?: number;
    assignmentMarks?: number;
    attendanceMarks?: number;
  }>,
  actor: SessionUser
) {
  return recordBulkMarks(
    tenantIdentifier,
    {
      examId,
      subjectId,
      entries: entries.map((e) => ({
        studentId: e.studentId,
        markStatus: 'MARK',
        theoryMarks: e.theoryMarks,
        practicalMarks: e.practicalMarks || 0,
        assignmentMarks: e.assignmentMarks || 0,
        attendanceMarks: e.attendanceMarks || 0
      }))
    },
    actor
  );
}
