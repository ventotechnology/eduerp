import crypto from 'crypto';
import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import {
  AdmissionApplicationSchema,
  AdmissionSettingSchema,
  ValidAdmissionTransitions,
  AdmissionTestSubmissionSchema
} from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { hashPassword } from '../auth/password';

/**
 * Retrieves or initializes admission settings for the institution.
 */
export async function getAdmissionSettings(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);

  let settings = await db.admissionSetting.findUnique({
    where: { institutionId: tenant.institutionId },
    include: { academicYear: true }
  });

  if (!settings) {
    const currentAy = await db.academicYear.findFirst({
      where: { institutionId: tenant.institutionId, isCurrent: true }
    });

    settings = await db.admissionSetting.create({
      data: {
        institutionId: tenant.institutionId,
        academicYearId: currentAy?.id || null,
        isOnlineAdmissionOpen: true,
        applicationFee: 0,
        admissionFeeDefault: 0,
        isTestRequired: false,
        isInterviewRequired: false,
        autoMeritCalculation: true,
        maxCapacityPerClass: 40,
        allowPortalUserCreation: true,
        applicationNumberPrefix: 'APP'
      },
      include: { academicYear: true }
    });
  }

  return settings;
}

/**
 * Updates admission settings for the institution.
 */
export async function updateAdmissionSettings(
  tenantIdentifier: string,
  rawData: any,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AdmissionSettingSchema.parse(rawData);

  const updated = await db.admissionSetting.upsert({
    where: { institutionId: tenant.institutionId },
    update: {
      isOnlineAdmissionOpen: validated.isOnlineAdmissionOpen,
      applicationStartDate: validated.applicationStartDate ? new Date(validated.applicationStartDate) : null,
      applicationEndDate: validated.applicationEndDate ? new Date(validated.applicationEndDate) : null,
      academicYearId: validated.academicYearId || null,
      applicationFee: validated.applicationFee,
      admissionFeeDefault: validated.admissionFeeDefault,
      isTestRequired: validated.isTestRequired,
      isInterviewRequired: validated.isInterviewRequired,
      autoMeritCalculation: validated.autoMeritCalculation,
      testWeight: validated.testWeight,
      previousResultWeight: validated.previousResultWeight,
      interviewWeight: validated.interviewWeight,
      maxCapacityPerClass: validated.maxCapacityPerClass,
      allowPortalUserCreation: validated.allowPortalUserCreation,
      instructionsText: validated.instructionsText || null,
      requiredDocumentsJson: validated.requiredDocumentsJson || null,
      applicationNumberPrefix: validated.applicationNumberPrefix || 'APP'
    },
    create: {
      institutionId: tenant.institutionId,
      isOnlineAdmissionOpen: validated.isOnlineAdmissionOpen,
      applicationStartDate: validated.applicationStartDate ? new Date(validated.applicationStartDate) : null,
      applicationEndDate: validated.applicationEndDate ? new Date(validated.applicationEndDate) : null,
      academicYearId: validated.academicYearId || null,
      applicationFee: validated.applicationFee,
      admissionFeeDefault: validated.admissionFeeDefault,
      isTestRequired: validated.isTestRequired,
      isInterviewRequired: validated.isInterviewRequired,
      autoMeritCalculation: validated.autoMeritCalculation,
      testWeight: validated.testWeight,
      previousResultWeight: validated.previousResultWeight,
      interviewWeight: validated.interviewWeight,
      maxCapacityPerClass: validated.maxCapacityPerClass,
      allowPortalUserCreation: validated.allowPortalUserCreation,
      instructionsText: validated.instructionsText || null,
      requiredDocumentsJson: validated.requiredDocumentsJson || null,
      applicationNumberPrefix: validated.applicationNumberPrefix || 'APP'
    },
    include: { academicYear: true }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ADMISSION_SETTINGS_UPDATED',
    resourceType: 'AdmissionSetting',
    resourceId: updated.id,
    newState: { isOnlineAdmissionOpen: updated.isOnlineAdmissionOpen, applicationFee: updated.applicationFee }
  });

  return updated;
}

/**
 * Creates an online or internal admission application.
 */
