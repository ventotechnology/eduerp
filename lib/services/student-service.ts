import crypto from 'crypto';
import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { StudentCreateSchema, StudentUpdateSchema } from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { hashPassword } from '../auth/password';

export interface StudentFilterParams {
  search?: string;
  classId?: string;
  sectionId?: string;
  campusId?: string;
  academicYearId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Retrieves paginated students strictly scoped to the tenant with full active enrollment data.
 */
export async function getTenantStudents(tenantIdentifier: string, params: StudentFilterParams = {}) {
  const tenant = await requireTenant(tenantIdentifier);

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const whereClause: any = {
    campus: {
      institutionId: tenant.institutionId
    }
  };

  if (params.status && params.status !== 'ALL') {
    whereClause.status = params.status;
  }

  if (params.campusId) {
    whereClause.campusId = params.campusId;
  }

  if (params.sectionId) {
    whereClause.sectionId = params.sectionId;
  }

  if (params.classId) {
    whereClause.OR = [
      { section: { classId: params.classId } },
      { enrollments: { some: { classId: params.classId, status: 'ACTIVE' } } }
    ];
  }

  if (params.search) {
    const term = params.search.trim();
    whereClause.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { studentIdNumber: { contains: term, mode: 'insensitive' } },
      { rollNumber: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term } }
    ];
  }

  const [total, students] = await Promise.all([
    db.student.count({ where: whereClause }),
    db.student.findMany({
      where: whereClause,
      include: {
        campus: true,
        section: {
          include: {
            class: true
          }
        },
        batch: {
          include: {
            program: true
          }
        },
        guardian: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            section: true,
            shift: true,
            academicYear: true,
            campus: true,
            batch: {
              include: { program: true }
            }
          },
          orderBy: { enrollmentDate: 'desc' },
          take: 1
        }
      },
      skip,
      take: pageSize,
      orderBy: { studentIdNumber: 'asc' }
    })
  ]);

  return {
    students,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Retrieves a single student with strict tenant boundary check.
 */
export async function getTenantStudentById(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      campus: {
        institutionId: tenant.institutionId
      }
    },
    include: {
      campus: true,
      section: {
        include: {
          class: true
        }
      },
      batch: {
        include: {
          program: true
        }
      },
      guardian: true,
      guardianLinks: {
        include: {
          guardian: true
        }
      },
      enrollments: {
        include: {
          class: true,
          section: true,
          shift: true,
          academicYear: true,
          campus: true,
          batch: {
            include: { program: true }
          }
        },
        orderBy: { enrollmentDate: 'desc' }
      },
      invoices: {
        orderBy: { createdAt: 'desc' }
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30
      },
      hifzRecords: {
        orderBy: { date: 'desc' },
        take: 15
      },
      thesisRecords: true
    }
  });

  if (!student) {
    throw AppError.notFound(`Student with ID '${studentId}' does not exist in this institution.`);
  }

  return student;
}

/**
 * ATOMIC DIRECT ONBOARDING: Creates a new student record in database with Guardian and Enrollment.
 */
