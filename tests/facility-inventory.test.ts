import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createInventoryCategory,
  createWarehouse,
  createInventoryItem,
  adjustStock,
  transferStock,
  issueStock,
  getStockBalance,
} from '@/lib/services/inventory-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Inventory, Warehouse & Stock Ledger Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `inv-tenant-${timestamp}`,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Inventory Test Institution',
        shortName: 'INV',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01711223344',
        email: `inv-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `IMC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    actor = {
      id: 'store-admin-1',
      name: 'Store Manager',
      email: 'store@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('enforces immutable stock ledger, double-sided warehouse transfers and issue deduction', async () => {
    const cat = await createInventoryCategory(
      actor.tenantId!,
      {
        name: 'Stationery & Office Supplies',
        code: `STAT-${Date.now()}`,
      },
      actor
    );

    const centralStore = await createWarehouse(
      actor.tenantId!,
      {
        campusId,
        code: `WH-CENTRAL-${Date.now()}`,
        name: 'Central University Store',
        type: 'CENTRAL_STORE',
      },
      actor
    );

    const deptStore = await createWarehouse(
      actor.tenantId!,
      {
        campusId,
        code: `WH-CSE-${Date.now()}`,
        name: 'CSE Department Lab Store',
        type: 'DEPARTMENT_STORE',
      },
      actor
    );

    const item = await createInventoryItem(
      actor.tenantId!,
      {
        categoryId: cat.id,
        sku: `A4-PAPER-${Date.now()}`,
        name: 'A4 Printing Paper Ream (80 GSM)',
        unitOfMeasure: 'REAM',
        standardCost: 450,
        reorderLevel: 20,
      },
      actor
    );

    await adjustStock(
      actor.tenantId!,
      {
        warehouseId: centralStore.id,
        itemId: item.id,
        transactionType: 'OPENING',
        quantity: 100,
        unitCost: 450,
        notes: 'Initial inventory audit',
      },
      actor
    );

    const balCentralInitial = await getStockBalance(institutionId, centralStore.id, item.id);
    expect(balCentralInitial.quantity).toBe(100);
    expect(balCentralInitial.totalValue).toBe(45000);

    const transfer = await transferStock(
      actor.tenantId!,
      {
        fromWarehouseId: centralStore.id,
        toWarehouseId: deptStore.id,
        items: [{ itemId: item.id, requestedQty: 30 }],
      },
      actor
    );
    expect(transfer.status).toBe('COMPLETED');

    const balCentralAfterTransfer = await getStockBalance(institutionId, centralStore.id, item.id);
    const balDeptAfterTransfer = await getStockBalance(institutionId, deptStore.id, item.id);
    expect(balCentralAfterTransfer.quantity).toBe(70);
    expect(balDeptAfterTransfer.quantity).toBe(30);

    const issue = await issueStock(
      actor.tenantId!,
      {
        warehouseId: deptStore.id,
        issuedToType: 'DEPARTMENT',
        purpose: 'Semester Final Exam Question Paper Printing',
        items: [{ itemId: item.id, quantity: 5 }],
      },
      actor
    );
    expect(issue.status).toBe('ISSUED');

    const balDeptFinal = await getStockBalance(institutionId, deptStore.id, item.id);
    expect(balDeptFinal.quantity).toBe(25);

    await expect(
      issueStock(
        actor.tenantId!,
        {
          warehouseId: deptStore.id,
          issuedToType: 'DEPARTMENT',
          purpose: 'Bulk printing attempt',
          items: [{ itemId: item.id, quantity: 50 }],
        },
        actor
      )
    ).rejects.toThrow(/insufficient stock/i);
  });
});
