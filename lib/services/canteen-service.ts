import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  CanteenCreateSchema,
  CanteenItemCreateSchema,
  CanteenMenuCreateSchema,
  CanteenWalletDepositSchema,
  CanteenSpendingLimitSchema,
  CanteenPosSaleCreateSchema,
} from '@/lib/validations/schemas';

export async function createCanteen(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus not found.');

  const existing = await db.canteen.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Canteen code '${validated.code}' already exists.`);

  const canteen = await db.canteen.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      code: validated.code,
      name: validated.name,
      operatorType: validated.operatorType,
      vendorId: validated.vendorId,
      status: 'ACTIVE',
    },
    include: { campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'CANTEEN',
    action: 'CREATE',
    resourceId: canteen.id,
    newState: { code: canteen.code, name: canteen.name },
  });

  return canteen;
}

export async function getCanteens(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.canteen.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      items: { where: { isAvailable: true } },
    },
    orderBy: { code: 'asc' },
  });
}

export async function createCanteenItem(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenItemCreateSchema.parse(rawData);

  const canteen = await db.canteen.findFirst({
    where: { id: validated.canteenId, institutionId: tenant.institutionId },
  });
  if (!canteen) throw AppError.notFound('Canteen not found.');

  const existing = await db.canteenItem.findFirst({
    where: { canteenId: validated.canteenId, itemCode: validated.itemCode },
  });
  if (existing) throw AppError.conflict(`Item code '${validated.itemCode}' already exists in this canteen.`);

  return db.canteenItem.create({
    data: {
      institutionId: tenant.institutionId,
      canteenId: validated.canteenId,
      itemCode: validated.itemCode,
      name: validated.name,
      category: validated.category,
      salePrice: validated.salePrice,
      costPrice: validated.costPrice,
      taxPercent: validated.taxPercent,
      isAvailable: validated.isAvailable,
      stockItemId: validated.stockItemId,
    },
  });
}

export async function createCanteenMenu(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenMenuCreateSchema.parse(rawData);

  const canteen = await db.canteen.findFirst({
    where: { id: validated.canteenId, institutionId: tenant.institutionId },
  });
  if (!canteen) throw AppError.notFound('Canteen not found.');

  return db.canteenMenu.create({
    data: {
      canteenId: validated.canteenId,
      date: new Date(validated.date),
      mealPeriod: validated.mealPeriod,
      itemIds: JSON.stringify(validated.itemIds),
      isPublished: validated.isPublished,
    },
  });
}

export async function getOrCreateCanteenWallet(
  tenantIdentifier: string,
  userType: 'STUDENT' | 'EMPLOYEE',
  targetId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  let existing = await db.canteenWallet.findFirst({
    where: {
      institutionId: tenant.institutionId,
      studentId: userType === 'STUDENT' ? targetId : undefined,
      employeeId: userType === 'EMPLOYEE' ? targetId : undefined,
    },
    include: {
      ledgers: { orderBy: { createdAt: 'desc' }, take: 20 },
      spendingLimit: true,
      student: true,
      employee: true,
    },
  });

  if (existing) return existing;

  const count = await db.canteenWallet.count({ where: { institutionId: tenant.institutionId } });
  const walletNumber = `WLT-${(count + 1).toString().padStart(6, '0')}`;

  return db.canteenWallet.create({
    data: {
      institutionId: tenant.institutionId,
      userType,
      studentId: userType === 'STUDENT' ? targetId : null,
      employeeId: userType === 'EMPLOYEE' ? targetId : null,
      walletNumber,
      currentBalance: 0,
      status: 'ACTIVE',
    },
    include: {
      ledgers: true,
      spendingLimit: true,
      student: true,
      employee: true,
    },
  });
}

export async function depositCanteenWallet(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenWalletDepositSchema.parse(rawData);

  const wallet = await db.canteenWallet.findFirst({
    where: { id: validated.walletId, institutionId: tenant.institutionId },
  });
  if (!wallet) throw AppError.notFound('Canteen wallet not found.');

  return db.$transaction(async (tx) => {
    const newBalance = wallet.currentBalance + validated.amount;

    await tx.canteenWallet.update({
      where: { id: wallet.id },
      data: { currentBalance: newBalance },
    });

    const ledger = await tx.canteenWalletLedger.create({
      data: {
        walletId: wallet.id,
        transactionType: 'DEPOSIT',
        amount: validated.amount,
        balanceAfter: newBalance,
        notes: validated.notes || 'Wallet deposit / top-up',
        performedBy: actor.name,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'CANTEEN',
      action: 'UPDATE',
      resourceId: wallet.id,
      newState: {
        action: 'WALLET_DEPOSIT',
        amount: validated.amount,
        newBalance,
      },
    });

    return { wallet: { ...wallet, currentBalance: newBalance }, ledger };
  });
}

export async function setSpendingLimit(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenSpendingLimitSchema.parse(rawData);

  const wallet = await db.canteenWallet.findFirst({
    where: { id: validated.walletId, institutionId: tenant.institutionId },
  });
  if (!wallet) throw AppError.notFound('Wallet not found.');

  return db.canteenSpendingLimit.upsert({
    where: { walletId: validated.walletId },
    update: {
      dailyLimit: validated.dailyLimit,
      weeklyLimit: validated.weeklyLimit,
    },
    create: {
      walletId: validated.walletId,
      dailyLimit: validated.dailyLimit,
      weeklyLimit: validated.weeklyLimit,
    },
  });
}

export async function processCanteenSale(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CanteenPosSaleCreateSchema.parse(rawData);

  const canteen = await db.canteen.findFirst({
    where: { id: validated.canteenId, institutionId: tenant.institutionId },
  });
  if (!canteen) throw AppError.notFound('Canteen not found.');

  // Fetch items
  const itemIds = validated.items.map((i) => i.itemId);
  const items = await db.canteenItem.findMany({
    where: { id: { in: itemIds }, canteenId: validated.canteenId },
  });
  if (items.length !== itemIds.length) {
    throw AppError.validation('One or more selected menu items do not exist in this canteen.');
  }

  let subtotal = 0;
  let taxAmount = 0;
  const lineItems: any[] = [];

  for (const itemInput of validated.items) {
    const item = items.find((it) => it.id === itemInput.itemId)!;
    const lineTotal = item.salePrice * itemInput.quantity;
    const lineTax = (lineTotal * item.taxPercent) / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;

    lineItems.push({
      itemId: item.id,
      itemName: item.name,
      unitPrice: item.salePrice,
      quantity: itemInput.quantity,
      totalPrice: lineTotal,
      stockItemId: item.stockItemId,
    });
  }

  const totalAmount = Math.max(0, subtotal + taxAmount - validated.discountAmount);

  return db.$transaction(async (tx) => {
    // If paid via WALLET, verify balance and deduct
    if (validated.paymentMode === 'WALLET') {
      const wallet = await tx.canteenWallet.findFirst({
        where: {
          institutionId: tenant.institutionId,
          studentId: validated.studentId || undefined,
          employeeId: validated.employeeId || undefined,
        },
        include: { spendingLimit: true },
      });

      if (!wallet) throw AppError.notFound('Linked cashless wallet not found.');
      if (wallet.status !== 'ACTIVE') throw AppError.conflict('Wallet is locked or inactive.');
      if (wallet.currentBalance < totalAmount) {
        throw AppError.conflict(
          `Insufficient wallet balance. Available: ${wallet.currentBalance} BDT, Total: ${totalAmount} BDT.`
        );
      }

      // Check daily spending limit
      if (wallet.spendingLimit && totalAmount > wallet.spendingLimit.dailyLimit) {
        throw AppError.conflict(
          `Transaction exceeds configured daily spending limit of ${wallet.spendingLimit.dailyLimit} BDT.`
        );
      }

      const balanceAfter = wallet.currentBalance - totalAmount;
      await tx.canteenWallet.update({
        where: { id: wallet.id },
        data: { currentBalance: balanceAfter },
      });

      await tx.canteenWalletLedger.create({
        data: {
          walletId: wallet.id,
          transactionType: 'PURCHASE',
          amount: -totalAmount,
          balanceAfter,
          notes: `Canteen POS sale purchase`,
          performedBy: actor.name,
        },
      });
    }

    // Generate Sale Record
    const count = await tx.canteenPosSale.count({ where: { institutionId: tenant.institutionId } });
    const saleNumber = `SALE-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

    const sale = await tx.canteenPosSale.create({
      data: {
        institutionId: tenant.institutionId,
        canteenId: validated.canteenId,
        saleNumber,
        buyerType: validated.buyerType,
        studentId: validated.studentId,
        employeeId: validated.employeeId,
        paymentMode: validated.paymentMode,
        subtotal,
        taxAmount,
        discountAmount: validated.discountAmount,
        totalAmount,
        status: 'COMPLETED',
        cashierName: actor.name,
        saleItems: {
          create: lineItems.map((li) => ({
            itemId: li.itemId,
            itemName: li.itemName,
            unitPrice: li.unitPrice,
            quantity: li.quantity,
            totalPrice: li.totalPrice,
          })),
        },
      },
      include: { saleItems: true },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'CANTEEN',
      action: 'CREATE',
      resourceId: sale.id,
      newState: { saleNumber, totalAmount, paymentMode: validated.paymentMode },
    });

    return sale;
  });
}