export async function createTenantStudent(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StudentCreateSchema.parse(rawData);

  // Validate campus belongs to tenant
  const campus = await db.campus.findFirst({
    where: {
      id: validated.campusId,
      institutionId: tenant.institutionId
    },
    include: { institution: true }
  });

  if (!campus) {
    throw AppError.notFound('Invalid Campus selected for this institution.');
  }

  // Resolve or retrieve active academic year
  let academicYearId = validated.academicYearId;
  if (!academicYearId) {
    const currentAy = await db.academicYear.findFirst({
      where: { institutionId: tenant.institutionId, isCurrent: true }
    });
    academicYearId = currentAy?.id || (await db.academicYear.findFirst({ where: { institutionId: tenant.institutionId } }))?.id || null;
  }

  return db.$transaction(
    async (tx) => {
      // 1. Generate unique student ID number if not provided: {INST_CODE}-{YEAR}-{SEQUENCE}
      let studentIdNumber = validated.studentIdNumber;
      if (!studentIdNumber) {
        const instCode = campus.institution.instituteCode?.toUpperCase() ||
          campus.institution.name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase() || 'EDU';
        const yearStr = new Date().getFullYear().toString();
        const totalCount = await tx.student.count({
          where: { campus: { institutionId: tenant.institutionId } }
        });
        let counter = 0;
        while (!studentIdNumber) {
          const candidate = `${instCode}-${yearStr}-${(totalCount + 1 + counter).toString().padStart(4, '0')}`;
          const existing = await tx.student.findFirst({
            where: {
              studentIdNumber: candidate,
              campus: { institutionId: tenant.institutionId }
            }
          });
          if (!existing) {
            studentIdNumber = candidate;
          } else {
            counter++;
          }
        }
      }

      // 2. Generate Roll Number if not provided
      let rollNumber = validated.rollNumber;
      if (!rollNumber && academicYearId) {
        const enrollmentCount = await tx.enrollment.count({
          where: {
            academicYearId,
            ...(validated.sectionId ? { sectionId: validated.sectionId } : { classId: validated.classId })
          }
        });
        rollNumber = (enrollmentCount + 1).toString().padStart(2, '0');
      }

      // 3. Admission number
      const admissionNumber = validated.admissionNumber || `ADM-${Date.now().toString().slice(-6)}`;

      // 4. Create Guardian if supplied
      let guardianId: string | undefined;
      if (validated.guardian) {
        const guardian = await tx.guardian.create({
          data: {
            fatherName: validated.guardian.fatherName,
            fatherPhone: validated.guardian.fatherPhone,
            fatherProfession: validated.guardian.fatherProfession || null,
            motherName: validated.guardian.motherName,
            motherPhone: validated.guardian.motherPhone || null,
            guardianName: validated.guardian.guardianName,
            guardianPhone: validated.guardian.guardianPhone,
            guardianRelation: validated.guardian.guardianRelation || 'Father'
          }
        });
        guardianId = guardian.id;
      }

      // 5. Create Student
      const student = await tx.student.create({
        data: {
          campusId: validated.campusId,
          studentIdNumber,
          admissionNumber,
          rollNumber: rollNumber || null,
          registrationNumber: validated.registrationNumber || null,
          firstName: validated.firstName,
          lastName: validated.lastName,
          photoUrl: validated.photoUrl || null,
          dateOfBirth: new Date(validated.dateOfBirth),
          gender: validated.gender,
          bloodGroup: validated.bloodGroup || null,
          religion: validated.religion || null,
          nationality: validated.nationality || 'Bangladeshi',
          nidBirthCertNumber: validated.nidBirthCertNumber || null,
          presentAddress: validated.presentAddress,
          permanentAddress: validated.permanentAddress,
          phone: validated.phone || null,
          email: validated.email || null,
          sectionId: validated.sectionId || null,
          batchId: validated.batchId || null,
          guardianId: guardianId || null,
          status: validated.status || 'ACTIVE'
        },
        include: {
          campus: true,
          section: true,
          guardian: true
        }
      });

      // 6. Create StudentGuardian link
      if (guardianId) {
        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId,
            relationshipType: 'PRIMARY',
            isPrimary: true
          }
        });
      }

      // 7. CRITICAL: Create Academic Enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYearId || null,
          campusId: validated.campusId,
          classId: validated.classId || null,
          sectionId: validated.sectionId || null,
          shiftId: validated.shiftId || null,
          batchId: validated.batchId || null,
          rollNumber: rollNumber || null,
          status: 'ACTIVE',
          academicStatus: 'REGULAR',
          hifzEnrolled: validated.hifzProgram ?? false,
          hifzProgram: validated.hifzProgram ? (validated.hifzProgramType || 'Hifzul Quran') : null,
          enrollmentDate: new Date()
        }
      });

      // 8. Finance Fee Invoice if configured
      let createdInvoice = null;
      if (validated.admissionFeeAmount && validated.admissionFeeAmount > 0) {
        createdInvoice = await tx.invoice.create({
          data: {
            studentId: student.id,
            invoiceNumber: `INV-DIR-${Date.now().toString().slice(-6)}`,
            title: 'Direct Admission & Session Fee',
            subTotal: validated.admissionFeeAmount,
            discountAmount: 0,
            fineAmount: 0,
            totalAmount: validated.admissionFeeAmount,
            paidAmount: 0,
            dueAmount: validated.admissionFeeAmount,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'UNPAID'
          }
        });
      }

      // 9. Optional Portal User Creation
      if (validated.createPortalAccount) {
        const studentEmail = validated.email || `student.${student.studentIdNumber.toLowerCase()}@${tenant.slug}.eduerp.us`;
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
        action: 'STUDENT_CREATED',
        resourceType: 'Student',
        resourceId: student.id,
        newState: {
          studentIdNumber: student.studentIdNumber,
          enrollmentId: enrollment.id,
          name: `${student.firstName} ${student.lastName}`,
          status: student.status
        }
      });

      return {
        ...student,
        student: { ...student },
        enrollment,
        invoice: createdInvoice
      };
    },
    { timeout: 25000, maxWait: 10000 }
  );
}

/**
 * Updates student fields with audit trail.
 */
export async function updateTenantStudent(
  tenantIdentifier: string,
  studentId: string,
  rawData: any,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const student = await getTenantStudentById(tenantIdentifier, studentId);
  const validated = StudentUpdateSchema.parse(rawData);

  const updated = await db.student.update({
    where: { id: student.id },
    data: {
      rollNumber: validated.rollNumber !== undefined ? validated.rollNumber : student.rollNumber,
      firstName: validated.firstName || student.firstName,
      lastName: validated.lastName || student.lastName,
      photoUrl: validated.photoUrl !== undefined ? validated.photoUrl : student.photoUrl,
      phone: validated.phone !== undefined ? validated.phone : student.phone,
      email: validated.email !== undefined ? validated.email : student.email,
      presentAddress: validated.presentAddress || student.presentAddress,
      permanentAddress: validated.permanentAddress || student.permanentAddress,
      sectionId: validated.sectionId !== undefined ? validated.sectionId : student.sectionId,
      status: validated.status || student.status
    },
    include: {
      campus: true,
      section: {
        include: {
          class: true
        }
      }
    }
  });

  // Update active enrollment section if section changed
  if (validated.sectionId && validated.sectionId !== student.sectionId) {
    const activeEnrollment = await db.enrollment.findFirst({
      where: { studentId: student.id, status: 'ACTIVE' },
      orderBy: { enrollmentDate: 'desc' }
    });
    if (activeEnrollment) {
      await db.enrollment.update({
        where: { id: activeEnrollment.id },
        data: {
          sectionId: validated.sectionId,
          rollNumber: validated.rollNumber || activeEnrollment.rollNumber
        }
      });
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'STUDENT_UPDATED',
    resourceType: 'Student',
    resourceId: student.id,
    previousState: { status: student.status, roll: student.rollNumber },
    newState: { status: updated.status, roll: updated.rollNumber }
  });

  return updated;
}
