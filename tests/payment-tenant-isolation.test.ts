import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { recordInvoicePayment } from '../lib/services/finance-service';
import { UserRole } from '@prisma/client';
import { UserStatus } from '../lib/auth/types';

describe('Command 12A.5E — Payment Multi-Tenant Isolation & Boundary Security Suite', () => {
  let tenantSlugA: string;
  let tenantSlugB: string;
  let invoiceIdA: string;
  let instAId: string;
  let instBId: string;

  beforeEach(async () => {
    tenantSlugA = `tenant-a-iso-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    tenantSlugB = `tenant-b-iso-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Tenant A
    const tenantA = await db.tenant.create({
      data: { slug: tenantSlugA, institutionType: 'SCHOOL', subscriptionTier: 'ENTERPRISE', isTestTenant: true }
    });
    const instA = await db.institution.create({
      data: {
        tenantId: tenantA.id,
        name: 'Academy A',
        shortName: 'ACA-A',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711111111',
        email: 'info@tenanta.eduerp.us'
      }
    });
    instAId = instA.id;

    const campusA = await db.campus.create({
      data: { institutionId: instA.id, name: 'Campus A', code: 'MAIN', address: 'Dhaka', phone: '01711111111', email: 'c@a.us', isMain: true }
    });
    const ayA = await db.academicYear.create({
      data: { institutionId: instA.id, name: 'AY 2026', code: `AY-A-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') }
    });
    const stuA = await db.student.create({
      data: {
        campusId: campusA.id,
        studentIdNumber: `STU-A-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        admissionNumber: `ADM-A-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: 'Tariq',
        lastName: 'Ali',
        gender: 'MALE',
        dateOfBirth: new Date('2012-01-01'),
        presentAddress: 'Dhanmondi, Dhaka',
        permanentAddress: 'Dhanmondi, Dhaka',
        status: 'ACTIVE' as any
      }
    });
    const invA = await db.invoice.create({
      data: {
        studentId: stuA.id,
        invoiceNumber: `INV-A-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Tuition Fee A',
        subTotal: 5000,
        totalAmount: 5000,
        paidAmount: 0,
        dueAmount: 5000,
        status: 'UNPAID',
        dueDate: new Date()
      }
    });
    invoiceIdA = invA.id;

    // 2. Create Tenant B
    const tenantB = await db.tenant.create({
      data: { slug: tenantSlugB, institutionType: 'SCHOOL', subscriptionTier: 'ENTERPRISE', isTestTenant: true }
    });
    const instB = await db.institution.create({
      data: {
        tenantId: tenantB.id,
        name: 'Academy B',
        shortName: 'ACA-B',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01722222222',
        email: 'info@tenantb.eduerp.us'
      }
    });
    instBId = instB.id;
  });

  afterEach(async () => {
    const tA = await db.tenant.findUnique({ where: { slug: tenantSlugA } });
    if (tA) {
      await db.paymentAllocation.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: tA.id } } } } } });
      await db.paymentTransaction.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: tA.id } } } } } });
      await db.journalEntry.deleteMany({ where: { institutionId: instAId } });
      await db.chartOfAccount.deleteMany({ where: { institutionId: instAId } });
      await db.invoice.deleteMany({ where: { student: { campus: { institution: { tenantId: tA.id } } } } });
      await db.student.deleteMany({ where: { campus: { institution: { tenantId: tA.id } } } });
      await db.academicYear.deleteMany({ where: { institutionId: instAId } });
      await db.campus.deleteMany({ where: { institutionId: instAId } });
      await db.institution.deleteMany({ where: { tenantId: tA.id } });
      await db.tenant.delete({ where: { id: tA.id } });
    }

    const tB = await db.tenant.findUnique({ where: { slug: tenantSlugB } });
    if (tB) {
      await db.institution.deleteMany({ where: { tenantId: tB.id } });
      await db.tenant.delete({ where: { id: tB.id } });
    }
  });

  it('1. Cross-Tenant Payment Injection: Tenant B actor cannot mutate or pay Tenant A invoice', async () => {
    const tenantBActor = {
      id: 'user-b-accountant',
      name: 'Accountant B',
      email: `accountant@${tenantSlugB}.eduerp.us`,
      role: UserRole.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      tenantId: 'temp',
      isSuperAdmin: false,
      isPlatformAdmin: false
    };

    // Attempting to pay Tenant A's invoice within Tenant B context
    await expect(
      recordInvoicePayment(
        tenantSlugB, // Tenant B scope
        {
          invoiceId: invoiceIdA, // Tenant A's invoice ID
          amount: 5000,
          paymentDate: new Date(),
          gateway: 'BKASH',
          transactionRef: `CROSS-TENANT-TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
        },
        tenantBActor
      )
    ).rejects.toThrow(/Invoice not found/);
  });
});
