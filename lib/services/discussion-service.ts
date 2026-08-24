import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsDiscussionCreateSchema,
  LmsDiscussionPostCreateSchema,
  LmsDiscussionModerateSchema,
} from '@/lib/validations/schemas';
import { checkStudentCourseAccess } from './lms-course-service';

export async function createDiscussion(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsDiscussionCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  // Access check: if student, verify enrollment
  if (actor.role === 'STUDENT') {
    const student = await db.student.findFirst({
      where: { userId: actor.id, campus: { institutionId: tenant.institutionId } },
    });
    if (student) {
      const isEnrolled = await checkStudentCourseAccess(tenant.institutionId, course, student.id);
      if (!isEnrolled) throw AppError.forbidden('You are not enrolled in this course.');
    }
  }

  const discussion = await db.lmsDiscussion.create({
    data: {
      courseId: course.id,
      title: validated.title,
      description: validated.description,
      createdByUserId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      isPinned: validated.isPinned,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'DISCUSSION',
    newState: { discussionId: discussion.id, title: discussion.title },
  });

  return discussion;
}

export async function createDiscussionPost(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsDiscussionPostCreateSchema.parse(rawData);

  const discussion = await db.lmsDiscussion.findFirst({
    where: { id: validated.discussionId, course: { institutionId: tenant.institutionId } },
    include: { course: true },
  });
  if (!discussion) throw AppError.notFound('Discussion topic not found.');

  if (discussion.isLocked) {
    throw AppError.forbidden('This discussion topic has been locked by the instructor.');
  }

  const post = await db.lmsDiscussionPost.create({
    data: {
      discussionId: discussion.id,
      authorUserId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      content: validated.content,
      parentPostId: validated.parentPostId,
    },
  });

  await db.lmsDiscussion.update({
    where: { id: discussion.id },
    data: { postsCount: { increment: 1 } },
  });

  return post;
}

export async function getDiscussions(tenantIdentifier: string, courseId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.lmsDiscussion.findMany({
    where: { courseId, course: { institutionId: tenant.institutionId }, status: { not: 'HIDDEN' } },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getDiscussionThread(tenantIdentifier: string, discussionId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const discussion = await db.lmsDiscussion.findFirst({
    where: { id: discussionId, course: { institutionId: tenant.institutionId } },
    include: {
      posts: {
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
        include: { replies: true },
      },
    },
  });
  if (!discussion) throw AppError.notFound('Discussion thread not found.');
  return discussion;
}

export async function moderateDiscussion(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsDiscussionModerateSchema.parse(rawData);

  const discussion = await db.lmsDiscussion.findFirst({
    where: { id: validated.discussionId, course: { institutionId: tenant.institutionId } },
  });
  if (!discussion) throw AppError.notFound('Discussion topic not found.');

  const updateData: any = {};
  if (validated.action === 'PIN') updateData.isPinned = true;
  if (validated.action === 'UNPIN') updateData.isPinned = false;
  if (validated.action === 'LOCK') updateData.isLocked = true;
  if (validated.action === 'UNLOCK') updateData.isLocked = false;
  if (validated.action === 'HIDE') updateData.status = 'HIDDEN';
  if (validated.action === 'UNHIDE') updateData.status = 'ACTIVE';

  const updated = await db.lmsDiscussion.update({
    where: { id: discussion.id },
    data: updateData,
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'DISCUSSION',
    newState: { action: validated.action, discussionId: discussion.id },
  });

  return updated;
}
