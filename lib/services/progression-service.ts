import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { PromotionExecutionSchema, GraduationProcessSchema } from '../validations/schemas';
import { calculateUniversityCgpa } from './exam-service';

export async function previewClassPromotion(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PromotionExecutionSchema.parse(rawData);

  const students = await db.student.findMany({
    where: {
      campus: { institutionId: tenant.institutionId },
      enrollments: {
        some: {
          academicYearId: validated.fromAcademicYearId,
          classId: validated.fromClassId,
          status: 'ACTIVE'
        }
      }
    },
    include: {
      section: true,
      resultSnapshots: {
        where: { isCurrent: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const previewList = students.map((student) => {
    const latestResult = student.resultSnapshots[0];
    const gpa = latestResult ? latestResult.gpa : 0.0;
    const isPassed = latestResult ? latestResult.isPassed : false;
    const failedCount = latestResult ? latestResult.failedSubjectsCount : 0;

    let recommendation: 'PROMOTED' | 'CONDITIONALLY_PROMOTED' | 'REPEAT' | 'GRADUATED' = 'REPEAT';

    if (!validated.toClassId) {
      // Terminal class graduation
      recommendation = isPassed && gpa >= validated.minimumPassingGpa ? 'GRADUATED' : 'REPEAT';
    } else if (isPassed && gpa >= validated.minimumPassingGpa && failedCount === 0) {
      recommendation = 'PROMOTED';
    } else if (failedCount <= validated.maxAllowedFailedSubjects && gpa >= validated.minimumPassingGpa) {
      recommendation = 'CONDITIONALLY_PROMOTED';
    } else {
      recommendation = 'REPEAT';
    }

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentIdNumber: student.studentIdNumber,
      rollNumber: student.rollNumber,
      currentSection: student.section?.name,
      gpa,
      isPassed,
      failedSubjectsCount: failedCount,
      recommendedStatus: recommendation
    };
  });

  return {
    fromClassId: validated.fromClassId,
    toClassId: validated.toClassId,
    totalStudents: previewList.length,
    students: previewList
  };
}

export async function executeClassPromotion(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PromotionExecutionSchema.parse(rawData);

  const preview = await previewClassPromotion(tenantIdentifier, rawData, actor);

  let promotedCount = 0;
  let repeatedCount = 0;
  let conditionalCount = 0;
  let graduatedCount = 0;

  const result = await db.$transaction(async (tx) => {
    const batch = await tx.promotionBatch.create({
      data: {
        institutionId: tenant.institutionId,
        examId: validated.examId,
        fromAcademicYearId: validated.fromAcademicYearId,
        toAcademicYearId: validated.toAcademicYearId,
        fromClassId: validated.fromClassId,
        toClassId: validated.toClassId,
        processedBy: actor.name || actor.email,
        totalStudents: preview.students.length,
        promotedCount: 0,
        repeatedCount: 0,
        conditionalCount: 0,
        graduatedCount: 0,
        rulesAppliedJson: JSON.stringify({
          minimumPassingGpa: validated.minimumPassingGpa,
          maxAllowedFailedSubjects: validated.maxAllowedFailedSubjects
        })
      }
    });

    for (const item of preview.students) {
      const override = validated.overrides?.find((o) => o.studentId === item.studentId);
      const finalStatus = override ? override.status : item.recommendedStatus;
      const isOverridden = !!override;

      if (finalStatus === 'PROMOTED') promotedCount++;
      else if (finalStatus === 'CONDITIONALLY_PROMOTED') conditionalCount++;
      else if (finalStatus === 'REPEAT') repeatedCount++;
      else if (finalStatus === 'GRADUATED') graduatedCount++;

      // Create promotion record
      await tx.studentPromotionRecord.create({
        data: {
          promotionBatchId: batch.id,
          studentId: item.studentId,
          status: finalStatus,
          finalGpa: item.gpa,
          isPassed: item.isPassed,
          isOverridden,
          overrideReason: override?.overrideReason,
          overriddenBy: isOverridden ? actor.name || actor.email : null
        }
      });

      // Update past enrollment status to COMPLETED
      await tx.enrollment.updateMany({
        where: {
          studentId: item.studentId,
          academicYearId: validated.fromAcademicYearId,
          classId: validated.fromClassId,
          status: 'ACTIVE'
        },
        data: { status: 'COMPLETED' }
      });

      if (finalStatus === 'PROMOTED' || finalStatus === 'CONDITIONALLY_PROMOTED') {
        if (validated.toClassId) {
          // Create new enrollment in next academic year in target class
          await tx.enrollment.create({
            data: {
              studentId: item.studentId,
              academicYearId: validated.toAcademicYearId,
              classId: validated.toClassId,
              sectionId: override?.toSectionId,
              enrollmentDate: new Date(),
              rollNumber: item.rollNumber,
              status: 'ACTIVE'
            }
          });
        }
      } else if (finalStatus === 'REPEAT') {
        // Create new enrollment repeating same class
        await tx.enrollment.create({
          data: {
            studentId: item.studentId,
            academicYearId: validated.toAcademicYearId,
            classId: validated.fromClassId,
            enrollmentDate: new Date(),
            rollNumber: item.rollNumber,
            status: 'ACTIVE'
          }
        });
      } else if (finalStatus === 'GRADUATED') {
        await tx.student.update({
          where: { id: item.studentId },
          data: { status: 'GRADUATED' }
        });
      }
    }

    // Update batch totals
    const updatedBatch = await tx.promotionBatch.update({
      where: { id: batch.id },
      data: {
        promotedCount,
        repeatedCount,
        conditionalCount,
        graduatedCount
      }
    });

    return updatedBatch;
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CLASS_PROMOTION_EXECUTED',
    resourceType: 'PromotionBatch',
    resourceId: result.id,
    newState: {
      fromClassId: validated.fromClassId,
      toClassId: validated.toClassId,
      totalStudents: preview.students.length,
      promotedCount,
      repeatedCount,
      conditionalCount,
      graduatedCount
    }
  });

  return result;
}

export async function evaluateUniversitySemesterProgression(
  tenantIdentifier: string,
  studentId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: { id: studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      batch: { include: { program: true } },
      courseRegistrations: { include: { course: true } }
    }
  });

  if (!student) throw AppError.notFound('Student not found.');

  const completed = student.courseRegistrations.filter((r) => r.status === 'COMPLETED');
  const failed = student.courseRegistrations.filter((r) => r.status === 'COMPLETED' && (r.gradePoint || 0) < 2.0);

  const courses = completed.map((r) => ({
    courseCode: r.course.code,
    creditHours: r.course.creditHours,
    gradePoint: r.gradePoint || 0.0
  }));

  const cgpaResult = calculateUniversityCgpa(courses);

  let academicStanding = 'GOOD_STANDING';
  if (cgpaResult.cgpa < 2.00 && cgpaResult.totalCredits >= 12.0) {
    academicStanding = 'PROBATION';
  }

  return {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    programName: student.batch?.program.name,
    totalAttemptedCredits: cgpaResult.totalCredits,
    totalEarnedCredits: cgpaResult.earnedCredits,
    cgpa: cgpaResult.cgpa,
    academicStanding,
    failedCoursesToRetake: failed.map((f) => ({
      code: f.course.code,
      title: f.course.title,
      credits: f.course.creditHours,
      gradePoint: f.gradePoint
    }))
  };
}

export async function evaluateUniversityGraduation(
  tenantIdentifier: string,
  studentId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: { id: studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      batch: { include: { program: { include: { courses: true } } } },
      courseRegistrations: { include: { course: true } }
    }
  });

  if (!student) throw AppError.notFound('Student not found.');

  const program = student.batch?.program;
  if (!program) throw AppError.validation('Student is not assigned to an academic program.');

  const requiredCredits = program.totalCredits || 140.0;
  const completedRegs = student.courseRegistrations.filter((r) => r.status === 'COMPLETED' && (r.gradePoint || 0) >= 2.0);

  const courses = completedRegs.map((r) => ({
    courseCode: r.course.code,
    creditHours: r.course.creditHours,
    gradePoint: r.gradePoint || 0.0
  }));

  const cgpaResult = calculateUniversityCgpa(courses);
  const earnedCredits = cgpaResult.earnedCredits;
  const minGraduationCgpa = 2.25;

  const isCreditsFulfilled = earnedCredits >= requiredCredits;
  const isCgpaFulfilled = cgpaResult.cgpa >= minGraduationCgpa;

  let degreeClassification = 'Pass Degree';
  if (cgpaResult.cgpa >= 3.85) degreeClassification = 'Distinction / First Class with Honors';
  else if (cgpaResult.cgpa >= 3.50) degreeClassification = 'First Class';
  else if (cgpaResult.cgpa >= 3.00) degreeClassification = 'Second Class (Upper Division)';
  else if (cgpaResult.cgpa >= 2.50) degreeClassification = 'Second Class (Lower Division)';

  const isEligible = isCreditsFulfilled && isCgpaFulfilled;

  return {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    programId: program.id,
    programName: program.name,
    requiredCredits,
    earnedCredits,
    cgpa: cgpaResult.cgpa,
    isCreditsFulfilled,
    isCgpaFulfilled,
    isEligible,
    degreeClassification
  };
}

