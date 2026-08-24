import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';

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

export async function getTrainingCourseBySlug(slug: string, userId?: string) {
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

  return {
    ...course,
    enrollment: userEnrollment,
    completedLessonIds: userProgress.filter((p) => p.isCompleted).map((p) => p.lessonId),
    certificate: userCertificate
  };
}

export async function enrollInCourse(courseId: string, user: {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
}) {
  const course = await db.trainingCourse.findUnique({ where: { id: courseId } });
  if (!course) throw AppError.notFound('Training course not found.');

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
    institutionName?: string;
    tenantId?: string;
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
        include: { lessons: true }
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

  const isFullyCompleted = completedCount >= totalLessonsCount && totalLessonsCount > 0;

  const updatedEnrollment = await db.trainingEnrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercent,
      status: isFullyCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isFullyCompleted ? new Date() : null
    }
  });

  let certificate = null;
  if (isFullyCompleted && course.certificateEnabled) {
    certificate = await issueTrainingCertificate(course, user, 100);
  }

  return {
    enrollment: updatedEnrollment,
    isCompleted: isFullyCompleted,
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
    institutionName?: string;
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

  if (passed) {
    const courseId = quiz.lesson.module.course.id;
    await completeTrainingLesson(courseId, quiz.lessonId, user);
  }

  return {
    attemptId: attempt.id,
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount,
    totalQuestions
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

  const certNumber = `CERT-TRN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
      issuedAt: new Date(),
      verificationUrl
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
          audience: true
        }
      }
    }
  });

  if (!cert) {
    throw AppError.notFound(`Certificate '${certificateNumber}' is invalid or has expired.`);
  }

  return cert;
}
