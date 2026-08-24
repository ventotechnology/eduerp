import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createEmployee } from '@/lib/services/employee-service';
import {
  createPerformanceCycle,
  createEmployeeGoal,
  submitPerformanceReview,
  createTrainingProgram,
  nominateEmployeeForTraining,
  recordEmployeeDisciplinaryCase,
  issueEmployeeWarning,
  submitEmployeeGrievance,
} from '@/lib/services/talent-lifecycle-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: Performance Appraisal, Training, Discipline & Grievance Systems', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let employeeId: string;
  let hrUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `perf-inst-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Performance University ${timestamp}`,
        shortName: `PU${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'UGC',
        address: 'Banani, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Banani',
        phone: '01788889999',
        email: `perf-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp.toString().slice(-4)}`,
        address: 'Banani',
      },
    });
    campusId = campus.id;

    hrUser = {
      id: `USR-HR-${timestamp}`,
      name: 'Appraisal & Training Director',
      email: `director-hr-${timestamp}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const emp = await createEmployee(
      tenantSlug,
      {
        campusId,
        employeeCode: `EMP-PRF-01`,
        firstName: 'Farhana',
        lastName: 'Yesmin',
        designation: 'Assistant Professor',
        category: 'TEACHING',
        status: 'ACTIVE',
        basicSalary: 55000,
        phone: '01711223344',
        email: 'farhana@pu.edu.bd',
        joiningDate: '2022-01-01',
      },
      hrUser
    );
    employeeId = emp.id;
  });

  it('creates performance cycle, sets faculty goals, and records structured performance review', async () => {
    // 1. Appraisal Cycle
    const cycle = await createPerformanceCycle(
      tenantSlug,
      {
        name: 'Annual Faculty Appraisal 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
      hrUser
    );
    expect(cycle.name).toBe('Annual Faculty Appraisal 2026');

    // 2. Faculty Goal
    const goal = await createEmployeeGoal(
      tenantSlug,
      {
        employeeId,
        cycleId: cycle.id,
        title: 'Publish 2 Scopus-Indexed Q1/Q2 Journal Articles',
        weightagePercentage: 40,
        targetMetric: '2 Published Journal Papers',
      },
      hrUser
    );
    expect(goal.weightagePercentage).toBe(40);

    // 3. Performance Review
    const review = await submitPerformanceReview(
      tenantSlug,
      {
        employeeId,
        cycleId: cycle.id,
        teachingScore: 94,
        researchScore: 90,
        serviceScore: 88,
        overallScore: 91.6,
        rating: 'OUTSTANDING',
        selfReviewSummary: 'Completed full course curriculum and mentored 4 undergraduate thesis groups.',
        managerReviewSummary: 'Demonstrated exemplary dedication in classroom teaching and research output.',
        status: 'FINALIZED',
      },
      hrUser
    );
    expect(review.rating).toBe('OUTSTANDING');
    expect(review.overallScore).toBe(91.6);
  });

  it('manages institutional training programs and employee nominations', async () => {
    const training = await createTrainingProgram(
      tenantSlug,
      {
        title: 'Outcome-Based Education (OBE) & Higher Ed Curriculum Design',
        provider: 'UGC Quality Assurance Cell',
        trainingType: 'PEDAGOGY',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        capacity: 25,
        cost: 15000,
      },
      hrUser
    );
    expect(training.title).toContain('Outcome-Based Education');

    const nomination = await nominateEmployeeForTraining(
      tenantSlug,
      {
        employeeId,
        trainingProgramId: training.id,
      },
      hrUser
    );
    expect(nomination.status).toBe('NOMINATED');
  });

  it('records disciplinary incident, issues warning, and files confidential grievance', async () => {
    // 1. Disciplinary Case
    const disc = await recordEmployeeDisciplinaryCase(
      tenantSlug,
      {
        employeeId,
        incidentDate: '2026-08-10',
        allegation: 'Repeated unexcused delay in submitting midterm marks moderation report',
      },
      hrUser
    );
    expect(disc.caseNumber).toMatch(/^DIS-/);
    expect(disc.status).toBe('OPEN');

    // 2. Issue Formal Warning
    const warning = await issueEmployeeWarning(
      tenantSlug,
      {
        employeeId,
        warningLevel: 'WRITTEN',
        issueDate: '2026-08-12',
        reason: 'First written warning regarding adherence to academic assessment deadlines',
      },
      hrUser
    );
    expect(warning.warningLevel).toBe('WRITTEN');

    // 3. Confidential Grievance Submission
    const grievance = await submitEmployeeGrievance(
      tenantSlug,
      {
        employeeId,
        subject: 'Request for ventilation improvements in Chemistry Research Lab',
        details: 'Fume hood exhaust motor needs maintenance to prevent chemical odor buildup during undergraduate experiments.',
        isConfidential: true,
      },
      hrUser
    );
    expect(grievance.ticketNumber).toMatch(/^GRV-/);
    expect(grievance.isConfidential).toBe(true);
  });
});
