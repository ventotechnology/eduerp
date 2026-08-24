import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser, UserStatus } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  EmployeeCreateSchema,
  EmployeeUpdateSchema,
  PositionCreateSchema,
  FacultyProfileSchema,
  EmployeeDocumentCreateSchema,
  EmployeeQualificationCreateSchema,
  EmployeeExperienceCreateSchema,
} from '@/lib/validations/schemas';

// Field-level privacy helper
export function sanitizeEmployeeForRole(employee: any, actorRole: string): any {
  const isPrivileged = [
    'PLATFORM_SUPER_ADMIN',
    'PLATFORM_ADMIN',
    'SUPER_ADMIN',
    'OWNER',
    'HR_MANAGER',
    'PRINCIPAL',
    'ACCOUNTANT',
  ].includes(actorRole);

  if (isPrivileged) return employee;

  // Mask sensitive financial and disciplinary details for general viewing
  const { basicSalary, bankAccount, salaryAssignments, loans, salaryAdvances, disciplinaryCases, grievances, ...safeData } = employee;
  return {
    ...safeData,
    basicSalary: null,
    bankAccount: null,
  };
}

export async function createEmployee(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeCreateSchema.parse(rawData);

  // Validate campus belongs to tenant
  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.validation('Selected campus does not exist in this institution.');

  // Validate department if provided
  if (validated.departmentId) {
    const dept = await db.department.findFirst({
      where: { id: validated.departmentId, institutionId: tenant.institutionId },
    });
    if (!dept) throw AppError.validation('Selected department does not exist in this institution.');
  }

  // Validate position if provided
  if (validated.positionId) {
    const pos = await db.position.findFirst({
      where: { id: validated.positionId, institutionId: tenant.institutionId },
    });
    if (!pos) throw AppError.validation('Selected position does not exist in this institution.');
  }

  // Check unique employee code in institution
  const existing = await db.employee.findFirst({
    where: {
      campus: { institutionId: tenant.institutionId },
      employeeCode: validated.employeeCode,
    },
  });
  if (existing) throw AppError.conflict(`Employee code '${validated.employeeCode}' is already in use.`);

  const employee = await db.employee.create({
    data: {
      campusId: validated.campusId,
      employeeCode: validated.employeeCode,
      firstName: validated.firstName,
      lastName: validated.lastName,
      photoUrl: validated.photoUrl,
      designation: validated.designation,
      departmentId: validated.departmentId,
      department: validated.department,
      positionId: validated.positionId,
      supervisorId: validated.supervisorId,
      category: validated.category,
      status: validated.status,
      academicRank: validated.academicRank,
      joiningDate: new Date(validated.joiningDate),
      employmentType: validated.employmentType,
      basicSalary: validated.basicSalary,
      phone: validated.phone,
      email: validated.email,
      nidNumber: validated.nidNumber,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
      gender: validated.gender,
      nationality: validated.nationality || 'Bangladeshi',
      bloodGroup: validated.bloodGroup,
      presentAddress: validated.presentAddress,
      permanentAddress: validated.permanentAddress,
      emergencyContactName: validated.emergencyContactName,
      emergencyContactPhone: validated.emergencyContactPhone,
      emergencyContactRelation: validated.emergencyContactRelation,
    },
    include: {
      campus: true,
      departmentRel: true,
      position: true,
      supervisor: true,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'EMPLOYEES',
    action: 'CREATE',
    resourceId: employee.id,
    newState: { employeeCode: employee.employeeCode, designation: employee.designation },
  });

  return employee;
}

export async function updateEmployee(
  tenantIdentifier: string,
  employeeId: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeUpdateSchema.parse(rawData);

  const existing = await db.employee.findFirst({
    where: { id: employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!existing) throw AppError.notFound('Employee not found in this institution.');

  const updated = await db.employee.update({
    where: { id: employeeId },
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      photoUrl: validated.photoUrl,
      designation: validated.designation,
      departmentId: validated.departmentId,
      department: validated.department,
      positionId: validated.positionId,
      supervisorId: validated.supervisorId,
      category: validated.category,
      status: validated.status,
      academicRank: validated.academicRank,
      employmentType: validated.employmentType,
      basicSalary: validated.basicSalary,
      phone: validated.phone,
      email: validated.email,
      nidNumber: validated.nidNumber,
      presentAddress: validated.presentAddress,
      permanentAddress: validated.permanentAddress,
      emergencyContactName: validated.emergencyContactName,
      emergencyContactPhone: validated.emergencyContactPhone,
      emergencyContactRelation: validated.emergencyContactRelation,
    },
    include: {
      campus: true,
      departmentRel: true,
      position: true,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'EMPLOYEES',
    action: 'UPDATE',
    resourceId: employeeId,
    newState: { updatedFields: Object.keys(validated) },
  });

  return updated;
}

export async function getEmployeeDirectory(
  tenantIdentifier: string,
  filters: {
    campusId?: string;
    departmentId?: string;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
  actor?: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {
    campus: { institutionId: tenant.institutionId },
  };

  if (filters.campusId) where.campusId = filters.campusId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { employeeCode: { contains: filters.search } },
      { email: { contains: filters.search } },
      { designation: { contains: filters.search } },
    ];
  }

  const [total, employees] = await Promise.all([
    db.employee.count({ where }),
    db.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { employeeCode: 'asc' },
      include: {
        campus: true,
        departmentRel: true,
        position: true,
        supervisor: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    }),
  ]);

  const sanitized = employees.map((e) =>
    sanitizeEmployeeForRole(e, actor?.role || 'TEACHER')
  );

  return {
    data: sanitized,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmployeeProfile(
  tenantIdentifier: string,
  employeeId: string,
  actor?: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const employee = await db.employee.findFirst({
    where: { id: employeeId, campus: { institutionId: tenant.institutionId } },
    include: {
      campus: true,
      departmentRel: true,
      position: true,
      supervisor: true,
      subordinates: true,
      facultyProfile: true,
      bankAccount: true,
      documents: true,
      qualifications: { orderBy: { passingYear: 'desc' } },
      experiences: { orderBy: { startDate: 'desc' } },
      contracts: { orderBy: { startDate: 'desc' } },
      onboardings: true,
      salaryAssignments: {
        include: { salaryStructure: true },
        orderBy: { effectiveDate: 'desc' },
      },
      leaveBalances: { include: { leaveType: true } },
      promotions: { orderBy: { effectiveDate: 'desc' } },
      transfers: { orderBy: { effectiveDate: 'desc' } },
      skills: true,
      trainings: { include: { trainingProgram: true } },
      disciplinaryCases: true,
      warnings: true,
    },
  });

  if (!employee) throw AppError.notFound('Employee profile not found.');

  return sanitizeEmployeeForRole(employee, actor?.role || 'TEACHER');
}

// ----------------------------------------------------
// Positions & Headcount Management
// ----------------------------------------------------
export async function createPosition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PositionCreateSchema.parse(rawData);

  if (validated.campusId) {
    const campus = await db.campus.findFirst({
      where: { id: validated.campusId, institutionId: tenant.institutionId },
    });
    if (!campus) throw AppError.validation('Selected campus does not exist in this institution.');
  }

  if (validated.departmentId) {
    const dept = await db.department.findFirst({
      where: { id: validated.departmentId, institutionId: tenant.institutionId },
    });
    if (!dept) throw AppError.validation('Selected department does not exist in this institution.');
  }

  const existing = await db.position.findFirst({
    where: {
      institutionId: tenant.institutionId,
      positionCode: validated.positionCode,
    },
  });
  if (existing) throw AppError.conflict(`Position code '${validated.positionCode}' already exists.`);

  const position = await db.position.create({
    data: {
      institutionId: tenant.institutionId,
      positionCode: validated.positionCode,
      title: validated.title,
      campusId: validated.campusId,
      departmentId: validated.departmentId,
      category: validated.category,
      grade: validated.grade,
      reportsToPositionId: validated.reportsToPositionId,
      authorizedHeadcount: validated.authorizedHeadcount,
      isActive: validated.isActive,
    },
    include: {
      department: true,
      campus: true,
      reportsToPosition: true,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'POSITION',
    action: 'CREATE',
    resourceId: position.id,
    newState: { code: position.positionCode, title: position.title },
  });

  return position;
}

export async function getPositions(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const positions = await db.position.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      department: true,
      campus: true,
      reportsToPosition: true,
      employees: {
        where: { status: { in: ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_LEAVE'] } },
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { positionCode: 'asc' },
  });

  return positions.map((p) => ({
    ...p,
    filledHeadcount: p.employees.length,
    vacantHeadcount: Math.max(0, p.authorizedHeadcount - p.employees.length),
  }));
}

// ----------------------------------------------------
// Documents, Qualifications & Experiences
// ----------------------------------------------------
export async function addEmployeeDocument(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeDocumentCreateSchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  return db.employeeDocument.create({
    data: {
      employeeId: validated.employeeId,
      documentType: validated.documentType,
      title: validated.title,
      documentNumber: validated.documentNumber,
      issueDate: validated.issueDate ? new Date(validated.issueDate) : null,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
      verificationStatus: validated.verificationStatus,
      fileUrl: validated.fileUrl,
    },
  });
}

export async function addEmployeeQualification(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeQualificationCreateSchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  return db.employeeQualification.create({
    data: {
      employeeId: validated.employeeId,
      degree: validated.degree,
      subject: validated.subject,
      institution: validated.institution,
      country: validated.country,
      passingYear: validated.passingYear,
      resultGrade: validated.resultGrade,
      certificateUrl: validated.certificateUrl,
    },
  });
}

export async function addEmployeeExperience(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeExperienceCreateSchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  return db.employeeExperience.create({
    data: {
      employeeId: validated.employeeId,
      employerName: validated.employerName,
      positionTitle: validated.positionTitle,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      durationMonths: validated.durationMonths,
      referenceContact: validated.referenceContact,
    },
  });
}

// ----------------------------------------------------
// Faculty Profile
// ----------------------------------------------------
export async function upsertFacultyProfile(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FacultyProfileSchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Employee not found.');

  return db.facultyProfile.upsert({
    where: { employeeId: validated.employeeId },
    update: {
      academicRank: validated.academicRank,
      specialization: validated.specialization,
      researchArea: validated.researchArea,
      officeRoom: validated.officeRoom,
      officeHours: validated.officeHours,
      biography: validated.biography,
      orcidId: validated.orcidId,
      googleScholarUrl: validated.googleScholarUrl,
    },
    create: {
      employeeId: validated.employeeId,
      academicRank: validated.academicRank,
      specialization: validated.specialization,
      researchArea: validated.researchArea,
      officeRoom: validated.officeRoom,
      officeHours: validated.officeHours,
      biography: validated.biography,
      orcidId: validated.orcidId,
      googleScholarUrl: validated.googleScholarUrl,
    },
  });
}
