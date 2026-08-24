import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  FixedAssetCreateSchema,
  AssetAssignSchema,
  AssetReturnSchema,
  AssetMaintenanceCreateSchema,
  AssetDisposalCreateSchema,
} from '@/lib/validations/schemas';

export async function createFixedAsset(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FixedAssetCreateSchema.parse(rawData);

  let campus = null;
  if (validated.campusId && validated.campusId !== 'CAMPUS-MAIN' && validated.campusId !== 'main-campus') {
    campus = await db.campus.findFirst({
      where: {
        OR: [
          { id: validated.campusId, institutionId: tenant.institutionId },
          { code: validated.campusId, institutionId: tenant.institutionId },
        ],
      },
    });
    if (!campus) throw AppError.notFound('Selected campus does not exist.');
  } else {
    campus = await db.campus.findFirst({
      where: { institutionId: tenant.institutionId },
      orderBy: { isMain: 'desc' },
    });
  }

  if (!campus) {
    campus = await db.campus.create({
      data: {
        institutionId: tenant.institutionId,
        name: `${tenant.name} Main Campus`,
        code: `${tenant.slug.slice(0, 4).toUpperCase()}-MAIN`,
        address: 'Campus Main Facility',
        type: 'Main Campus',
        isMain: true,
      },
    });
  }

  const existing = await db.fixedAsset.findFirst({
    where: { institutionId: tenant.institutionId, assetTag: validated.assetTag },
  });
  if (existing) throw AppError.conflict(`Asset tag '${validated.assetTag}' already exists.`);

  const asset = await db.fixedAsset.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: campus.id,
      assetTag: validated.assetTag,
      name: validated.name,
      category: validated.category,
      serialNumber: validated.serialNumber,
      purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : new Date(),
      purchaseCost: validated.purchaseCost,
      supplierVendorId: validated.supplierVendorId,
      warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : null,
      warrantyProvider: validated.warrantyProvider,
      currentCustodianEmployeeId: validated.currentCustodianEmployeeId,
      currentDepartmentId: validated.currentDepartmentId,
      currentRoomId: validated.currentRoomId,
      depreciationMethod: validated.depreciationMethod,
      depreciationRatePercent: validated.depreciationRatePercent,
      salvageValue: validated.salvageValue,
      accumulatedDepreciation: 0,
      bookValue: validated.purchaseCost,
      condition: validated.condition,
      status: validated.currentCustodianEmployeeId ? 'ASSIGNED' : 'IN_STOCK',
    },
    include: { campus: true, currentCustodianEmployee: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'ASSET',
    action: 'CREATE',
    resourceId: asset.id,
    newState: { assetTag: asset.assetTag, name: asset.name, purchaseCost: asset.purchaseCost },
  });

  return asset;
}

export async function getFixedAssets(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.fixedAsset.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      currentCustodianEmployee: true,
      supplierVendor: true,
      assignments: { orderBy: { assignedDate: 'desc' }, take: 1 },
      maintenances: true,
      disposal: true,
    },
    orderBy: { assetTag: 'asc' },
  });
}

