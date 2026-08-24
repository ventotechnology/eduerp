import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  InventoryCategoryCreateSchema,
  WarehouseCreateSchema,
  InventoryItemCreateSchema,
  StockAdjustmentSchema,
  StockTransferCreateSchema,
  StockIssueRecordCreateSchema,
} from '@/lib/validations/schemas';

export async function createInventoryCategory(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = InventoryCategoryCreateSchema.parse(rawData);

  const existing = await db.inventoryCategory.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Inventory category code '${validated.code}' already exists.`);

  return db.inventoryCategory.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      description: validated.description,
    },
  });
}

export async function createWarehouse(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = WarehouseCreateSchema.parse(rawData);

  const existing = await db.warehouse.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Warehouse code '${validated.code}' already exists.`);

  return db.warehouse.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      code: validated.code,
      name: validated.name,
      type: validated.type,
      location: validated.location,
            status: 'ACTIVE',
    },
    include: { campus: true },
  });
}

export async function getWarehouses(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.warehouse.findMany({
    where: { institutionId: tenant.institutionId },
    include: { campus: true },
    orderBy: { code: 'asc' },
  });
}

export async function createInventoryItem(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = InventoryItemCreateSchema.parse(rawData);

  const category = await db.inventoryCategory.findFirst({
    where: { id: validated.categoryId, institutionId: tenant.institutionId },
  });
  if (!category) throw AppError.notFound('Inventory category not found.');

  const existing = await db.inventoryItem.findFirst({
    where: { institutionId: tenant.institutionId, sku: validated.sku },
  });
  if (existing) throw AppError.conflict(`Inventory item with SKU '${validated.sku}' already exists.`);

  return db.inventoryItem.create({
    data: {
      institutionId: tenant.institutionId,
      categoryId: validated.categoryId,
      sku: validated.sku,
      name: validated.name,
      unitOfMeasure: validated.unitOfMeasure,
      reorderLevel: validated.reorderLevel,
      standardCost: validated.standardCost,
      trackSerial: validated.trackSerial,
      trackBatch: validated.trackBatch,
      hasExpiry: validated.hasExpiry,
      status: 'ACTIVE',
    },
    include: { category: true },
  });
}

export async function getInventoryItems(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.inventoryItem.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      category: true,
      stockLedgers: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { sku: 'asc' },
  });
}

export async function getStockBalance(
  institutionId: string,
  warehouseId: string,
  itemId: string
): Promise<{ quantity: number; totalValue: number }> {
  const ledgers = await db.stockLedger.findMany({
    where: { institutionId, warehouseId, itemId },
  });

  let quantity = 0;
  let totalValue = 0;

  for (const entry of ledgers) {
    quantity += entry.quantity;
    totalValue += entry.totalValue;
  }

  return {
    quantity: Math.max(0, quantity),
    totalValue: Math.max(0, totalValue),
  };
}

