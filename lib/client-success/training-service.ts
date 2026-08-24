import crypto from 'crypto';
import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';

const CERT_SIGNING_SECRET = process.env.APP_SECRET || process.env.JWT_SECRET || 'eduerp-training-certificate-registry-key';

export function generateCertificateSignature(
  certNumber: string,
  userId: string,
  courseId: string,
  issuedAt: Date
): string {
  const payload = `${certNumber}:${userId}:${courseId}:${issuedAt.toISOString()}`;
  return crypto.createHmac('sha256', CERT_SIGNING_SECRET).update(payload).digest('hex');
}

export function verifyCertificateSignature(
  certNumber: string,
  userId: string,
  courseId: string,
  issuedAt: Date,
  expectedSignature?: string | null
): boolean {
  if (!expectedSignature) return true; // Graceful compatibility for pre-existing records
  const computed = generateCertificateSignature(certNumber, userId, courseId, issuedAt);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSignature));
}

export async function generateCertificateNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const seq = await db.$transaction(async (tx) => {
    let s = await tx.trainingCertificateSequence.findUnique({
      where: { id: 'cert_seq' }
    });

    if (!s) {
      s = await tx.trainingCertificateSequence.create({
        data: {
          id: 'cert_seq',
          currentNumber: 1,
          year: currentYear
        }
      });
      return s.currentNumber;
    }

    if (s.year !== currentYear) {
      const updated = await tx.trainingCertificateSequence.update({
        where: { id: 'cert_seq' },
        data: {
          currentNumber: 1,
          year: currentYear
        }
      });
      return updated.currentNumber;
    }

    const updated = await tx.trainingCertificateSequence.update({
      where: { id: 'cert_seq' },
      data: {
        currentNumber: { increment: 1 }
      }
    });

    return updated.currentNumber;
  });

  const padded = String(seq).padStart(6, '0');
  return `CERT-TRN-${currentYear}-${padded}`;
}

export function validateCourseAccess(
  course: { targetRole?: string | null; institutionType?: string | null; title: string },
  user?: { role?: string; institutionType?: string; isPlatformAdmin?: boolean }
) {
  if (!user || user.isPlatformAdmin) return true;

  // Enforce role restriction
  if (course.targetRole && course.targetRole !== 'ALL') {
    if (user.role !== course.targetRole) {
      throw AppError.forbidden(
        `Enrollment restricted: Course '${course.title}' is designated for '${course.targetRole}' staff.`
      );
    }
  }

  // Enforce institution type restriction
  if (course.institutionType && course.institutionType !== 'ALL') {
    if (user.institutionType && user.institutionType !== course.institutionType) {
      throw AppError.forbidden(
        `Enrollment restricted: Course '${course.title}' is designated for ${course.institutionType} institutions.`
      );
    }
  }

  return true;
}

export async function listTrainingCourses(userId?: string) {
  const courses = await db.trainingCourse.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      modules: {
        orderBy: { displayOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { displayOrder: 'asc' },
            select: { id: true, title: true, slug: true, lessonType: true, durationMinutes: true }
          }
        }
      },
      ...(userId
        ? {
            enrollments: {
              where: { userId },
              take: 1
            }
          }
        : {})
    }
  });

  return courses.map((c) => {
    const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const enrollment = (c as any).enrollments?.[0] || null;
    return {
      ...c,
      totalModules: c.modules.length,
      totalLessons,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            completedAt: enrollment.completedAt
          }
        : null
    };
  });
}

