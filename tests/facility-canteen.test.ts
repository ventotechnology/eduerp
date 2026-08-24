import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createCanteen,
  createCanteenItem,
  getOrCreateCanteenWallet,
  depositCanteenWallet,
  setSpendingLimit,
  processCanteenSale,
} from '@/lib/services/canteen-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Canteen & Cashless POS Wallet Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let studentId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `can-tenant-${timestamp}`,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Canteen Test Institution',
        shortName: 'CAN',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `canteen-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `CMC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-CAN-${timestamp}`,
        admissionNumber: `ADM-CAN-${timestamp}`,
        firstName: 'Nabil',
        lastName: 'Hasan',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = student.id;

    actor = {
      id: 'canteen-staff-1',
      name: 'Cafeteria Manager',
      email: 'canteen@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('handles canteen menu, wallet topups, spending limits and cashless POS sales', async () => {
    const canteen = await createCanteen(
      actor.tenantId!,
      {
        campusId,
        code: `CAN-${Date.now()}`,
        name: 'Campus Central Cafeteria',
        operatorType: 'INSTITUTION_OWNED',
      },
      actor
    );
    expect(canteen.id).toBeDefined();

    const item1 = await createCanteenItem(
      actor.tenantId!,
      {
        canteenId: canteen.id,
        itemCode: 'SNK-01',
        name: 'Chicken Patty',
        category: 'SNACKS',
        salePrice: 60,
        costPrice: 40,
      },
      actor
    );

    const item2 = await createCanteenItem(
      actor.tenantId!,
      {
        canteenId: canteen.id,
        itemCode: 'BEV-01',
        name: 'Mango Juice (250ml)',
        category: 'BEVERAGES',
        salePrice: 35,
        costPrice: 25,
      },
      actor
    );

    const wallet = await getOrCreateCanteenWallet(actor.tenantId!, 'STUDENT', studentId, actor);
    expect(wallet.currentBalance).toBe(0);

    const depositResult = await depositCanteenWallet(
      actor.tenantId!,
      {
        walletId: wallet.id,
        amount: 500,
        notes: 'Guardian online top-up',
      },
      actor
    );
    expect(depositResult.wallet.currentBalance).toBe(500);

    await setSpendingLimit(
      actor.tenantId!,
      {
        walletId: wallet.id,
        dailyLimit: 200,
        weeklyLimit: 1000,
      },
      actor
    );

    const sale = await processCanteenSale(
      actor.tenantId!,
      {
        canteenId: canteen.id,
        buyerType: 'STUDENT',
        studentId,
        paymentMode: 'WALLET',
        items: [
          { itemId: item1.id, quantity: 2 },
          { itemId: item2.id, quantity: 1 },
        ],
        discountAmount: 0,
      },
      actor
    );
    expect(sale.totalAmount).toBe(155);
    expect(sale.status).toBe('COMPLETED');

    const walletAfter = await db.canteenWallet.findUnique({
      where: { id: wallet.id },
      include: { ledgers: { orderBy: { createdAt: 'desc' } } },
    });
    expect(walletAfter?.currentBalance).toBe(345);
    expect(walletAfter?.ledgers[0].transactionType).toBe('PURCHASE');
    expect(walletAfter?.ledgers[0].amount).toBe(-155);

    await expect(
      processCanteenSale(
        actor.tenantId!,
        {
          canteenId: canteen.id,
          buyerType: 'STUDENT',
          studentId,
          paymentMode: 'WALLET',
          items: [{ itemId: item1.id, quantity: 10 }],
        },
        actor
      )
    ).rejects.toThrow();
  });
});
