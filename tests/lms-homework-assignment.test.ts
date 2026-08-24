import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  createHomework,
  submitHomework,
  createRubric,
  createAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
} from '@/lib/services/assignment-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: Homework, Rubric Assignments & Multi-Attempt Submission', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let teacherActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-asg-${timestamp}`, institutionType: 'COLLEGE', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Assignment Test College',
        shortName: 'ATC',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01711223344',
        email: `asg-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: { institutionId: inst.id, name: 'Main Campus', code: `MC-${timestamp}`, address: 'Dhaka' },
    });
    campusId = campus.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-ASG-${timestamp}`,
        firstName: 'Kamal',
        lastName: 'Uddin',
        designation: 'Senior Lecturer',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 60000,
        phone: '01700000000',
        email: `kamal-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const stu = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-ASG-${timestamp}`,
        admissionNumber: `ADM-ASG-${timestamp}`,
        firstName: 'Siddique',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = stu.id;

    teacherActor = {
      id: emp.id,
      name: 'Kamal Uddin',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const crs = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `MATH-HSC-${timestamp}`,
        title: 'Higher Mathematics (Calculus)',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;
  });

  it('manages homework, reusable rubrics, multi-attempt assignment submissions and teacher grading', async () => {
    // 1. Create Homework
    const hwDueDate = new Date();
    hwDueDate.setDate(hwDueDate.getDate() + 2);

    const hw = await createHomework(
      tenantSlug,
      {
        courseId,
        title: 'Daily Practice: Integration by Parts',
        instructions: 'Solve Exercises 7.2 problems 1 to 10.',
        dueDate: hwDueDate.toISOString(),
        maxMarks: 10,
      },
      teacherActor
    );
    expect(hw.id).toBeDefined();

    // 2. Submit Homework
    const hwSub = await submitHomework(
      tenantSlug,
      {
        homeworkId: hw.id,
        studentId,
        contentText: 'Completed all 10 problems on notebook.',
        attachmentUrl: 'https://eduerp.storage/hw/hw-sol-01.pdf',
      },
      teacherActor
    );
    expect(hwSub.status).toBe('SUBMITTED');

    // 3. Create Rubric
    const rubric = await createRubric(
      tenantSlug,
      {
        title: 'Mathematical Problem Solving Rubric',
        description: 'Evaluates derivation accuracy, method selection, and presentation.',
        totalPoints: 100,
        criteria: [
          {
            title: 'Mathematical Accuracy',
            description: 'Correct calculation and algebraic steps.',
            maxPoints: 50,
            levels: [
              { title: 'Excellent', points: 50, description: 'No calculation errors' },
              { title: 'Good', points: 40, description: 'Minor calculation error' },
              { title: 'Poor', points: 20, description: 'Major conceptual errors' },
            ],
          },
          {
            title: 'Step Clarity & Presentation',
            description: 'Logical flow and proof formatting.',
            maxPoints: 50,
            levels: [
              { title: 'Clear', points: 50, description: 'Well formatted steps' },
              { title: 'Incomplete', points: 25, description: 'Skipped intermediate steps' },
            ],
          },
        ],
      },
      teacherActor
    );
    expect(rubric.id).toBeDefined();
    expect(rubric.criteria.length).toBe(2);

    // 4. Create Formal Assignment with Rubric & 2 Allowed Attempts
    const asgDueDate = new Date();
    asgDueDate.setDate(asgDueDate.getDate() + 5);

    const asg = await createAssignment(
      tenantSlug,
      {
        courseId,
        title: 'Calculus Term Assignment: Differential Equations Modeling',
        instructions: 'Model damped oscillator system with second-order ODE.',
        totalMarks: 100,
        weightPercent: 20,
        dueDate: asgDueDate.toISOString(),
        submissionType: 'MULTIPLE_FILES',
        maxAttempts: 2,
        rubricId: rubric.id,
      },
      teacherActor
    );
    expect(asg.id).toBeDefined();

    // 5. Student submits Attempt 1
    const sub1 = await submitAssignment(
      tenantSlug,
      {
        assignmentId: asg.id,
        studentId,
        contentText: 'First draft submission with Python phase plots.',
        fileUrls: ['https://eduerp.storage/asg/plot1.png', 'https://eduerp.storage/asg/report.pdf'],
      },
      teacherActor
    );
    expect(sub1.attemptNumber).toBe(1);
    expect(sub1.status).toBe('SUBMITTED');

    // 6. Student submits Attempt 2 (Preserves Attempt 1 history!)
    const sub2 = await submitAssignment(
      tenantSlug,
      {
        assignmentId: asg.id,
        studentId,
        contentText: 'Revised submission incorporating teacher feedback.',
        fileUrls: ['https://eduerp.storage/asg/report-final.pdf'],
      },
      teacherActor
    );
    expect(sub2.attemptNumber).toBe(2);

    // Verify Attempt 1 still exists in DB
    const attempt1Check = await db.lmsAssignmentSubmission.findUnique({
      where: {
        assignmentId_studentId_attemptNumber: {
          assignmentId: asg.id,
          studentId,
          attemptNumber: 1,
        },
      },
    });
    expect(attempt1Check).toBeDefined();

    // 7. Teacher grades Attempt 2 using Rubric
    const graded = await gradeAssignmentSubmission(
      tenantSlug,
      {
        submissionId: sub2.id,
        score: 95,
        rubricScores: {
          [rubric.criteria[0].id]: 48,
          [rubric.criteria[1].id]: 47,
        },
        feedbackText: 'Outstanding analytical modeling and clear derivation steps.',
        status: 'GRADED',
      },
      teacherActor
    );
    expect(graded.score).toBe(95);
    expect(graded.status).toBe('GRADED');

    // Verify Gradebook score updated
    const gradebookScore = await db.lmsGradebookScore.findFirst({
      where: { studentId },
    });
    expect(gradebookScore?.scoreObtained).toBe(95);
    expect(gradebookScore?.finalWeightedScore).toBe(19); // 95% of 20% weight = 19 points
  });
});