export async function processUniversityGraduation(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = GraduationProcessSchema.parse(rawData);

  const evalResult = await evaluateUniversityGraduation(tenantIdentifier, validated.studentId, actor);

  if (!evalResult.isEligible) {
    throw AppError.validation(
      `Student is not eligible for graduation: Completed ${evalResult.earnedCredits}/${evalResult.requiredCredits} credits with CGPA ${evalResult.cgpa.toFixed(2)}.`
    );
  }

  const existing = await db.graduationRecord.findUnique({
    where: { studentId: validated.studentId }
  });

  if (existing) {
    throw AppError.conflict('Student is already officially recorded as graduated.');
  }

  const record = await db.$transaction(async (tx) => {
    const grad = await tx.graduationRecord.create({
      data: {
        institutionId: tenant.institutionId,
        studentId: validated.studentId,
        programId: validated.programId,
        graduationDate: new Date(validated.graduationDate),
        finalCgpa: evalResult.cgpa,
        totalCreditsCompleted: evalResult.earnedCredits,
        degreeClassification: validated.degreeClassification || evalResult.degreeClassification,
        thesisTitle: validated.thesisTitle,
        internshipOrganization: validated.internshipOrganization,
        convocationBatch: validated.convocationBatch,
        approvedBy: actor.name || actor.email
      }
    });

    await tx.student.update({
      where: { id: validated.studentId },
      data: { status: 'GRADUATED' }
    });

    return grad;
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UNIVERSITY_GRADUATION_PROCESSED',
    resourceType: 'GraduationRecord',
    resourceId: record.id,
    newState: {
      studentId: validated.studentId,
      cgpa: evalResult.cgpa,
      degreeClassification: record.degreeClassification
    }
  });

  return record;
}