export async function getTrainingCourseBySlug(
  slug: string,
  userOrUserId?: string | { id?: string; role?: string; institutionType?: string; isPlatformAdmin?: boolean }
) {
  const user = typeof userOrUserId === 'string' ? { id: userOrUserId } : userOrUserId;

  const course = await db.trainingCourse.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { displayOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { displayOrder: 'asc' },
            include: {
              quiz: {
                include: {
                  questions: {
                    orderBy: { displayOrder: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!course || !course.isPublished) {
    throw AppError.notFound(`Training course '${slug}' not found.`);
  }

  const userId = user?.id;
  let userEnrollment: any = null;
  let userProgress: any[] = [];
  let userCertificate: any = null;

  if (userId) {
    userEnrollment = await db.trainingEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId
        }
      }
    });

    if (userEnrollment) {
      userProgress = await db.trainingProgress.findMany({
        where: { enrollmentId: userEnrollment.id }
      });

      userCertificate = await db.trainingCertificate.findFirst({
        where: { courseId: course.id, userId }
      });
    }
  }

  // SECURITY: Sanitize quiz questions — STRICTLY exclude correctOptionId and explanation before submission
  const sanitizedModules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    displayOrder: m.displayOrder,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      content: l.content,
      lessonType: l.lessonType,
      videoUrl: l.videoUrl,
      durationMinutes: l.durationMinutes,
      displayOrder: l.displayOrder,
      quiz: l.quiz
        ? {
            id: l.quiz.id,
            title: l.quiz.title,
            passingScore: l.quiz.passingScore,
            questions: l.quiz.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : q.optionsJson,
              displayOrder: q.displayOrder
              // correctOptionId and explanation intentionally omitted for security
            }))
          }
        : null
    }))
  }));

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    audience: course.audience,
    targetRole: course.targetRole,
    institutionType: course.institutionType,
    difficulty: course.difficulty,
    durationMinutes: course.durationMinutes,
    language: course.language,
    thumbnailUrl: course.thumbnailUrl,
    certificateEnabled: course.certificateEnabled,
    passingScore: course.passingScore,
    displayOrder: course.displayOrder,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    modules: sanitizedModules,
    enrollment: userEnrollment,
    completedLessonIds: userProgress.filter((p) => p.isCompleted).map((p) => p.lessonId),
    certificate: userCertificate
  };
}

export async function enrollInCourse(
  courseId: string,
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    institutionType?: string;
    tenantId?: string;
    isPlatformAdmin?: boolean;
  }
) {
  const course = await db.trainingCourse.findUnique({ where: { id: courseId } });
  if (!course) throw AppError.notFound('Training course not found.');

  // Validate server-side access control
  validateCourseAccess(course, user);

  const existing = await db.trainingEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: user.id
      }
    }
  });

  if (existing) return existing;

  return db.trainingEnrollment.create({
    data: {
      courseId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      tenantId: user.tenantId || null,
      status: 'ENROLLED',
      progressPercent: 0
    }
  });
}

export async function completeTrainingLesson(
  courseId: string,
  lessonId: string,
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    institutionType?: string;
    institutionName?: string;
    tenantId?: string;
    isPlatformAdmin?: boolean;
  }
) {
  let enrollment = await db.trainingEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: user.id
      }
    }
  });

  if (!enrollment) {
    enrollment = await enrollInCourse(courseId, user);
  }

  // Record lesson progress
  await db.trainingProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId
      }
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      userId: user.id,
      isCompleted: true,
      completedAt: new Date()
    },
    update: {
      isCompleted: true,
      completedAt: new Date()
    }
  });

  // Calculate overall course progress
  const course = await db.trainingCourse.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            include: { quiz: true }
          }
        }
      }
    }
  });

  if (!course) throw AppError.notFound('Course not found.');

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessonsCount = allLessons.length;

  const completedRecords = await db.trainingProgress.findMany({
    where: { enrollmentId: enrollment.id, isCompleted: true }
  });

  const completedCount = completedRecords.length;
  const progressPercent = totalLessonsCount > 0
    ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
    : 100;

  const areAllLessonsCompleted = completedCount >= totalLessonsCount && totalLessonsCount > 0;

  // Check if all mandatory quizzes are passed
  const quizzesInCourse = allLessons.filter((l) => l.quiz).map((l) => l.quiz!);
  let areAllQuizzesPassed = true;
  let averageQuizScore = 100;

  if (quizzesInCourse.length > 0) {
    const quizIds = quizzesInCourse.map((q) => q.id);
    const passingAttempts = await db.trainingAttempt.findMany({
      where: {
        quizId: { in: quizIds },
        userId: user.id,
        passed: true
      }
    });

    const passedQuizIds = new Set(passingAttempts.map((a) => a.quizId));
    areAllQuizzesPassed = quizzesInCourse.every((q) => passedQuizIds.has(q.id));

    if (passingAttempts.length > 0) {
      averageQuizScore = Math.round(
        passingAttempts.reduce((sum, a) => sum + a.score, 0) / passingAttempts.length
      );
    }
  }

  const isEligibleForCompletion = areAllLessonsCompleted && areAllQuizzesPassed;

  const updatedEnrollment = await db.trainingEnrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercent,
      status: isEligibleForCompletion ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isEligibleForCompletion ? new Date() : null
    }
  });

  let certificate = null;
  if (isEligibleForCompletion && course.certificateEnabled) {
    certificate = await issueTrainingCertificate(course, user, averageQuizScore);
  }

  return {
    enrollment: updatedEnrollment,
    isCompleted: isEligibleForCompletion,
    allLessonsCompleted: areAllLessonsCompleted,
    allQuizzesPassed: areAllQuizzesPassed,
    certificate
  };
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string>,
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    institutionType?: string;
    institutionName?: string;
    tenantId?: string;
  }
) {
  const quiz = await db.trainingQuiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      lesson: {
        include: {
          module: {
            include: { course: true }
          }
        }
      }
    }
  });

  if (!quiz) throw AppError.notFound('Quiz not found.');

  const totalQuestions = quiz.questions.length;
  if (totalQuestions === 0) {
    throw AppError.badRequest('Quiz has no questions.');
  }

  // Server-side scoring against correct answers in DB
  let correctCount = 0;
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctOptionId) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= quiz.passingScore;

  const attempt = await db.trainingAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score,
      passed,
      answersJson: JSON.stringify(answers)
    }
  });

  let completionResult = null;
  if (passed) {
    const courseId = quiz.lesson.module.course.id;
    completionResult = await completeTrainingLesson(courseId, quiz.lessonId, user);
  }

  return {
    attemptId: attempt.id,
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount,
    totalQuestions,
    certificate: completionResult?.certificate || null
  };
}

