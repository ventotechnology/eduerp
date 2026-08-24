import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  HostelCreateSchema,
  HostelBlockCreateSchema,
  HostelRoomCreateSchema,
  HostelBedCreateSchema,
  HostelApplicationCreateSchema,
  HostelAllocationCreateSchema,
  HostelCheckInCreateSchema,
  HostelTransferCreateSchema,
  HostelVisitorLogCreateSchema,
  HostelAttendanceCreateSchema,
} from '@/lib/validations/schemas';

export async function createHostelMaster(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus does not exist in this institution.');

  const existing = await db.hostelMaster.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Hostel code '${validated.code}' already exists.`);

  const hostel = await db.hostelMaster.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      code: validated.code,
      name: validated.name,
      type: validated.type,
      address: validated.address,
      wardenName: validated.wardenName,
      wardenPhone: validated.wardenPhone,
      capacity: validated.capacity,
      status: validated.status,
    },
    include: { campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'HOSTEL',
    action: 'CREATE',
    resourceId: hostel.id,
    newState: { code: hostel.code, name: hostel.name },
  });

  return hostel;
}

export async function getHostels(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.hostelMaster.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      blocks: {
        include: {
          rooms: {
            include: { beds: true },
          },
        },
      },
      rooms: {
        include: { beds: true },
      },
    },
    orderBy: { code: 'asc' },
  });
}

export async function createHostelBlock(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelBlockCreateSchema.parse(rawData);

  const hostel = await db.hostelMaster.findFirst({
    where: { id: validated.hostelId, institutionId: tenant.institutionId },
  });
  if (!hostel) throw AppError.notFound('Hostel not found.');

  return db.hostelBlock.create({
    data: {
      hostelId: validated.hostelId,
      name: validated.name,
      code: validated.code,
      totalFloors: validated.totalFloors,
    },
  });
}

export async function createHostelRoom(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelRoomCreateSchema.parse(rawData);

  const hostel = await db.hostelMaster.findFirst({
    where: { id: validated.hostelId, institutionId: tenant.institutionId },
  });
  if (!hostel) throw AppError.notFound('Hostel not found.');

  return db.hostelRoom.create({
    data: {
      hostelId: validated.hostelId,
      blockId: validated.blockId,
      roomNumber: validated.roomNumber,
      floorNumber: validated.floorNumber,
      roomType: validated.roomType,
      capacity: validated.capacity,
      monthlyRent: validated.monthlyRent,
      hasAttachedBath: validated.hasAttachedBath,
      hasAirConditioner: validated.hasAirConditioner,
      status: validated.status,
    },
  });
}

export async function createHostelBed(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelBedCreateSchema.parse(rawData);

  const room = await db.hostelRoom.findFirst({
    where: { id: validated.roomId, hostel: { institutionId: tenant.institutionId } },
  });
  if (!room) throw AppError.notFound('Hostel room not found.');

  return db.hostelBed.create({
    data: {
      roomId: validated.roomId,
      bedNumber: validated.bedNumber,
      status: validated.status,
    },
  });
}

export async function submitHostelApplication(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelApplicationCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const hostel = await db.hostelMaster.findFirst({
    where: { id: validated.hostelId, institutionId: tenant.institutionId },
  });
  if (!hostel) throw AppError.notFound('Hostel not found.');

  return db.hostelApplication.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
      hostelId: validated.hostelId,
      preferredRoomType: validated.preferredRoomType,
      status: 'SUBMITTED',
    },
    include: { student: true, hostel: true },
  });
}

export async function allocateHostelBed(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelAllocationCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const bed = await db.hostelBed.findFirst({
    where: { id: validated.bedId, room: { hostel: { institutionId: tenant.institutionId } } },
    include: { room: { include: { hostel: true } } },
  });
  if (!bed) throw AppError.notFound('Hostel bed not found.');

  if (bed.status !== 'AVAILABLE') {
    throw AppError.conflict(`Hostel bed '${bed.bedNumber}' in Room '${bed.room.roomNumber}' is already occupied or unavailable (Status: ${bed.status}).`);
  }

  // Prevent double allocation for student
  const activeAllocation = await db.hostelAllocation.findFirst({
    where: { studentId: validated.studentId, status: 'ACTIVE' },
  });
  if (activeAllocation) {
    throw AppError.conflict('Student is already actively allocated to a hostel bed.');
  }

  return db.$transaction(async (tx) => {
    // 1. Mark bed as OCCUPIED
    await tx.hostelBed.update({
      where: { id: bed.id },
      data: { status: 'OCCUPIED' },
    });

    // 2. Create Allocation
    const allocation = await tx.hostelAllocation.create({
      data: {
        institutionId: tenant.institutionId,
        studentId: validated.studentId,
        bedId: bed.id,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        depositAmount: validated.depositAmount,
        monthlyFee: validated.monthlyFee || bed.room.monthlyRent,
        status: 'ACTIVE',
        allocatedBy: actor.name,
      },
      include: {
        bed: { include: { room: { include: { hostel: true } } } },
        student: true,
      },
    });

    // 3. Mark application as ALLOCATED if exists
    const app = await tx.hostelApplication.findFirst({
      where: { studentId: validated.studentId, hostelId: bed.room.hostelId, status: { in: ['SUBMITTED', 'APPROVED'] } },
    });
    if (app) {
      await tx.hostelApplication.update({
        where: { id: app.id },
        data: { status: 'ALLOCATED' },
      });
    }

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'HOSTEL',
      action: 'CREATE',
      resourceId: allocation.id,
      newState: {
        studentId: student.id,
        hostel: bed.room.hostel.name,
        roomNumber: bed.room.roomNumber,
        bedNumber: bed.bedNumber,
      },
    });

    return allocation;
  });
}

export async function checkInHostelResident(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelCheckInCreateSchema.parse(rawData);

  const allocation = await db.hostelAllocation.findFirst({
    where: { id: validated.allocationId, institutionId: tenant.institutionId },
  });
  if (!allocation || allocation.status !== 'ACTIVE') {
    throw AppError.notFound('Active hostel allocation record not found.');
  }

  return db.hostelCheckIn.create({
    data: {
      allocationId: validated.allocationId,
      checkInDate: new Date(),
      initialBedCondition: validated.initialBedCondition,
      keyCardNumber: validated.keyCardNumber,
      depositPaid: validated.depositPaid,
      remarks: validated.remarks,
      checkedInBy: actor.name,
    },
  });
}

export async function transferHostelBed(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelTransferCreateSchema.parse(rawData);

  const allocation = await db.hostelAllocation.findFirst({
    where: { id: validated.allocationId, institutionId: tenant.institutionId },
    include: { bed: true },
  });
  if (!allocation || allocation.status !== 'ACTIVE') {
    throw AppError.notFound('Active hostel allocation not found.');
  }

  const targetBed = await db.hostelBed.findFirst({
    where: { id: validated.newBedId, room: { hostel: { institutionId: tenant.institutionId } } },
  });
  if (!targetBed || targetBed.status !== 'AVAILABLE') {
    throw AppError.conflict('Target bed is not available for transfer.');
  }

  return db.$transaction(async (tx) => {
    // 1. Release previous bed
    await tx.hostelBed.update({
      where: { id: allocation.bedId },
      data: { status: 'AVAILABLE' },
    });

    // 2. Occupy new bed
    await tx.hostelBed.update({
      where: { id: targetBed.id },
      data: { status: 'OCCUPIED' },
    });

    // 3. Record transfer log
    const transferLog = await tx.hostelTransferHistory.create({
      data: {
        allocationId: allocation.id,
        studentId: allocation.studentId,
        previousBedId: allocation.bedId,
        newBedId: targetBed.id,
        transferDate: new Date(),
        reason: validated.reason,
        approvedBy: actor.name,
      },
    });

    // 4. Update allocation with new bed
    await tx.hostelAllocation.update({
      where: { id: allocation.id },
      data: { bedId: targetBed.id },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'HOSTEL',
      action: 'UPDATE',
      resourceId: allocation.id,
      newState: {
        action: 'HOSTEL_ROOM_TRANSFER',
        previousBedId: allocation.bedId,
        newBedId: targetBed.id,
      },
    });

    return transferLog;
  });
}

export async function checkOutHostelResident(tenantIdentifier: string, allocationId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const allocation = await db.hostelAllocation.findFirst({
    where: { id: allocationId, institutionId: tenant.institutionId },
    include: { bed: true },
  });
  if (!allocation || allocation.status !== 'ACTIVE') {
    throw AppError.notFound('Active allocation not found.');
  }

  return db.$transaction(async (tx) => {
    // 1. Release bed
    await tx.hostelBed.update({
      where: { id: allocation.bedId },
      data: { status: 'AVAILABLE' },
    });

    // 2. Mark allocation as VACATED
    const updated = await tx.hostelAllocation.update({
      where: { id: allocation.id },
      data: {
        status: 'VACATED',
        endDate: new Date(),
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'HOSTEL',
      action: 'UPDATE',
      resourceId: allocation.id,
      newState: { action: 'HOSTEL_CHECKOUT_VACATED', bedId: allocation.bedId },
    });

    return updated;
  });
}

export async function recordHostelVisitor(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelVisitorLogCreateSchema.parse(rawData);

  const hostel = await db.hostelMaster.findFirst({
    where: { id: validated.hostelId, institutionId: tenant.institutionId },
  });
  if (!hostel) throw AppError.notFound('Hostel not found.');

  return db.hostelVisitorLog.create({
    data: {
      institutionId: tenant.institutionId,
      hostelId: validated.hostelId,
      residentStudentId: validated.residentStudentId,
      visitorName: validated.visitorName,
      visitorPhone: validated.visitorPhone,
      visitorNid: validated.visitorNid,
      relationship: validated.relationship,
      purpose: validated.purpose,
      entryTime: new Date(),
      approvedBy: actor.name,
    },
  });
}

export async function recordHostelAttendance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HostelAttendanceCreateSchema.parse(rawData);

  const attDate = new Date(validated.date);
  attDate.setHours(0, 0, 0, 0);

  return db.hostelAttendance.upsert({
    where: {
      hostelId_studentId_date: {
        hostelId: validated.hostelId,
        studentId: validated.studentId,
        date: attDate,
      },
    },
    update: {
      status: validated.status,
      remarks: validated.remarks,
      recordedBy: actor.name,
    },
    create: {
      hostelId: validated.hostelId,
      studentId: validated.studentId,
      date: attDate,
      status: validated.status,
      remarks: validated.remarks,
      recordedBy: actor.name,
    },
  });
}
