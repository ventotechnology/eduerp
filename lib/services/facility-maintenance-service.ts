import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  MaintenanceRequestCreateSchema,
  MaintenanceWorkOrderCreateSchema,
  MaintenanceWorkOrderUpdateSchema,
} from '@/lib/validations/schemas';

export async function createMaintenanceRequest(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MaintenanceRequestCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus not found.');

  const count = await db.maintenanceRequest.count({ where: { institutionId: tenant.institutionId } });
  const ticketNumber = `MNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  const req = await db.maintenanceRequest.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      ticketNumber,
      requesterType: validated.requesterType,
      requesterEmployeeId: validated.requesterEmployeeId,
      requesterStudentId: validated.requesterStudentId,
      category: validated.category,
      priority: validated.priority,
      facilityId: validated.facilityId,
      roomId: validated.roomId,
      assetId: validated.assetId,
      title: validated.title,
      description: validated.description,
      status: 'OPEN',
    },
    include: { campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'MAINTENANCE',
    action: 'CREATE',
    resourceId: req.id,
    newState: { ticketNumber, category: req.category, priority: req.priority },
  });

  return req;
}

export async function getMaintenanceRequests(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.maintenanceRequest.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      workOrder: true,
      facility: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMaintenanceWorkOrder(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MaintenanceWorkOrderCreateSchema.parse(rawData);

  const request = await db.maintenanceRequest.findFirst({
    where: { id: validated.requestId, institutionId: tenant.institutionId },
  });
  if (!request) throw AppError.notFound('Maintenance request not found.');

  const count = await db.maintenanceWorkOrder.count();
  const workOrderNumber = `WO-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.$transaction(async (tx) => {
    const workOrder = await tx.maintenanceWorkOrder.create({
      data: {
        requestId: request.id,
        workOrderNumber,
        assignedTechnicianEmployeeId: validated.assignedTechnicianEmployeeId,
        technicianName: validated.technicianName,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : new Date(),
        laborCost: validated.laborCost,
        partsCost: validated.partsCost,
        totalCost: validated.laborCost + validated.partsCost,
        status: 'ASSIGNED',
      },
    });

    await tx.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: 'ASSIGNED' },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'MAINTENANCE',
      action: 'UPDATE',
      resourceId: request.id,
      newState: { action: 'WORK_ORDER_CREATED', workOrderNumber },
    });

    return workOrder;
  });
}

export async function updateMaintenanceWorkOrder(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = MaintenanceWorkOrderUpdateSchema.parse(rawData);

  const workOrder = await db.maintenanceWorkOrder.findUnique({
    where: { id: validated.workOrderId },
    include: { request: true },
  });
  if (!workOrder || workOrder.request.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Work order not found.');
  }

  const laborCost = validated.laborCost !== undefined ? validated.laborCost : workOrder.laborCost;
  const partsCost = validated.partsCost !== undefined ? validated.partsCost : workOrder.partsCost;
  const totalCost = laborCost + partsCost;

  return db.$transaction(async (tx) => {
    const updatedWo = await tx.maintenanceWorkOrder.update({
      where: { id: workOrder.id },
      data: {
        status: validated.status,
        laborCost,
        partsCost,
        totalCost,
        resolutionSummary: validated.resolutionSummary,
        completedDate: validated.status === 'RESOLVED' || validated.status === 'CLOSED' ? new Date() : undefined,
      },
    });

    await tx.maintenanceRequest.update({
      where: { id: workOrder.requestId },
      data: { status: validated.status },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'MAINTENANCE',
      action: 'UPDATE',
      resourceId: workOrder.requestId,
      newState: { status: validated.status, totalCost },
    });

    return updatedWo;
  });
}