export async function issueTrainingCertificate(
  course: any,
  user: { id: string; name: string; email: string; institutionName?: string },
  score: number = 100
) {
  const existing = await db.trainingCertificate.findFirst({
    where: { courseId: course.id, userId: user.id }
  });

  if (existing) return existing;

  const certNumber = await generateCertificateNumber();
  const issuedAt = new Date();
  const signatureHash = generateCertificateSignature(certNumber, user.id, course.id, issuedAt);
  const verificationUrl = `https://eduerp.us/verify/training/${certNumber}`;

  return db.trainingCertificate.create({
    data: {
      certificateNumber: certNumber,
      courseId: course.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      institutionName: user.institutionName || 'EduERP Certified Professional',
      score,
      status: 'ACTIVE',
      signatureHash,
      issuedAt,
      verificationUrl
    }
  });
}

export async function revokeTrainingCertificate(
  certificateNumber: string,
  reason: string,
  revokedBy: string
) {
  const cert = await db.trainingCertificate.findUnique({
    where: { certificateNumber }
  });

  if (!cert) throw AppError.notFound(`Certificate '${certificateNumber}' not found.`);

  return db.trainingCertificate.update({
    where: { certificateNumber },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy,
      revocationReason: reason
    }
  });
}

export async function verifyTrainingCertificate(certificateNumber: string) {
  const cert = await db.trainingCertificate.findUnique({
    where: { certificateNumber },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          audience: true,
          difficulty: true,
          durationMinutes: true
        }
      }
    }
  });

  if (!cert) {
    throw AppError.notFound(`Certificate '${certificateNumber}' is invalid or unverified.`);
  }

  const isRevoked = cert.status === 'REVOKED';

  // Privacy-safe public verification payload
  return {
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    courseId: cert.courseId,
    course: cert.course,
    userName: cert.userName,
    institutionName: cert.institutionName,
    courseTitle: cert.course.title,
    courseSlug: cert.course.slug,
    courseDescription: cert.course.description,
    audience: cert.course.audience,
    score: cert.score,
    issuedAt: cert.issuedAt,
    status: cert.status,
    isRevoked,
    revokedAt: cert.revokedAt,
    revocationReason: cert.revocationReason,
    verificationUrl: cert.verificationUrl,
    verificationStatement: isRevoked
      ? 'This certificate has been revoked by the issuer.'
      : 'Verified against the official EduERP training certificate registry.',
    isVerified: !isRevoked
  };
}