export async function assignAsset(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AssetAssignSchema.parse(rawData);

  const asset = await db.fixedAsset.findFirst({
    where: { id: validated.assetId, institutionId: tenant.institutionId },
  });
  if (!asset) throw AppError.notFound('Fixed asset not found.');
  if (asset.status === 'DISPOSED' || asset.status === 'LOST') {
    throw AppError.conflict(`Cannot assign asset in '${asset.status}' status.`);
  }

  if (validated.employeeId) {
    const emp = await db.employee.findFirst({
      where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
    });
    if (!emp) throw AppError.notFound('Assignee employee not found.');
  }

  return db.$transaction(async (tx) => {
    // 1. Create Assignment History log
    const assignment = await tx.assetAssignmentHistory.create({
      data: {
        assetId: asset.id,
        assignedToType: validated.assignedToType,
        employeeId: validated.employeeId,
        departmentId: validated.departmentId,
        roomId: validated.roomId,
        assignedDate: new Date(),
        conditionOnAssign: asset.condition,
        remarks: validated.remarks,
        assignedBy: actor.name,
      },
    });

    // 2. Update Asset Record
    await tx.fixedAsset.update({
      where: { id: asset.id },
      data: {
        currentCustodianEmployeeId: validated.employeeId,
        currentDepartmentId: validated.departmentId,
        currentRoomId: validated.roomId,
        status: 'ASSIGNED',
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'ASSET',
      action: 'UPDATE',
      resourceId: asset.id,
      newState: {
        action: 'ASSET_ASSIGNED',
        assignedToType: validated.assignedToType,
        employeeId: validated.employeeId,
      },
    });

    return assignment;
  });
}

export async function returnAsset(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AssetReturnSchema.parse(rawData);

  const assignment = await db.assetAssignmentHistory.findUnique({
    where: { id: validated.assignmentId },
    include: { asset: true },
  });
  if (!assignment || assignment.asset.institutionId !== tenant.institutionId) {
    throw AppError.notFound('Asset assignment record not found.');
  }

  return db.$transaction(async (tx) => {
    await tx.assetAssignmentHistory.update({
      where: { id: assignment.id },
      data: {
        returnDate: new Date(),
        conditionOnReturn: validated.conditionOnReturn,
        remarks: validated.remarks,
      },
    });

    await tx.fixedAsset.update({
      where: { id: assignment.assetId },
      data: {
        currentCustodianEmployeeId: null,
        status: 'IN_STOCK',
        condition: validated.conditionOnReturn || assignment.asset.condition,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'ASSET',
      action: 'UPDATE',
      resourceId: assignment.assetId,
      newState: {
        action: 'ASSET_RETURNED',
        condition: validated.conditionOnReturn,
      },
    });

    return { success: true };
  });
}

export async function checkEmployeeAssetClearance(tenantIdentifier: string, employeeId: string): Promise<{ isCleared: boolean; unreturnedAssets: any[] }> {
  const tenant = await requireTenant(tenantIdentifier);

  const heldAssets = await db.fixedAsset.findMany({
    where: {
      institutionId: tenant.institutionId,
      currentCustodianEmployeeId: employeeId,
      status: 'ASSIGNED',
    },
  });

  return {
    isCleared: heldAssets.length === 0,
    unreturnedAssets: heldAssets,
  };
}

export async function recordAssetMaintenance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AssetMaintenanceCreateSchema.parse(rawData);

  const asset = await db.fixedAsset.findFirst({
    where: { id: validated.assetId, institutionId: tenant.institutionId },
  });
  if (!asset) throw AppError.notFound('Asset not found.');

  return db.assetMaintenance.create({
    data: {
      assetId: asset.id,
      serviceDate: new Date(),
      serviceType: validated.serviceType,
      cost: validated.cost,
      vendorName: validated.vendorName,
      description: validated.description,
      performedBy: actor.name,
      nextServiceDue: validated.nextServiceDue ? new Date(validated.nextServiceDue) : null,
      status: 'COMPLETED',
    },
  });
}

export async function disposeAsset(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AssetDisposalCreateSchema.parse(rawData);

  const asset = await db.fixedAsset.findFirst({
    where: { id: validated.assetId, institutionId: tenant.institutionId },
  });
  if (!asset) throw AppError.notFound('Asset not found.');

  const realizedGainLoss = validated.saleAmount - asset.bookValue;

  return db.$transaction(async (tx) => {
    const disposal = await tx.assetDisposal.create({
      data: {
        assetId: asset.id,
        disposalDate: new Date(),
        disposalType: validated.disposalType,
        saleAmount: validated.saleAmount,
        realizedGainLoss,
        approvedBy: actor.name,
        reason: validated.reason,
      },
    });

    await tx.fixedAsset.update({
      where: { id: asset.id },
      data: {
        status: 'DISPOSED',
        currentCustodianEmployeeId: null,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'ASSET',
      action: 'UPDATE',
      resourceId: asset.id,
      newState: {
        action: 'ASSET_DISPOSAL',
        disposalType: validated.disposalType,
        saleAmount: validated.saleAmount,
        realizedGainLoss,
      },
    });

    return disposal;
  });
}
