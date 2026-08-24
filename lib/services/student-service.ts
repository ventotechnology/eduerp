import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { StudentCreateSchema, StudentUpdateSchema } from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';

export interface StudentFilterParams {
  search?: string;
  classId?: string;
  sectionId?: string;
  campusId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Retrieves paginated students strictly scoped to the tenant.
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

  if (params.status) {
    whereClause.status = params.status;
  }

  if (params.campusId) {
    whereClause.campusId = params.campusId;
  }

  if (params.sectionId) {
    whereClause.sectionId = params.sectionId;
  }

  if (params.classId) {
    whereClause.section = {
      classId: params.classId
    };
  }

  if (params.search) {
    whereClause.OR = [
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
      { studentIdNumber: { contains: params.search } },
      { rollNumber: { contains: params.search } },
      { phone: { contains: params.search } }
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
        invoices: {
          where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } }
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' }
        },
        hifzRecords: {
          take: 1,
          orderBy: { date: 'desc' }
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
          session: {
            include: {
              academicYear: true
            }
          }
        }
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
 * Creates a new student record in the database with audit trail.
 */
export async function createTenantStudent(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StudentCreateSchema.parse(rawData);

  // Validate campus belongs to tenant
  const campus = await db.campus.findFirst({
    where: {
      id: validated.campusId,
      institutionId: tenant.institutionId
    }
  });

  if (!campus) {
    throw AppError.notFound('Invalid Campus selected for this institution.');
  }

  // Check unique student ID
  const existing = await db.student.findFirst({
    where: {
      studentIdNumber: validated.studentIdNumber,
      campus: { institutionId: tenant.institutionId }
    }
  });

  if (existing) {
    throw AppError.conflict(`Student ID '${validated.studentIdNumber}' is already registered in this institution.`);
  }

  // Create Guardian if supplied
  let guardianId: string | undefined;
  if (validated.guardian) {
    const guardian = await db.guardian.create({
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

  const student = await db.student.create({
    data: {
      campusId: validated.campusId,
      studentIdNumber: validated.studentIdNumber,
      admissionNumber: validated.admissionNumber,
      rollNumber: validated.rollNumber || null,
      registrationNumber: validated.registrationNumber || null,
      firstName: validated.firstName,
      lastName: validated.lastName,
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

  if (guardianId) {
    await db.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId,
        relationshipType: 'PRIMARY',
        isPrimary: true
      }
    });
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'STUDENT_CREATED',
    resourceType: 'Student',
    resourceId: student.id,
    newState: {
      studentIdNumber: student.studentIdNumber,
      name: `${student.firstName} ${student.lastName}`,
      status: student.status
    }
  });

  return student;
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
  const student = await getTenantStudentById(tenantIdentifier, studentId);
  const validated = StudentUpdateSchema.parse(rawData);

  const updated = await db.student.update({
    where: { id: student.id },
    data: {
      rollNumber: validated.rollNumber !== undefined ? validated.rollNumber : student.rollNumber,
      firstName: validated.firstName || student.firstName,
      lastName: validated.lastName || student.lastName,
      phone: validated.phone !== undefined ? validated.phone : student.phone,
      email: validated.email !== undefined ? validated.email : student.email,
      presentAddress: validated.presentAddress || student.presentAddress,
      permanentAddress: validated.permanentAddress || student.permanentAddress,
      sectionId: validated.sectionId !== undefined ? validated.sectionId : student.sectionId,
      status: validated.status || student.status
    },
    include: {
      campus: true,
      section: true
    }
  });

  await logAuditEvent({
    tenantId: student.campus.institutionId,
    actor,
    action: 'STUDENT_UPDATED',
    resourceType: 'Student',
    resourceId: student.id,
    previousState: { status: student.status, roll: student.rollNumber },
    newState: { status: updated.status, roll: updated.rollNumber }
  });

  return updated;
}
