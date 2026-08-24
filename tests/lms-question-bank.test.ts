import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createQuestionBankItem,
  approveQuestionBankItem,
  getQuestionBankList,
  generateAiQuestionsDraft,
} from '@/lib/services/question-bank-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: Question Bank, Versioning, Answer Key Security & AI Generator', () => {
  let institutionId: string;
  let teacherActor: SessionUser;
  let studentActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-qb-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'QB Test University',
        shortName: 'QBU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `qb-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    teacherActor = {
      id: 'teacher-qb-1',
      name: 'Dr. Rafiqul',
      email: 'rafiqul@qbu.edu',
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    studentActor = {
      id: 'student-qb-1',
      name: 'Farhan Student',
      email: 'student@qbu.edu',
      role: 'STUDENT',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates multi-type questions with Bloom categorization, approves questions, blocks student access, and generates AI drafts', async () => {
    // 1. Create MCQ Question
    const mcq = await createQuestionBankItem(
      tenantSlug,
      {
        topic: 'Newtonian Mechanics',
        questionType: 'MCQ_SINGLE',
        difficulty: 'MEDIUM',
        bloomTaxonomy: 'APPLY',
        questionText: 'What is the work done by a centripetal force acting on a body in uniform circular motion?',
        options: ['Zero (0 Joules)', 'Equal to kinetic energy', 'Force multiplied by radius', 'Infinity'],
        correctAnswer: 'Zero (0 Joules)',
        marks: 1,
        explanation: 'Because the centripetal force is always perpendicular to displacement (cos 90 = 0).',
        status: 'UNDER_REVIEW',
      },
      teacherActor
    );
    expect(mcq.id).toBeDefined();
    expect(mcq.status).toBe('UNDER_REVIEW');

    // 2. Approve Question
    const approved = await approveQuestionBankItem(tenantSlug, mcq.id, teacherActor);
    expect(approved.status).toBe('APPROVED');

    // 3. Security: Student unauthorized access to Question Bank list is blocked
    await expect(
      getQuestionBankList(tenantSlug, {}, studentActor)
    ).rejects.toThrow(/unauthorized/i);

    // 4. AI Question Generation Workflow (creates DRAFT items requiring teacher review)
    const aiDrafts = await generateAiQuestionsDraft(
      tenantSlug,
      {
        subject: 'Physics',
        topic: 'Thermodynamics & Heat Engines',
        difficulty: 'HARD',
        count: 3,
        bloomTaxonomy: 'ANALYZE',
      },
      teacherActor
    );
    expect(aiDrafts.length).toBe(3);
    expect(aiDrafts[0].status).toBe('DRAFT'); // AI generated questions MUST be DRAFT until teacher approves
  });
});
