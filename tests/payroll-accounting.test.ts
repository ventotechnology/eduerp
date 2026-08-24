import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createSalaryStructure,
  assignEmployeeSalary,
  createPayrollPeriod,
  calculatePayrollForPeriod,
  approveAndPostPayroll,
} from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: HR Payroll Engine & Double-Entry General Ledger Posting', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let employeeId: string;
  let periodId: string;
  let adminUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `pti-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'COLLEGE',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Payroll Test Institute ${timestamp}`,
        shortName: `PTI${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'COMILLA',
        address: 'Kandirpar, Comilla',
        district: 'Comilla',
        division: 'Chittagong',
        upazilaThana: 'Adarsha Sadar',
        phone: '01744444444',
        email: `payroll-${timestamp}@eduerp.us`,
      },
    });

    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp.toString().slice(-4)}`,
        address: 'Comilla',
      },
    });
    campusId = campus.id;

    const employee = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-PAY-${timestamp.toString().slice(-4)}`,
        firstName: 'Dr. Rafiqul',
        lastName: 'Islam',
        designation: 'Associate Professor',
        department: 'Physics',
        category: 'TEACHING',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 60000,
        phone: '01744444444',
        email: `rafiq-${timestamp}@eduerp.us`,
      },
    });
    employeeId = employee.id;

    // Create an employee active loan
    await db.employeeLoan.create({
      data: {
        institutionId: inst.id,
        employeeId: employee.id,
        principalAmount: 50000,
        monthlyInstallment: 5000,
        totalPaid: 10000,
        remainingBalance: 40000,
        startDate: new Date('2026-01-01'),
        status: UserStatus.ACTIVE,
      },
    });

    adminUser = {
      id: `USR-HR-PAY-${timestamp}`,
      name: 'HR & Finance Director',
      email: `hr-director-${timestamp}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('configures salary structure and assigns to faculty employee', async () => {
    const structure = await createSalaryStructure(
      tenantSlug,
      {
        name: 'Senior Faculty Structure',
        basicPercentage: 50,
        houseRentPercentage: 30,
        medicalPercentage: 10,
        transportAllowance: 2000,
        pfEmployeePercentage: 8.33,
        pfEmployerPercentage: 8.33,
        taxDeductionPercentage: 5,
      },
      adminUser
    );

    expect(structure.basicPercentage).toBe(50);
    expect(structure.houseRentPercentage).toBe(30);

    const assignment = await assignEmployeeSalary(
      tenantSlug,
      {
        employeeId,
        salaryStructureId: structure.id,
        grossSalary: 60000,
        effectiveDate: '2026-01-01',
      },
      adminUser
    );

    expect(assignment.grossSalary).toBe(60000);
    expect(assignment.status).toBe('ACTIVE');
  });

  it('calculates payroll with component breakdowns, tax, PF, and loan deductions', async () => {
    const period = await createPayrollPeriod(
      tenantSlug,
      {
        name: 'August 2026',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      },
      adminUser
    );
    periodId = period.id;

    const calcResult = await calculatePayrollForPeriod(tenantSlug, period.id, adminUser);
    expect(calcResult.recordsCount).toBe(1);
    expect(calcResult.period.status).toBe('CALCULATED');

    const record = await db.payrollRecord.findFirst({
      where: { employeeId, payrollPeriodId: period.id },
    });

    expect(record).toBeDefined();
    // Gross: 60,000 (Basic 30,000, HouseRent 18,000, Medical 6,000, Transport 2,000, Other 4,000)
    expect(record?.basicSalary).toBe(30000);
    expect(record?.houseRent).toBe(18000);
    expect(record?.medicalAllowance).toBe(6000);
    expect(record?.transportAllowance).toBe(2000);
    expect(record?.otherAllowance).toBe(4000);
    expect(record?.grossSalary).toBe(60000);

    // Deductions: PF (8.33% of 30,000 = 2,499), Tax (5% of 60,000 = 3,000), Loan (5,000)
    expect(record?.providentFundDeduction).toBe(2499);
    expect(record?.taxDeduction).toBe(3000);
    expect(record?.loanDeduction).toBe(5000);
    expect(record?.totalDeduction).toBe(10499);
    expect(record?.netSalary).toBe(49501);
    expect(record?.payslipNumber).toMatch(/^SLIP-August2026-/);
  });

  it('approves payroll and posts balanced double-entry voucher to General Ledger', async () => {
    const postedPeriod = await approveAndPostPayroll(tenantSlug, periodId, adminUser);
    expect(postedPeriod.status).toBe('POSTED');
    expect(postedPeriod.journalEntryId).toBeDefined();

    const journal = await db.journalEntry.findUnique({
      where: { id: postedPeriod.journalEntryId! },
      include: { lines: { include: { account: true } } },
    });

    expect(journal).toBeDefined();
    expect(journal?.sourceType).toBe('PAYROLL');

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of journal!.lines) {
      totalDebits += line.debitAmount;
      totalCredits += line.creditAmount;
    }

    expect(totalDebits).toBe(60000);
    expect(totalCredits).toBe(60000);
    expect(totalDebits).toBe(totalCredits);
  });
});
