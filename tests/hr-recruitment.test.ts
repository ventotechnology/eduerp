import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createPosition } from '@/lib/services/employee-service';
import {
  createJobRequisition,
  approveJobRequisition,
  createJobVacancy,
  registerJobCandidate,
  recordCandidateInterview,
  issueJobOffer,
  convertCandidateToEmployee,
} from '@/lib/services/recruitment-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: Talent Acquisition, Recruitment Pipeline & Hiring Conversion', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let positionId: string;
  let hrUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `rec-uni-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'COLLEGE',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Recruitment Test College ${timestamp}`,
        shortName: `RTC${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01733334444',
        email: `recruitment-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp.toString().slice(-4)}`,
        address: 'Dhanmondi',
      },
    });
    campusId = campus.id;

    hrUser = {
      id: `USR-HR-${timestamp}`,
      name: 'Head of Recruitment',
      email: `recruiter-${timestamp}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const position = await createPosition(
      tenantSlug,
      {
        positionCode: `POS-ENG-${timestamp.toString().slice(-4)}`,
        title: 'Senior English Lecturer',
        campusId,
        category: 'TEACHING',
        authorizedHeadcount: 2,
      },
      hrUser
    );
    positionId = position.id;
  });

  it('runs complete recruitment pipeline from requisition to vacancy and candidate registration', async () => {
    // 1. Requisition
    const req = await createJobRequisition(
      tenantSlug,
      {
        positionId,
        requestedHeadcount: 1,
        reason: 'Increased student enrollment in English Language Program',
        requiredByDate: '2026-09-01',
      },
      hrUser
    );
    expect(req.requisitionNumber).toMatch(/^REQ-/);
    expect(req.status).toBe('SUBMITTED');

    // 2. Approve Requisition
    const approvedReq = await approveJobRequisition(tenantSlug, req.id, hrUser);
    expect(approvedReq.status).toBe('APPROVED');

    // 3. Create Vacancy
    const vacancy = await createJobVacancy(
      tenantSlug,
      {
        positionId,
        campusId,
        title: 'Senior English Lecturer Wanted',
        jobType: 'EXTERNAL',
        employmentType: 'PERMANENT',
        responsibilities: 'Conduct undergraduate literature lectures and oversee debate club',
        requirements: 'Master of Arts in English with minimum 3 years teaching experience',
        closingDate: '2026-08-30',
      },
      hrUser
    );
    expect(vacancy.vacancyCode).toMatch(/^VAC-/);
    expect(vacancy.status).toBe('PUBLISHED');

    // 4. Candidate Applies
    const candidate = await registerJobCandidate(tenantSlug, {
      vacancyId: vacancy.id,
      firstName: 'Sadia',
      lastName: 'Afrin',
      email: 'sadia.afrin@gmail.com',
      phone: '01799998888',
      highestQualification: 'M.A. in English (DU)',
      experienceYears: 4,
      source: 'PORTAL',
    });
    expect(candidate.applicantNumber).toMatch(/^APP-/);
    expect(candidate.stage).toBe('APPLIED');

    // 5. Conduct Interview
    const interview = await recordCandidateInterview(
      tenantSlug,
      {
        candidateId: candidate.id,
        interviewDate: '2026-08-15',
        roundName: 'Panel Interview & Demo Lecture',
        interviewers: 'Principal, Vice Principal, HOD English',
        criteriaScores: JSON.stringify({ subjectKnowledge: 90, communication: 95, teachingDemo: 92 }),
        totalScore: 92.3,
        comments: 'Outstanding pedagogical presentation and clear command of language',
        recommendation: 'HIRE',
      },
      hrUser
    );
    expect(interview.recommendation).toBe('HIRE');

    // 6. Issue Job Offer
    const offer = await issueJobOffer(
      tenantSlug,
      {
        candidateId: candidate.id,
        positionId,
        employmentType: 'PERMANENT',
        proposedJoiningDate: '2026-09-01',
        offeredGrossSalary: 60000,
        expiryDate: '2026-08-25',
      },
      hrUser
    );
    expect(offer.offerNumber).toMatch(/^OFR-/);
    expect(offer.status).toBe('SENT');

    // 7. Candidate Accepts & Converts into Employee
    const employee = await convertCandidateToEmployee(
      tenantSlug,
      {
        candidateId: candidate.id,
        offerId: offer.id,
        campusId,
        employeeCode: 'EMP-ENG-201',
        joiningDate: '2026-09-01',
        basicSalary: 30000,
      },
      hrUser
    );

    expect(employee.employeeCode).toBe('EMP-ENG-201');
    expect(employee.status).toBe('PROBATION');
    expect(employee.designation).toBe('Senior English Lecturer');

    // Verify candidate stage updated to HIRED
    const checkedCandidate = await db.jobCandidate.findUnique({ where: { id: candidate.id } });
    expect(checkedCandidate?.stage).toBe('HIRED');
    expect(checkedCandidate?.convertedEmployeeId).toBe(employee.id);

    // 8. Prevent duplicate hire conversion
    await expect(
      convertCandidateToEmployee(
        tenantSlug,
        {
          candidateId: candidate.id,
          offerId: offer.id,
          campusId,
          employeeCode: 'EMP-ENG-202',
          joiningDate: '2026-09-01',
          basicSalary: 30000,
        },
        hrUser
      )
    ).rejects.toThrow(/already been hired/);
  });
});
