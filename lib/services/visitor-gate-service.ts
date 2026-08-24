import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  VisitorRecordCreateSchema,
  VisitorCheckOutSchema,
  StudentPickupAuthCreateSchema,
  VehicleGateLogCreateSchema,
} from '@/lib/validations/schemas';

export async function registerVisitor(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VisitorRecordCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Campus not found.');

  const count = await db.visitorRecord.count({ where: { institutionId: tenant.institutionId } });
  const passNumber = `PASS-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

  const visitor = await db.visitorRecord.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      passNumber,
      visitorName: validated.visitorName,
      phone: validated.phone,
      idProofType: validated.idProofType,
      idProofNumber: validated.idProofNumber,
      organization: validated.organization,
      purpose: validated.purpose,
      visitingPersonType: validated.visitingPersonType,
      hostEmployeeId: validated.hostEmployeeId,
      studentId: validated.studentId,
      gateName: validated.gateName,
      entryTime: new Date(),
      status: 'CHECKED_IN',
      gateStaffUserId: actor.id,
    },
    include: { campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'VISITOR',
    action: 'CREATE',
    resourceId: visitor.id,
    newState: { passNumber, visitorName: visitor.visitorName },
  });

  return visitor;
}

export async function checkOutVisitor(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VisitorCheckOutSchema.parse(rawData);

  const visitor = await db.visitorRecord.findFirst({
    where: { id: validated.visitorId, institutionId: tenant.institutionId },
  });
  if (!visitor || visitor.status !== 'CHECKED_IN') {
    throw AppError.notFound('Active visitor pass not found.');
  }

  return db.visitorRecord.update({
    where: { id: visitor.id },
    data: {
      status: 'CHECKED_OUT',
      exitTime: new Date(),
    },
  });
}

export async function getVisitorLogs(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.visitorRecord.findMany({
    where: { institutionId: tenant.institutionId },
    include: { campus: true },
    orderBy: { entryTime: 'desc' },
    take: 100,
  });
}

export async function createStudentPickupAuthorization(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StudentPickupAuthCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found in this institution.');

  return db.studentPickupAuthorization.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
            authorizedPersonName: validated.authorizedPersonName,
      phone: validated.phone,
      nidNumber: validated.nidNumber,
      photoUrl: validated.photoUrl,
      relationToStudent: validated.relationToStudent,
      isActive: true,
    },
    include: { student: true },
  });
}

export async function getStudentPickupAuthorizations(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.studentPickupAuthorization.findMany({
    where: { institutionId: tenant.institutionId, studentId, isActive: true },
  });
}

export async function recordVehicleGateEntry(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VehicleGateLogCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Campus not found.');

  return db.vehicleGateLog.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      vehiclePlateNumber: validated.vehiclePlateNumber,
      driverName: validated.driverName,
      driverPhone: validated.driverPhone,
      vehicleType: validated.vehicleType,
      purpose: validated.purpose,
      gateName: validated.gateName,
      entryTime: new Date(),
      recordedBy: actor.name,
    },
  });
}

export async function recordVehicleGateExit(tenantIdentifier: string, logId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const log = await db.vehicleGateLog.findFirst({
    where: { id: logId, institutionId: tenant.institutionId },
  });
  if (!log) throw AppError.notFound('Vehicle gate log not found.');

  return db.vehicleGateLog.update({
    where: { id: log.id },
    data: { exitTime: new Date() },
  });
}
