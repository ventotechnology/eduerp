import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { getStockBalance } from './inventory-service';
import {
  PurchaseRequisitionCreateSchema,
  RequestForQuotationCreateSchema,
  VendorQuotationCreateSchema,
  PurchaseOrderCreateSchema,
  GoodsReceiptNoteCreateSchema,
} from '@/lib/validations/schemas';

export async function createPurchaseRequisition(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PurchaseRequisitionCreateSchema.parse(rawData);

  const emp = await db.employee.findFirst({
    where: { id: validated.requestedByEmployeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!emp) throw AppError.notFound('Requester employee not found.');

  const count = await db.purchaseRequisition.count({ where: { institutionId: tenant.institutionId } });
  const requisitionNumber = `PR-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  const estimatedTotalCost = validated.items.reduce(
    (sum, it) => sum + it.quantity * (it.estimatedUnitPrice || 0),
    0
  );

  const req = await db.purchaseRequisition.create({
    data: {
      institutionId: tenant.institutionId,
      requisitionNumber,
      departmentId: validated.departmentId,
      requestedByEmployeeId: validated.requestedByEmployeeId,
      requiredByDate: new Date(validated.requiredByDate),
      purpose: validated.purpose,
      estimatedTotalCost,
      status: 'SUBMITTED',
      items: {
        create: validated.items.map((it) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          specification: it.specification,
          quantity: it.quantity,
          estimatedUnitPrice: it.estimatedUnitPrice,
          estimatedTotalPrice: it.quantity * it.estimatedUnitPrice,
        })),
      },
    },
    include: { items: true, requestedByEmployee: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'PROCUREMENT',
    action: 'CREATE',
    resourceId: req.id,
    newState: { requisitionNumber, estimatedTotalCost },
  });

  return req;
}

export async function approvePurchaseRequisition(tenantIdentifier: string, requisitionId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const req = await db.purchaseRequisition.findFirst({
    where: { id: requisitionId, institutionId: tenant.institutionId },
  });
  if (!req) throw AppError.notFound('Purchase requisition not found.');

  return db.purchaseRequisition.update({
    where: { id: requisitionId },
    data: {
      status: 'APPROVED',
      approvedBy: actor.name,
    },
  });
}

export async function createRequestForQuotation(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RequestForQuotationCreateSchema.parse(rawData);

  const count = await db.requestForQuotation.count({ where: { institutionId: tenant.institutionId } });
  const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.requestForQuotation.create({
    data: {
      institutionId: tenant.institutionId,
      rfqNumber,
      requisitionId: validated.requisitionId,
      title: validated.title,
      deadlineDate: new Date(validated.deadlineDate),
      termsConditions: validated.termsConditions,
      status: 'PUBLISHED',
    },
  });
}

export async function submitVendorQuotation(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VendorQuotationCreateSchema.parse(rawData);

  const vendor = await db.vendor.findFirst({
    where: { id: validated.vendorId, institutionId: tenant.institutionId },
  });
  if (!vendor) throw AppError.notFound('Vendor not found.');

  return db.vendorQuotation.create({
    data: {
      institutionId: tenant.institutionId,
      rfqId: validated.rfqId,
      vendorId: validated.vendorId,
      quotationNumber: validated.quotationNumber,
      validityDate: new Date(validated.validityDate),
      totalQuotedAmount: validated.totalQuotedAmount,
      paymentTerms: validated.paymentTerms,
      deliveryLeadDays: validated.deliveryLeadDays,
      attachmentUrl: validated.attachmentUrl,
      status: 'SUBMITTED',
      items: {
        create: validated.items.map((it) => ({
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent,
          totalPrice: it.quantity * it.unitPrice * (1 + (it.taxPercent || 0)/100),
        })),
      },
    },
    include: { items: true, vendor: true },
  });
}

export async function createPurchaseOrder(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PurchaseOrderCreateSchema.parse(rawData);

  const vendor = await db.vendor.findFirst({
    where: { id: validated.vendorId, institutionId: tenant.institutionId },
  });
  if (!vendor) throw AppError.notFound('Vendor not found.');

  const count = await db.purchaseOrder.count({ where: { institutionId: tenant.institutionId } });
  const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  const po = await db.purchaseOrder.create({
    data: {
      institutionId: tenant.institutionId,
      poNumber,
      requisitionId: validated.requisitionId,
      quotationId: validated.quotationId,
      vendorId: validated.vendorId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(validated.expectedDeliveryDate),
      subtotal: validated.subtotal,
      taxAmount: validated.taxAmount,
      shippingAmount: validated.shippingAmount,
      totalAmount: validated.totalAmount,
      status: 'APPROVED',
      approvedBy: actor.name,
      approvedAt: new Date(),
      terms: validated.terms,
      items: {
        create: validated.items.map((it) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          orderedQuantity: it.orderedQuantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent,
          totalPrice: it.orderedQuantity * it.unitPrice * (1 + (it.taxPercent || 0) / 100),
          receivedQuantity: 0,
          pendingQuantity: it.orderedQuantity,
        })),
      },
    },
    include: { items: true, vendor: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'PROCUREMENT',
    action: 'CREATE',
    resourceId: po.id,
    newState: { poNumber, vendor: vendor.name, totalAmount: po.totalAmount },
  });

  return po;
}

export async function receiveGoodsNote(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = GoodsReceiptNoteCreateSchema.parse(rawData);

  const po = await db.purchaseOrder.findFirst({
    where: { id: validated.poId, institutionId: tenant.institutionId },
    include: { items: true },
  });
  if (!po) throw AppError.notFound('Purchase order not found.');

  const warehouse = await db.warehouse.findFirst({
    where: { id: validated.warehouseId, institutionId: tenant.institutionId },
  });
  if (!warehouse) throw AppError.notFound('Warehouse not found.');

  const count = await db.goodsReceiptNote.count({ where: { institutionId: tenant.institutionId } });
  const grnNumber = `GRN-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  return db.$transaction(async (tx) => {
    const grn = await tx.goodsReceiptNote.create({
      data: {
        institutionId: tenant.institutionId,
        grnNumber,
        poId: po.id,
        vendorId: po.vendorId,
        warehouseId: warehouse.id,
        challanNumber: validated.challanNumber,
        deliveryDate: new Date(),
        receivedByEmployeeId: actor.id,
        overallStatus: 'ACCEPTED_FULL',
        remarks: validated.remarks,
        items: {
          create: validated.items.map((it) => ({
            poItemId: it.poItemId,
            itemId: it.itemId,
            receivedQuantity: it.receivedQuantity,
            acceptedQuantity: it.acceptedQuantity,
            rejectedQuantity: it.rejectedQuantity,
            unitCost: it.unitCost,
            totalAcceptedCost: it.acceptedQuantity * it.unitCost,
            rejectionReason: it.rejectionReason,
          })),
        },
      },
      include: { items: true },
    });

    // Update PO items received quantities & Update Warehouse StockLedger for accepted items
    for (const it of validated.items) {
      if (it.poItemId) {
        await tx.purchaseOrderItem.update({
          where: { id: it.poItemId },
          data: {
            receivedQuantity: { increment: it.acceptedQuantity },
            pendingQuantity: { decrement: it.acceptedQuantity },
          },
        });
      }

      if (it.itemId && it.acceptedQuantity > 0) {
        const item = await tx.inventoryItem.findUnique({ where: { id: it.itemId } });
        if (item) {
          const currentBal = await getStockBalance(tenant.institutionId, warehouse.id, item.id);
          const totalVal = it.acceptedQuantity * it.unitCost;

          await tx.stockLedger.create({
            data: {
              institutionId: tenant.institutionId,
              warehouseId: warehouse.id,
              itemId: item.id,
              transactionType: 'PURCHASE_RECEIPT',
              quantity: it.acceptedQuantity,
              unitCost: it.unitCost,
              totalValue: totalVal,
              balanceAfterQty: currentBal.quantity + it.acceptedQuantity,
              balanceAfterValue: currentBal.totalValue + totalVal,
              referenceType: 'GRN',
              referenceId: grn.id,
              notes: `Goods received from PO ${po.poNumber} (${grnNumber})`,
              performedBy: actor.name,
            },
          });
        }
      }
    }

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'PROCUREMENT',
      action: 'CREATE',
      resourceId: grn.id,
      newState: { grnNumber, poNumber: po.poNumber },
    });

    return grn;
  });
}

export async function performThreeWayMatch(
  tenantIdentifier: string,
  poId: string,
  grnId: string,
  vendorInvoiceAmount: number
) {
  const tenant = await requireTenant(tenantIdentifier);

  const po = await db.purchaseOrder.findFirst({
    where: { id: poId, institutionId: tenant.institutionId },
    include: { items: true },
  });
  if (!po) throw AppError.notFound('PO not found.');

  const grn = await db.goodsReceiptNote.findFirst({
    where: { id: grnId, institutionId: tenant.institutionId },
    include: { items: true },
  });
  if (!grn) throw AppError.notFound('GRN not found.');

  const poTotal = po.totalAmount;
  const grnTotalAccepted = grn.items.reduce((sum, it) => sum + it.totalAcceptedCost, 0);

  const isMatched = Math.abs(grnTotalAccepted - vendorInvoiceAmount) < 0.01;
  const discrepancy = vendorInvoiceAmount - grnTotalAccepted;

  return {
    poNumber: po.poNumber,
    poTotal,
    grnNumber: grn.grnNumber,
    grnTotalAccepted,
    vendorInvoiceAmount,
    isMatched,
    discrepancy,
    status: isMatched ? 'MATCHED' : 'DISCREPANCY_FLAGGED',
  };
}
