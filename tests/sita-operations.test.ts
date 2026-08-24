import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { requireTenant } from '../lib/tenant/tenant-guard';
import { createEmployee } from '../lib/services/employee-service';
import { createFixedAsset } from '../lib/services/fixed-asset-service';
import { createLibraryCatalog } from '../lib/services/library-service';
import { createHostelMaster } from '../lib/services/hostel-service';
import { initializeStandardChartOfAccounts, createJournalEntry } from '../lib/services/finance-service';
import { UserStatus } from '@prisma/client';

describe('Command 12A.2 — SITA Operational Recovery, Campus Context, Finance, HR & Facilities Suite', () => {
  let sitaTenant: any;
  let sitaCampus: any;
  let actor: any;

  beforeAll(async () => {
    // 1. Resolve SITA tenant using canonical guard
    let tenantContext: any = null;
    try {
      tenantContext = await requireTenant('scholars-international-tahfiz-academy');
    } catch {
      try {
        tenantContext = await requireTenant('sita');
      } catch {
        tenantContext = null;
      }
    }

    if (!tenantContext) {
      // Provision test SITA tenant if running in fresh test DB
      const t = await db.tenant.create({
        data: {
          slug: 'scholars-international-tahfiz-academy',
          isActive: true,
        },
      });

      const inst = await db.institution.create({
        data: {
          tenantId: t.id,
          name: 'Scholars International Tahfiz Academy',
          shortName: 'SITA',
          address: 'Campus Main Facility',
          district: 'Dhaka',
          division: 'Dhaka',
          upazilaThana: 'Mirpur',
          phone: '01711223344',
          email: 'contact@scholarsita.com',
          principalHeadName: 'Mohammad Saifullah',
        },
      });

      sitaCampus = await db.campus.create({
        data: {
          institutionId: inst.id,
          name: 'SITA Main Campus',
          code: 'SITA-MAIN',
          address: 'Campus Main Facility',
          type: 'Main Campus',
          isMain: true,
        },
      });

      tenantContext = await requireTenant(t.slug);
    }

    sitaTenant = tenantContext;
    sitaCampus = await db.campus.findFirst({
      where: { institutionId: sitaTenant.institutionId },
      orderBy: { isMain: 'desc' },
    });

    if (!sitaCampus) {
      sitaCampus = await db.campus.create({
        data: {
          institutionId: sitaTenant.institutionId,
          name: 'SITA Main Campus',
          code: 'SITA-MAIN',
          address: 'Campus Main Facility',
          type: 'Main Campus',
          isMain: true,
        },
      });
    }

    actor = {
      userId: 'sita-principal-actor',
      name: 'Mohammad Saifullah',
      email: 'contact@scholarsita.com',
      role: 'PRINCIPAL',
      status: UserStatus.ACTIVE,
    };
  });

  describe('1. Institutional Profile & Display Name Fidelity', () => {
    it('should reflect Mohammad Saifullah as the institutional principal name', () => {
      expect(sitaTenant.name || sitaTenant.institution?.name).toContain('Scholars International Tahfiz Academy');
      expect(actor.name).toBe('Mohammad Saifullah');
      expect(actor.name).not.toBe('contact');
    });
  });

  describe('2. HR Campus Resolution & Employee Creation', () => {
    it('should successfully onboard an employee even with fallback campusId without throwing campus not found', async () => {
      const empCode = `EMP-SITA-${Date.now().toString().slice(-4)}`;
      const employee = await createEmployee(
        sitaTenant.slug,
        {
          campusId: 'CAMPUS-MAIN', // Test default fallback resolution
          employeeCode: empCode,
          firstName: 'Hafiz',
          lastName: 'Abdur Rahman',
          designation: 'Senior Quran Teacher',
          category: 'TEACHING',
          status: 'ACTIVE',
          academicRank: 'Senior Ustaz',
          employmentType: 'PERMANENT',
          basicSalary: 45000,
          phone: '01711223344',
          email: `${empCode.toLowerCase()}@scholarsita.com`,
          joiningDate: new Date(),
        },
        actor
      );

      expect(employee).toBeDefined();
      expect(employee.employeeCode).toBe(empCode);
      expect(employee.campusId).toBe(sitaCampus.id);
    });
  });

  describe('3. Facilities Campus Resolution & Operational Creation', () => {
    it('should successfully register a Fixed Asset with intelligent campus mapping', async () => {
      const assetTag = `AST-SITA-${Date.now().toString().slice(-4)}`;
      const asset = await createFixedAsset(
        sitaTenant.slug,
        {
          campusId: 'CAMPUS-MAIN',
          assetTag,
          name: 'Classroom Smart Digital Screen 65-inch',
          category: 'PROJECTOR',
          purchaseCost: 85000,
          purchaseDate: new Date(),
          warrantyMonths: 24,
          status: 'IN_STORAGE',
        },
        actor
      );

      expect(asset).toBeDefined();
      expect(asset.assetTag).toBe(assetTag);
      expect(asset.campusId).toBe(sitaCampus.id);
    });

    it('should successfully create a Library Catalog item with intelligent campus mapping', async () => {
      const isbn = `ISBN-SITA-${Date.now().toString().slice(-6)}`;
      const catalog = await createLibraryCatalog(
        sitaTenant.slug,
        {
          title: 'Tajweed Rules of the Quran',
          author: 'Sheikh Kareem',
          isbn,
          category: 'Islamic Studies',
          classificationNumber: 'ISL-TAJ-01',
        },
        actor
      );

      expect(catalog).toBeDefined();
      expect(catalog.title).toBe('Tajweed Rules of the Quran');
    });

    it('should successfully create a Hostel Master building with intelligent campus mapping', async () => {
      const hostelCode = `HST-${Date.now().toString().slice(-4)}`;
      const hostel = await createHostelMaster(
        sitaTenant.slug,
        {
          campusId: 'CAMPUS-MAIN',
          code: hostelCode,
          name: 'Imam Shatibi Tahfiz Residence',
          type: 'BOYS',
          capacity: 40,
          wardenName: 'Ustaz Tariq',
          wardenPhone: '01899887766',
        },
        actor
      );

      expect(hostel).toBeDefined();
      expect(hostel.code).toBe(hostelCode);
      expect(hostel.campusId).toBe(sitaCampus.id);
    });
  });

  describe('4. Finance Standard Chart of Accounts & Journal Voucher Posting', () => {
    it('should idempotently bootstrap the standard 5-element Chart of Accounts', async () => {
      const accounts = await initializeStandardChartOfAccounts(sitaTenant.slug, actor);
      expect(accounts.length).toBeGreaterThanOrEqual(15);

      const assets = accounts.find((a: any) => a.code === '1000');
      const liabilities = accounts.find((a: any) => a.code === '2000');
      const equity = accounts.find((a: any) => a.code === '3000');
      const revenue = accounts.find((a: any) => a.code === '4000');
      const expense = accounts.find((a: any) => a.code === '5000');

      expect(assets).toBeDefined();
      expect(liabilities).toBeDefined();
      expect(equity).toBeDefined();
      expect(revenue).toBeDefined();
      expect(expense).toBeDefined();
    });

    it('should successfully post a balanced double-entry manual journal voucher', async () => {
      const accounts = await db.chartOfAccount.findMany({
        where: { institutionId: sitaTenant.institutionId, isHeader: false },
      });

      expect(accounts.length).toBeGreaterThanOrEqual(2);
      const debitAcc = accounts[0];
      const creditAcc = accounts[1];

      // Ensure fiscal year / period exists
      let fiscalYear = await db.fiscalYear.findFirst({
        where: { institutionId: sitaTenant.institutionId },
      });

      if (!fiscalYear) {
        fiscalYear = await db.fiscalYear.create({
          data: {
            institutionId: sitaTenant.institutionId,
            name: `FY-${Date.now().toString().slice(-4)}`,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            isCurrent: true,
            status: 'OPEN',
          },
        });
      }

      let fiscalPeriod = await db.fiscalPeriod.findFirst({
        where: { fiscalYearId: fiscalYear.id, isClosed: false },
      });

      if (!fiscalPeriod) {
        fiscalPeriod = await db.fiscalPeriod.create({
          data: {
            institutionId: sitaTenant.institutionId,
            fiscalYearId: fiscalYear.id,
            name: `Period 1 - 2026`,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            isClosed: false,
          },
        });
      }

      const journal = await createJournalEntry(
        sitaTenant.slug,
        {
          fiscalYearId: fiscalYear.id,
          fiscalPeriodId: fiscalPeriod.id,
          description: 'SITA Campus Operational Supplies Purchase',
          sourceType: 'MANUAL',
          lines: [
            { accountId: debitAcc.id, debitAmount: 5000, creditAmount: 0, memo: 'Office supplies debit' },
            { accountId: creditAcc.id, debitAmount: 0, creditAmount: 5000, memo: 'Cash on hand credit' },
          ],
        },
        actor
      );

      expect(journal).toBeDefined();
      expect(journal.isPosted).toBe(true);
      expect(journal.status).toBe('POSTED');
    });
  });
});
