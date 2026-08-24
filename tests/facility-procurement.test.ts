import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createPurchaseRequisition,
  approvePurchaseRequisition,
  createPurchaseOrder,
  receiveGoodsNote,
  performThreeWayMatch,
} from '@/lib/services/procurement-service';
import {
  createInventoryCategory,
  createWarehouse,
  createInventoryItem,
  getStockBalance,
} from '@/lib/services/inventory-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Procurement & Three-Way Match Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let employeeId: string;
  let vendorId: string;
  let warehouseId: string;
  let itemId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `prc-tenant-${timestamp}`,
        institutionType: 'COLLEGE',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Procurement Test Institution',
        shortName: 'PRC',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Tejgaon',
        phone: '01711223344',
        email: `prc-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `PMC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-PRC-${timestamp}`,
        firstName: 'Shahriar',
        lastName: 'Kabir',
        designation: 'Officer',
        joiningDate: new Date('2022-01-01'),
        basicSalary: 45000,
        phone: '01700000000',
        email: `emp-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    employeeId = emp.id;

    const vendor = await db.vendor.create({
      data: {
        institutionId: inst.id,
        vendorCode: `VND-${timestamp}`,
        name: 'Bengal Hardware Supplies Ltd.',
        phone: '01800000000',
      },
    });
    vendorId = vendor.id;

    actor = {
      id: emp.id,
      name: 'Procurement Officer',
      email: 'procurement@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const cat = await createInventoryCategory(
      tenant.slug,
      { name: 'Hardware', code: `HDW-${timestamp}` },
      actor
    );

    const wh = await createWarehouse(
      tenant.slug,
      { campusId, code: `WH-GEN-${timestamp}`, name: 'General Store' },
      actor
    );
    warehouseId = wh.id;

    const item = await createInventoryItem(
      tenant.slug,
      { categoryId: cat.id, sku: `LED-BULB-${timestamp}`, name: '20W LED Bulb', unitOfMeasure: 'PCS', standardCost: 200 },
      actor
    );
    itemId = item.id;
  });

  it('completes full procurement lifecycle: Requisition -> PO -> GRN (Stock Auto-Credit) -> 3-Way Match', async () => {
    const req = await createPurchaseRequisition(
      actor.tenantId!,
      {
        requestedByEmployeeId: employeeId,
        requiredByDate: new Date().toISOString(),
        purpose: 'Campus Classroom Lighting Upgrade',
        items: [{ itemId, itemName: '20W LED Bulb', quantity: 50, estimatedUnitPrice: 200 }],
      },
      actor
    );
    expect(req.status).toBe('SUBMITTED');

    const approvedReq = await approvePurchaseRequisition(actor.tenantId!, req.id, actor);
    expect(approvedReq.status).toBe('APPROVED');

    const po = await createPurchaseOrder(
      actor.tenantId!,
      {
        requisitionId: req.id,
        vendorId,
        expectedDeliveryDate: new Date().toISOString(),
        subtotal: 10000,
        taxAmount: 500,
        shippingAmount: 0,
        totalAmount: 10500,
        items: [{ itemId, itemName: '20W LED Bulb', orderedQuantity: 50, unitPrice: 200, taxPercent: 5, totalPrice: 10500 }],
      },
      actor
    );
    expect(po.poNumber).toBeDefined();
    expect(po.status).toBe('APPROVED');

    const grn = await receiveGoodsNote(
      actor.tenantId!,
      {
        poId: po.id,
        warehouseId,
        challanNumber: 'CH-887711',
        items: [
          {
            poItemId: po.items[0].id,
            itemId,
            receivedQuantity: 50,
            acceptedQuantity: 48,
            rejectedQuantity: 2,
            unitCost: 200,
            rejectionReason: 'Damaged glass cover during delivery',
          },
        ],
      },
      actor
    );
    expect(grn.grnNumber).toBeDefined();

    const stockBal = await getStockBalance(institutionId, warehouseId, itemId);
    expect(stockBal.quantity).toBe(48);
    expect(stockBal.totalValue).toBe(9600);

    const match = await performThreeWayMatch(actor.tenantId!, po.id, grn.id, 9600);
    expect(match.isMatched).toBe(true);
    expect(match.status).toBe('MATCHED');

    const mismatched = await performThreeWayMatch(actor.tenantId!, po.id, grn.id, 10500);
    expect(mismatched.isMatched).toBe(false);
    expect(mismatched.status).toBe('DISCREPANCY_FLAGGED');
    expect(mismatched.discrepancy).toBe(900);
  });
});