export async function createAdmissionApplication(
  tenantIdentifier: string,
  rawData: any,
  actor?: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AdmissionApplicationSchema.parse(rawData);

  // Validate campus belongs to tenant
  const campus = await db.campus.findFirst({
    where: {
      id: validated.campusId,
      institutionId: tenant.institutionId
    }
  });

  if (!campus) {
    throw AppError.notFound('Selected campus does not belong to this institution.');
  }

  // Validate academic year
  const academicYear = await db.academicYear.findFirst({
    where: {
      id: validated.academicYearId,
      institutionId: tenant.institutionId
    }
  });

  if (!academicYear) {
    throw AppError.notFound('Selected academic year does not exist in this institution.');
  }

  // Fetch settings for numbering prefix and fees
  const settings = await getAdmissionSettings(tenant.slug);

  if (!actor && !settings.isOnlineAdmissionOpen) {
    throw AppError.validation('Online admission applications are currently closed for this institution.');
  }

  // Generate Concurrency-Safe Unique Application Number: {PREFIX}-{YEAR}-{SEQUENCE}
  const count = await db.admissionApplication.count({
    where: { institutionId: tenant.institutionId }
  });
  const yearName = academicYear.name.replace(/[^0-9]/g, '').slice(0, 4) || new Date().getFullYear().toString();
  const prefix = settings.applicationNumberPrefix || 'APP';

  const appFee = validated.applicationFeeAmount ?? settings.applicationFee ?? 0;
  const initialFeeStatus = appFee > 0 ? 'PENDING' : 'NOT_REQUIRED';

  let application;
  let counter = 1;

  while (!application) {
    const candidate = `${prefix}-${yearName}-${(count + counter).toString().padStart(4, '0')}`;
    const existing = await db.admissionApplication.findUnique({
      where: { applicationNumber: candidate }
    });

    if (existing) {
      counter++;
      continue;
    }

    try {
      application = await db.admissionApplication.create({
        data: {
          institutionId: tenant.institutionId,
          campusId: validated.campusId,
          academicYearId: validated.academicYearId,
          applicationNumber: candidate,
          firstName: validated.firstName,
          middleName: validated.middleName || null,
          lastName: validated.lastName,
          photoUrl: validated.photoUrl || null,
          dateOfBirth: new Date(validated.dateOfBirth),
          gender: validated.gender,
          bloodGroup: validated.bloodGroup || null,
          religion: validated.religion || null,
          nationality: validated.nationality || 'Bangladeshi',
          nidBirthCertNumber: validated.nidBirthCertNumber || null,
          phone: validated.phone,
          email: validated.email || null,
          presentAddress: validated.presentAddress,
          permanentAddress: validated.permanentAddress,

          // Academic placement
          desiredClassId: validated.desiredClassId || null,
          desiredProgramId: validated.desiredProgramId || null,
          shiftId: validated.shiftId || null,
          sectionId: validated.sectionId || null,
          academicGroupId: validated.academicGroupId || null,
          subjectCombinationId: validated.subjectCombinationId || null,
          technologyTradeId: validated.technologyTradeId || null,
          batchId: validated.batchId || null,
          hifzProgram: validated.hifzProgram ?? false,

          // Guardian
          guardianName: validated.guardianName,
          guardianPhone: validated.guardianPhone,
          guardianRelation: validated.guardianRelation || 'Father',
          guardianOccupation: validated.guardianOccupation || null,
          fatherName: validated.fatherName || null,
          fatherPhone: validated.fatherPhone || null,
          fatherProfession: validated.fatherProfession || null,
          motherName: validated.motherName || null,
          motherPhone: validated.motherPhone || null,
          motherProfession: validated.motherProfession || null,

          // Previous education & documents
          previousSchool: validated.previousSchool || null,
          previousClass: validated.previousClass || null,
          previousGpa: validated.previousGpa ?? null,
          documentsJson: validated.documentsJson || null,

          // Initial status
          status: 'SUBMITTED',
          applicationFeeStatus: initialFeeStatus,
          applicationFeeAmount: appFee,
          admissionFeeStatus: 'PENDING',
          admissionFeeAmount: validated.admissionFeeAmount ?? settings.admissionFeeDefault ?? 0,
          waiverPercentage: 0
        },
        include: {
          campus: true,
          desiredClass: true,
          desiredProgram: true,
          shift: true,
          academicYear: true
        }
      });
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint failed')) {
        counter++;
        continue;
      }
      throw err;
    }
  }

  if (actor) {
    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'ADMISSION_APPLICATION_CREATED',
      resourceType: 'AdmissionApplication',
      resourceId: application.id,
      newState: { applicationNumber: application.applicationNumber, name: `${application.firstName} ${application.lastName}` }
    });
  }

  return application;
}

