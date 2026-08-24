import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  createDiscussion,
  createDiscussionPost,
  getDiscussions,
  getDiscussionThread,
  moderateDiscussion,
} from '@/lib/services/discussion-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: Course Discussions, Peer Collaboration & Teacher Moderation', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let courseId: string;
  let teacherActor: SessionUser;
  let studentActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-dsc-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Discussion Test University',
        shortName: 'DTU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `dsc-${timestamp}@eduerp.us`,
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
        employeeCode: `EMP-DSC-${timestamp}`,
        firstName: 'Zahid',
        lastName: 'Hasan',
        designation: 'Assistant Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 75000,
        phone: '01700000000',
        email: `zahid-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    teacherActor = {
      id: emp.id,
      name: 'Dr. Zahid Hasan',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    studentActor = {
      id: 'student-disc-1',
      name: 'Mustafizur Rahman',
      email: 'mustafiz@dtu.edu',
      role: 'STUDENT',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const crs = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `SWE-301-${timestamp}`,
        title: 'Software Engineering Principles',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;
  });

  it('creates discussion topics, handles hierarchical replies, and enforces teacher moderation (Pin & Lock)', async () => {
    // 1. Create Discussion Topic
    const discussion = await createDiscussion(
      tenantSlug,
      {
        courseId,
        title: 'Design Patterns: Dependency Injection vs Service Locator',
        description: 'Discuss the maintainability trade-offs in microservices testing.',
      },
      teacherActor
    );
    expect(discussion.id).toBeDefined();

    // 2. Student Post
    const post1 = await createDiscussionPost(
      tenantSlug,
      {
        discussionId: discussion.id,
        content: 'Dependency injection significantly simplifies unit testing with mock dependencies.',
      },
      studentActor
    );
    expect(post1.id).toBeDefined();

    // 3. Teacher replies to student post
    const reply = await createDiscussionPost(
      tenantSlug,
      {
        discussionId: discussion.id,
        content: 'Exactly right, especially when using IoC containers for automated lifecycle management.',
        parentPostId: post1.id,
      },
      teacherActor
    );
    expect(reply.parentPostId).toBe(post1.id);

    // 4. Pin and Lock Discussion
    const pinned = await moderateDiscussion(tenantSlug, { discussionId: discussion.id, action: 'PIN' }, teacherActor);
    expect(pinned.isPinned).toBe(true);

    const locked = await moderateDiscussion(tenantSlug, { discussionId: discussion.id, action: 'LOCK' }, teacherActor);
    expect(locked.isLocked).toBe(true);

    // Verify posting to locked topic is rejected
    await expect(
      createDiscussionPost(
        tenantSlug,
        {
          discussionId: discussion.id,
          content: 'Attempting to post in locked topic',
        },
        studentActor
      )
    ).rejects.toThrow(/locked/i);
  });
});
