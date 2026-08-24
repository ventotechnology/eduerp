import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  createQuiz,
  getQuizStudentView,
  startQuizAttempt,
  submitQuizAttempt,
  gradeManualQuizResponse,
} from '@/lib/services/quiz-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: Quiz Engine, Server-Side Timing, Auto-Grading & Randomization', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let teacherActor: SessionUser;
  let studentActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-qz-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Quiz Test University',
        shortName: 'QTU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `quiz-${timestamp}@eduerp.us`,
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
        employeeCode: `EMP-QZ-${timestamp}`,
        firstName: 'Anisul',
        lastName: 'Haque',
        designation: 'Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 95000,
        phone: '01700000000',
        email: `anisul-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const stu = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-QZ-${timestamp}`,
        admissionNumber: `ADM-QZ-${timestamp}`,
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = stu.id;

    teacherActor = {
      id: emp.id,
      name: 'Prof. Anisul',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    studentActor = {
      id: 'student-quiz-actor',
      name: 'Tanvir Ahmed',
      email: 'tanvir@qtu.edu',
      role: 'STUDENT',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const crs = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `CSE-201-${timestamp}`,
        title: 'Data Structures & Algorithms',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;
  });

  it('creates quiz with questions snapshot, conceals answer keys from student, enforces timer and auto-grades objective responses', async () => {
    // 1. Create Quiz with 2 objective questions and 1 essay question
    const closeTime = new Date();
    closeTime.setDate(closeTime.getDate() + 3);

    const quiz = await createQuiz(
      tenantSlug,
      {
        courseId,
        title: 'Quiz 1: Trees & Binary Search Trees',
        durationMinutes: 20,
        maxAttempts: 1,
        totalMarks: 15,
        passMark: 8,
        negativeMarkingRatio: 0.25,
        closeTime: closeTime.toISOString(),
        questions: [
          {
            questionText: 'What is the worst-case search time complexity in an unbalanced Binary Search Tree (BST)?',
            questionType: 'MCQ_SINGLE',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
            correctAnswer: 'O(n)',
            marks: 5,
          },
          {
            questionText: 'A balanced AVL tree guarantees O(log n) worst-case lookup time.',
            questionType: 'TRUE_FALSE',
            options: ['True', 'False'],
            correctAnswer: 'True',
            marks: 5,
          },
          {
            questionText: 'Explain the difference between In-order and Post-order tree traversals.',
            questionType: 'ESSAY',
            correctAnswer: 'Subjective response evaluated by instructor.',
            marks: 5,
          },
        ],
      },
      teacherActor
    );
    expect(quiz.id).toBeDefined();

    // 2. Verify Student View conceals correct answers
    const studentView = await getQuizStudentView(tenantSlug, quiz.id);
    expect((studentView.questions[0] as any).correctAnswerJson).toBeUndefined();

    // 3. Start Quiz Attempt (Server timer expiry is recorded)
    const attempt = await startQuizAttempt(
      tenantSlug,
      {
        quizId: quiz.id,
        studentId,
      },
      studentActor
    );
    expect(attempt.status).toBe('IN_PROGRESS');
    expect(attempt.serverExpiryAt).toBeDefined();

    // 4. Submit Quiz with answers (Q1 correct, Q2 correct, Q3 essay pending)
    const q1 = quiz.questions[0].id;
    const q2 = quiz.questions[1].id;
    const q3 = quiz.questions[2].id;

    const submission = await submitQuizAttempt(
      tenantSlug,
      {
        attemptId: attempt.id,
        answers: {
          [q1]: 'O(n)',
          [q2]: 'True',
          [q3]: 'In-order visits Left-Root-Right, while Post-order visits Left-Right-Root.',
        },
      },
      studentActor
    );
    // Because Q3 is essay, status is SUBMITTED with auto-graded score of 10/15
    expect(submission.status).toBe('SUBMITTED');
    expect(submission.scoreObtained).toBe(10);

    // 5. Teacher manually grades Q3 Essay response
    const fullyGraded = await gradeManualQuizResponse(
      tenantSlug,
      {
        attemptId: attempt.id,
        questionId: q3,
        scoreAwarded: 5,
        teacherComments: 'Precise and accurate explanation.',
      },
      teacherActor
    );
    expect(fullyGraded.scoreObtained).toBe(15);
    expect(fullyGraded.status).toBe('GRADED');
    expect(fullyGraded.passed).toBe(true);
  });
});