export async function adjustStock(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StockAdjustmentSchema.parse(rawData);

  const warehouse = await db.warehouse.findFirst({
    where: { id: validated.warehouseId, institutionId: tenant.institutionId },
  });
  if (!warehouse) throw AppError.notFound('Warehouse not found.');

  const item = await db.inventoryItem.findFirst({
    where: { id: validated.itemId, institutionId: tenant.institutionId },
  });
  if (!item) throw AppError.notFound('Inventory item not found.');

  const currentBalance = await getStockBalance(tenant.institutionId, warehouse.id, item.id);
  const newQty = currentBalance.quantity + validated.quantity;
  const unitCost = validated.unitCost || item.standardCost;
  const totalValue = validated.quantity * unitCost;
  const newTotalValue = currentBalance.totalValue + totalValue;

  if (newQty < 0) {
    throw AppError.conflict(
      `Insufficient stock for adjustment. Current stock: ${currentBalance.quantity}, Adjustment: ${validated.quantity}`
    );
  }

  const ledger = await db.stockLedger.create({
    data: {
      institutionId: tenant.institutionId,
      warehouseId: warehouse.id,
      itemId: item.id,
      transactionType: validated.transactionType,
      quantity: validated.quantity,
      unitCost,
      totalValue,
      balanceAfterQty: newQty,
      balanceAfterValue: newTotalValue,
      referenceType: 'MANUAL_ADJUSTMENT',
      notes: validated.notes,
      performedBy: actor.name,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'INVENTORY',
    action: 'UPDATE',
    resourceId: item.id,
    newState: {
      action: 'STOCK_ADJUSTMENT',
      type: validated.transactionType,
      quantity: validated.quantity,
      newQty,
    },
  });

  return ledger;
}

export async function transferStock(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StockTransferCreateSchema.parse(rawData);

  if (validated.fromWarehouseId === validated.toWarehouseId) {
    throw AppError.validation('Source and destination warehouses cannot be the same.');
  }

  const [fromWh, toWh] = await Promise.all([
    db.warehouse.findFirst({ where: { id: validated.fromWarehouseId, institutionId: tenant.institutionId } }),
    db.warehouse.findFirst({ where: { id: validated.toWarehouseId, institutionId: tenant.institutionId } }),
  ]);
  if (!fromWh || !toWh) throw AppError.notFound('One or both warehouses do not exist.');

  const count = await db.stockTransfer.count({ where: { institutionId: tenant.institutionId } });
  const transferNumber = `TRF-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.$transaction(async (tx) => {
    // 1. Create StockTransfer master
    const transfer = await tx.stockTransfer.create({
      data: {
        institutionId: tenant.institutionId,
        transferNumber,
        fromWarehouseId: fromWh.id,
        toWarehouseId: toWh.id,
        status: 'COMPLETED',
        requestedBy: actor.name,
        approvedBy: actor.name,
        completedAt: new Date(),
        items: {
          create: validated.items.map((it) => ({
            itemId: it.itemId,
            requestedQty: it.requestedQty,
            sentQty: it.requestedQty,
            receivedQty: it.requestedQty,
          })),
        },
      },
      include: { items: true },
    });

    // 2. Perform double-sided stock ledger movement for each item
    for (const itemInput of validated.items) {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemInput.itemId } });
      if (!item) throw AppError.notFound(`Item '${itemInput.itemId}' not found.`);

      // Source Warehouse: Deduct (TRANSFER_OUT)
      const fromBal = await getStockBalance(tenant.institutionId, fromWh.id, item.id);
      if (fromBal.quantity < itemInput.requestedQty) {
        throw AppError.conflict(
          `Insufficient stock of '${item.name}' (${item.sku}) in ${fromWh.name}. Available: ${fromBal.quantity}, Requested: ${itemInput.requestedQty}`
        );
      }

      const unitCost = item.standardCost;
      const totalVal = itemInput.requestedQty * unitCost;

      await tx.stockLedger.create({
        data: {
          institutionId: tenant.institutionId,
          warehouseId: fromWh.id,
          itemId: item.id,
          transactionType: 'TRANSFER_OUT',
          quantity: -itemInput.requestedQty,
          unitCost,
          totalValue: -totalVal,
          balanceAfterQty: fromBal.quantity - itemInput.requestedQty,
          balanceAfterValue: fromBal.totalValue - totalVal,
          referenceType: 'TRANSFER_REQ',
          referenceId: transfer.id,
          notes: `Transferred to ${toWh.name} (${transferNumber})`,
          performedBy: actor.name,
        },
      });

      // Target Warehouse: Add (TRANSFER_IN)
      const toBal = await getStockBalance(tenant.institutionId, toWh.id, item.id);
      await tx.stockLedger.create({
        data: {
          institutionId: tenant.institutionId,
          warehouseId: toWh.id,
          itemId: item.id,
          transactionType: 'TRANSFER_IN',
          quantity: itemInput.requestedQty,
          unitCost,
          totalValue: totalVal,
          balanceAfterQty: toBal.quantity + itemInput.requestedQty,
          balanceAfterValue: toBal.totalValue + totalVal,
          referenceType: 'TRANSFER_REQ',
          referenceId: transfer.id,
          notes: `Transferred from ${fromWh.name} (${transferNumber})`,
          performedBy: actor.name,
        },
      });
    }

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'INVENTORY',
      action: 'UPDATE',
      resourceId: transfer.id,
      newState: {
        transferNumber,
        fromWarehouse: fromWh.name,
        toWarehouse: toWh.name,
      },
    });

    return transfer;
  });
}

export async function issueStock(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = StockIssueRecordCreateSchema.parse(rawData);

  const warehouse = await db.warehouse.findFirst({
    where: { id: validated.warehouseId, institutionId: tenant.institutionId },
  });
  if (!warehouse) throw AppError.notFound('Warehouse not found.');

  const count = await db.stockIssueRecord.count({ where: { institutionId: tenant.institutionId } });
  const issueNumber = `ISS-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.$transaction(async (tx) => {
    const issueRecord = await tx.stockIssueRecord.create({
      data: {
        institutionId: tenant.institutionId,
        issueNumber,
        warehouseId: warehouse.id,
        issuedToType: validated.issuedToType,
        departmentId: validated.departmentId,
        employeeId: validated.employeeId,
        studentId: validated.studentId,
        facilityId: validated.facilityId,
        purpose: validated.purpose,
        issuedBy: actor.name,
        status: 'ISSUED',
        items: {
          create: validated.items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const itemInput of validated.items) {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemInput.itemId } });
      if (!item) throw AppError.notFound(`Item '${itemInput.itemId}' not found.`);

      const bal = await getStockBalance(tenant.institutionId, warehouse.id, item.id);
      if (bal.quantity < itemInput.quantity) {
        throw AppError.conflict(
          `Insufficient stock of '${item.name}' (${item.sku}) in ${warehouse.name}. Available: ${bal.quantity}, Requested: ${itemInput.quantity}`
        );
      }

      const unitCost = item.standardCost;
      const totalCost = itemInput.quantity * unitCost;

      await tx.stockLedger.create({
        data: {
          institutionId: tenant.institutionId,
          warehouseId: warehouse.id,
          itemId: item.id,
          transactionType: 'ISSUE',
          quantity: -itemInput.quantity,
          unitCost,
          totalValue: -totalCost,
          balanceAfterQty: bal.quantity - itemInput.quantity,
          balanceAfterValue: bal.totalValue - totalCost,
          referenceType: 'ISSUE_REQ',
          referenceId: issueRecord.id,
          notes: `Issued for: ${validated.purpose} (${issueNumber})`,
          performedBy: actor.name,
        },
      });
    }

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'INVENTORY',
      action: 'CREATE',
      resourceId: issueRecord.id,
      newState: { issueNumber, purpose: validated.purpose },
    });

    return issueRecord;
  });
}