/**
 * Lists admission applications for the tenant with multi-faceted filtering.
 */
export async function getTenantAdmissionApplications(
  tenantIdentifier: string,
  params?: {
    status?: string;
    campusId?: string;
    classId?: string;
    programId?: string;
    academicYearId?: string;
    search?: string;
  }
) {
  const tenant = await requireTenant(tenantIdentifier);
  const whereClause: any = {
    institutionId: tenant.institutionId
  };

  if (params?.status && params.status !== 'ALL') {
    whereClause.status = params.status;
  }
  if (params?.campusId) {
    whereClause.campusId = params.campusId;
  }
  if (params?.classId) {
    whereClause.desiredClassId = params.classId;
  }
  if (params?.programId) {
    whereClause.desiredProgramId = params.programId;
  }
  if (params?.academicYearId) {
    whereClause.academicYearId = params.academicYearId;
  }

  if (params?.search) {
    const term = params.search.trim();
    whereClause.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { applicationNumber: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term } },
      { guardianName: { contains: term, mode: 'insensitive' } },
      { guardianPhone: { contains: term } }
    ];
  }

  return db.admissionApplication.findMany({
    where: whereClause,
    include: {
      campus: true,
      desiredClass: true,
      desiredProgram: true,
      shift: true,
      section: true,
      academicYear: true,
      testAttempts: {
        include: { test: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Retrieves a single application by ID with full relations.
 */
export async function getAdmissionApplicationById(tenantIdentifier: string, applicationId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const app = await db.admissionApplication.findFirst({
    where: {
      id: applicationId,
      institutionId: tenant.institutionId
    },
    include: {
      campus: true,
      desiredClass: true,
      desiredProgram: true,
      shift: true,
      section: true,
      academicGroup: true,
      subjectCombination: true,
      technologyTrade: true,
      batch: true,
      academicYear: true,
      testAttempts: {
        include: { test: true }
      }
    }
  });

  if (!app) {
    throw AppError.notFound(`Application with ID '${applicationId}' not found.`);
  }

  return app;
}

/**
 * Transitions application status through the verified state machine.
 */
export async function transitionAdmissionStatus(
  tenantIdentifier: string,
  applicationId: string,
  targetStatus: string,
  actor: SessionUser,
  notes?: string,
  interviewScore?: number
) {
  const tenant = await requireTenant(tenantIdentifier);
  const app = await db.admissionApplication.findFirst({
    where: {
      id: applicationId,
      institutionId: tenant.institutionId
    }
  });

  if (!app) {
    throw AppError.notFound(`Application with ID '${applicationId}' not found.`);
  }

  const allowedNext = ValidAdmissionTransitions[app.status] || [];
  if (!allowedNext.includes(targetStatus)) {
    throw AppError.invalidTransition(app.status, targetStatus);
  }

  const updateData: any = {
    status: targetStatus
  };

  if (interviewScore !== undefined && interviewScore !== null) {
    updateData.interviewScore = interviewScore;
    updateData.interviewDate = new Date();
  }
  if (notes) {
    updateData.interviewNotes = notes;
  }

  const updated = await db.admissionApplication.update({
    where: { id: app.id },
    data: updateData
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ADMISSION_STATUS_TRANSITION',
    resourceType: 'AdmissionApplication',
    resourceId: app.id,
    previousState: { status: app.status },
    newState: { status: targetStatus, notes, interviewScore }
  });

  return updated;
}

/**
 * Evaluates admission test server-side and stores persistent test attempt.
 */
export async function submitAdmissionTest(tenantIdentifier: string, rawData: any) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AdmissionTestSubmissionSchema.parse(rawData);

  const application = await db.admissionApplication.findFirst({
    where: {
      id: validated.applicationId,
      institutionId: tenant.institutionId
    }
  });

  if (!application) {
    throw AppError.notFound('Application not found.');
  }

  const test = await db.admissionTest.findFirst({
    where: {
      id: validated.testId,
      institutionId: tenant.institutionId
    }
  });

  if (!test) {
    throw AppError.notFound('Admission test not found.');
  }

  // Parse persistent questions and evaluate answers server-side
  let questions: Array<{ id: string; correct: string; marks?: number }> = [];
  try {
    questions = JSON.parse(test.questionsJson);
  } catch {
    questions = [];
  }

  let totalEarned = 0;
  let totalPossible = test.totalMarks || (questions.length * 10);
  const marksPerQ = questions.length > 0 ? (totalPossible / questions.length) : 10;

  questions.forEach((q) => {
    if (validated.answers[q.id] && validated.answers[q.id] === q.correct) {
      totalEarned += (q.marks || marksPerQ);
    }
  });

  const finalScore = Math.round(totalEarned * 10) / 10;

  const attempt = await db.admissionTestAttempt.create({
    data: {
      applicationId: application.id,
      testId: test.id,
      submittedAt: new Date(),
      answersJson: JSON.stringify(validated.answers),
      score: finalScore,
      isEvaluated: true
    }
  });

  const isPassed = finalScore >= test.passMarks;
  const nextStatus = isPassed ? 'TESTED' : 'WAITLISTED';

  await db.admissionApplication.update({
    where: { id: application.id },
    data: {
      testScore: finalScore,
      status: nextStatus
    }
  });

  return {
    attemptId: attempt.id,
    score: finalScore,
    totalMarks: test.totalMarks,
    passMarks: test.passMarks,
    isPassed,
    status: nextStatus
  };
}

/**
 * ATOMIC PRISMA TRANSACTION: Converts an admitted applicant into a full Student with Enrollment & Guardian.
 */
export async function convertApplicantToStudent(
  tenantIdentifier: string,
  applicationId: string,
  targetSectionId: string | null,
  actor: SessionUser,
  options?: {
    customRollNumber?: string;
    createPortalAccount?: boolean;
    createGuardianAccount?: boolean;
  }
) {
  const tenant = await requireTenant(tenantIdentifier);

  const application = await db.admissionApplication.findFirst({
    where: {
      id: applicationId,
      institutionId: tenant.institutionId
    },
    include: {
      institution: true,
      campus: true,
      desiredClass: true,
      desiredProgram: true,
      academicYear: true
    }
  });

  if (!application) {
    throw AppError.notFound('Application not found.');
  }

  if (application.status === 'ADMITTED' || application.admittedStudentId) {
    throw AppError.conflict('Applicant has already been admitted and enrolled as an active student.');
  }

  const settings = await getAdmissionSettings(tenant.slug);

  return db.$transaction(
    async (tx) => {
      // 1. Generate unique student ID number: {INST_CODE}-{YEAR}-{SEQUENCE}
      const instCode = application.institution.instituteCode?.toUpperCase() ||
        application.institution.shortName?.toUpperCase() ||
        'STU';
      const yearName = application.academicYear.name.replace(/[^0-9]/g, '').slice(0, 4) || new Date().getFullYear().toString();

      const totalStudentCount = await tx.student.count({
        where: { campus: { institutionId: application.institutionId } }
      });
      let studentIdNumber = '';
      let studentCounter = 0;
      while (!studentIdNumber) {
        const candidate = `${instCode}-${yearName}-${(totalStudentCount + 1 + studentCounter).toString().padStart(4, '0')}`;
        const existing = await tx.student.findFirst({
          where: {
            studentIdNumber: candidate,
            campus: { institutionId: application.institutionId }
          }
        });
        if (!existing) {
          studentIdNumber = candidate;
        } else {
          studentCounter++;
        }
      }

      // 2. Generate Roll Number scoped to Academic Year and Section/Class
      const activeSectionId = targetSectionId || application.sectionId || null;
      let rollNumber = options?.customRollNumber;

      if (!rollNumber) {
        const classEnrollmentCount = await tx.enrollment.count({
          where: {
            academicYearId: application.academicYearId,
            ...(activeSectionId ? { sectionId: activeSectionId } : { classId: application.desiredClassId })
          }
        });
        rollNumber = (classEnrollmentCount + 1).toString().padStart(2, '0');
      }

      // 3. Create Real Guardian Record
      const guardian = await tx.guardian.create({
        data: {
          fatherName: application.fatherName || application.guardianName,
          fatherPhone: application.fatherPhone || application.guardianPhone,
          fatherProfession: application.fatherProfession || application.guardianOccupation || null,
          motherName: application.motherName || application.guardianName || 'Guardian',
          motherPhone: application.motherPhone || null,
          guardianName: application.guardianName,
          guardianPhone: application.guardianPhone,
          guardianRelation: application.guardianRelation || 'Father'
        }
      });

      // 4. Create Student Record
      const student = await tx.student.create({
        data: {
          campusId: application.campusId,
          studentIdNumber,
          admissionNumber: application.applicationNumber,
          rollNumber,
          firstName: application.firstName,
          lastName: application.lastName,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          bloodGroup: application.bloodGroup,
          religion: application.religion,
          nationality: application.nationality || 'Bangladeshi',
          nidBirthCertNumber: application.nidBirthCertNumber,
          presentAddress: application.presentAddress,
          permanentAddress: application.permanentAddress,
          phone: application.phone,
          email: application.email,
          sectionId: activeSectionId,
          batchId: application.batchId,
          guardianId: guardian.id,
          status: 'ACTIVE'
        }
      });

      // 5. Create StudentGuardian junction link
      await tx.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          relationshipType: 'PRIMARY',
          isPrimary: true
        }
      });

      // 6. CRITICAL: Create Complete Academic Enrollment Record
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: application.academicYearId,
          campusId: application.campusId,
          classId: application.desiredClassId,
          sectionId: activeSectionId,
          shiftId: application.shiftId,
          batchId: application.batchId,
          rollNumber,
          status: 'ACTIVE',
          academicStatus: 'REGULAR',
          hifzEnrolled: application.hifzProgram,
          hifzProgram: application.hifzProgram ? 'Hifzul Quran' : null,
          enrollmentDate: new Date()
        }
      });

      // 7. Finance Fee Invoice: Only create if fee > 0, leave UNPAID (do NOT fake mark PAID)
      const feeAmount = application.admissionFeeAmount ?? settings.admissionFeeDefault ?? 0;
      let createdInvoice = null;

      if (feeAmount > 0) {
        const discount = application.waiverPercentage ? (feeAmount * (application.waiverPercentage / 100)) : 0;
        const total = Math.max(0, feeAmount - discount);

        createdInvoice = await tx.invoice.create({
          data: {
            studentId: student.id,
            invoiceNumber: `INV-ADM-${Date.now().toString().slice(-6)}`,
            title: `Admission & Session Fee (${application.academicYear.name})`,
            subTotal: feeAmount,
            discountAmount: discount,
            fineAmount: 0,
            totalAmount: total,
            paidAmount: 0,
            dueAmount: total,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days due
            status: 'UNPAID'
          }
        });
      }

      // 8. Update Application Status to ADMITTED
      await tx.admissionApplication.update({
        where: { id: application.id },
        data: {
          status: 'ADMITTED',
          admittedStudentId: student.id,
          admissionFeeStatus: feeAmount > 0 ? 'PENDING' : 'NOT_REQUIRED'
        }
      });

      // 9. Optional Student User Account
      if (options?.createPortalAccount || settings.allowPortalUserCreation) {
        const studentEmail = application.email || `student.${student.studentIdNumber.toLowerCase()}@${tenant.slug}.eduerp.us`;
        const existingUser = await tx.user.findFirst({ where: { email: studentEmail } });
        if (!existingUser) {
          const tempPassword = crypto.randomBytes(16).toString('hex');
          const defaultPassword = hashPassword(tempPassword);
          const user = await tx.user.create({
            data: {
              email: studentEmail,
              passwordHash: defaultPassword,
              name: `${student.firstName} ${student.lastName}`,
              role: 'STUDENT',
              status: 'ACTIVE',
              tenantId: tenant.tenantId
            }
          });
          await tx.student.update({
            where: { id: student.id },
            data: { userId: user.id }
          });
        }
      }

      // 10. Audit Log
      await logAuditEvent({
        tenantId: tenant.tenantId,
        actor,
        action: 'APPLICANT_CONVERTED_TO_STUDENT',
        resourceType: 'Student',
        resourceId: student.id,
        newState: {
          studentIdNumber: student.studentIdNumber,
          applicationNumber: application.applicationNumber,
          enrollmentId: enrollment.id,
          name: `${student.firstName} ${student.lastName}`
        }
      });

      return {
        ...student,
        student: { ...student },
        enrollment,
        guardian,
        invoice: createdInvoice
      };
    },
    { timeout: 25000, maxWait: 10000 }
  );
}
