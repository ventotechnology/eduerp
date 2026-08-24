-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "currentPeriodEnd" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "code" DROP DEFAULT,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "slug" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlatformContactSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Vento Technology',
    "productName" TEXT NOT NULL DEFAULT 'EduERP',
    "address" TEXT NOT NULL DEFAULT 'House 2/B, Road 8, Nikunja-2, Khilkhet',
    "city" TEXT NOT NULL DEFAULT 'Dhaka',
    "postalCode" TEXT NOT NULL DEFAULT '1229',
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "generalEmail" TEXT NOT NULL DEFAULT 'teamhimu@gmail.com',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@eduerp.us',
    "salesEmail" TEXT NOT NULL DEFAULT 'sales@eduerp.us',
    "billingEmail" TEXT NOT NULL DEFAULT 'billing@eduerp.us',
    "privacyEmail" TEXT NOT NULL DEFAULT 'privacy@eduerp.us',
    "phone" TEXT NOT NULL DEFAULT '+8801335556688',
    "whatsapp" TEXT NOT NULL DEFAULT '+8801335556688',
    "businessHours" TEXT NOT NULL DEFAULT 'Sunday - Thursday, 9:00 AM - 6:00 PM BST',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "websiteUrl" TEXT NOT NULL DEFAULT 'https://eduerp.us',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformContactSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquirySequence" (
    "id" TEXT NOT NULL DEFAULT 'inquiry_seq',
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquirySequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "inquiryNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "institutionType" "InstitutionType" NOT NULL DEFAULT 'SCHOOL',
    "district" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "studentCount" INTEGER,
    "campusCount" INTEGER,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "preferredContact" TEXT NOT NULL DEFAULT 'EMAIL',
    "preferredDemoDate" TIMESTAMP(3),
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToUserId" TEXT,
    "assignedToName" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "relatedModule" TEXT,
    "institutionTypes" TEXT NOT NULL DEFAULT '["ALL"]',
    "applicableRoles" TEXT NOT NULL DEFAULT '["ALL"]',
    "language" TEXT NOT NULL DEFAULT 'en',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "authorName" TEXT NOT NULL DEFAULT 'EduERP Product Team',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "videoUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "relatedModule" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseNote" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "newFeatures" TEXT,
    "improvements" TEXT,
    "bugFixes" TEXT,
    "knownIssues" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "institutionType" "InstitutionType",
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "language" TEXT NOT NULL DEFAULT 'en',
    "thumbnailUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lessonType" TEXT NOT NULL DEFAULT 'ARTICLE',
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 10,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingQuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "explanation" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answersJson" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "institutionName" TEXT,
    "score" DOUBLE PRECISION,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationUrl" TEXT NOT NULL,

    CONSTRAINT "TrainingCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSequence" (
    "id" TEXT NOT NULL DEFAULT 'ticket_seq',
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "defaultPriority" TEXT NOT NULL DEFAULT 'NORMAL',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSlaPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "firstResponseTargetMinutes" INTEGER NOT NULL,
    "resolutionTargetMinutes" INTEGER NOT NULL,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSlaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "institutionId" TEXT,
    "creatorUserId" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "creatorEmail" TEXT NOT NULL,
    "creatorRole" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "relatedModule" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "businessImpact" TEXT,
    "affectedUrl" TEXT,
    "preferredContact" TEXT NOT NULL DEFAULT 'IN_APP',
    "assignedTeamId" TEXT,
    "assignedAgentId" TEXT,
    "assignedAgentName" TEXT,
    "assignedAgentEmail" TEXT,
    "firstResponseAt" TIMESTAMP(3),
    "firstResponseDueAt" TIMESTAMP(3),
    "firstResponseBreached" BOOLEAN NOT NULL DEFAULT false,
    "resolutionDueAt" TIMESTAMP(3),
    "resolutionBreached" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "escalationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC_REPLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportStatusHistory" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCsat" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCsat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactInquiry_inquiryNumber_key" ON "ContactInquiry"("inquiryNumber");

-- CreateIndex
CREATE INDEX "ContactInquiry_inquiryNumber_idx" ON "ContactInquiry"("inquiryNumber");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_email_idx" ON "ContactInquiry"("email");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_slug_key" ON "KnowledgeCategory"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeCategory_slug_idx" ON "KnowledgeCategory"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeCategory_displayOrder_idx" ON "KnowledgeCategory"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_slug_idx" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_categoryId_idx" ON "KnowledgeArticle"("categoryId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_relatedModule_idx" ON "KnowledgeArticle"("relatedModule");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_visibility_idx" ON "KnowledgeArticle"("visibility");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_isPublished_idx" ON "KnowledgeArticle"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_slug_key" ON "FaqCategory"("slug");

-- CreateIndex
CREATE INDEX "FaqCategory_slug_idx" ON "FaqCategory"("slug");

-- CreateIndex
CREATE INDEX "FaqItem_categoryId_idx" ON "FaqItem"("categoryId");

-- CreateIndex
CREATE INDEX "FaqItem_relatedModule_idx" ON "FaqItem"("relatedModule");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseNote_version_key" ON "ReleaseNote"("version");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseNote_slug_key" ON "ReleaseNote"("slug");

-- CreateIndex
CREATE INDEX "ReleaseNote_version_idx" ON "ReleaseNote"("version");

-- CreateIndex
CREATE INDEX "ReleaseNote_slug_idx" ON "ReleaseNote"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourse_slug_key" ON "TrainingCourse"("slug");

-- CreateIndex
CREATE INDEX "TrainingCourse_slug_idx" ON "TrainingCourse"("slug");

-- CreateIndex
CREATE INDEX "TrainingCourse_targetRole_idx" ON "TrainingCourse"("targetRole");

-- CreateIndex
CREATE INDEX "TrainingModule_courseId_idx" ON "TrainingModule"("courseId");

-- CreateIndex
CREATE INDEX "TrainingModule_displayOrder_idx" ON "TrainingModule"("displayOrder");

-- CreateIndex
CREATE INDEX "TrainingLesson_moduleId_idx" ON "TrainingLesson"("moduleId");

-- CreateIndex
CREATE INDEX "TrainingLesson_displayOrder_idx" ON "TrainingLesson"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingQuiz_lessonId_key" ON "TrainingQuiz"("lessonId");

-- CreateIndex
CREATE INDEX "TrainingQuizQuestion_quizId_idx" ON "TrainingQuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_userId_idx" ON "TrainingEnrollment"("userId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_tenantId_idx" ON "TrainingEnrollment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_courseId_userId_key" ON "TrainingEnrollment"("courseId", "userId");

-- CreateIndex
CREATE INDEX "TrainingProgress_userId_idx" ON "TrainingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgress_enrollmentId_lessonId_key" ON "TrainingProgress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "TrainingAttempt_quizId_idx" ON "TrainingAttempt"("quizId");

-- CreateIndex
CREATE INDEX "TrainingAttempt_userId_idx" ON "TrainingAttempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_certificateNumber_key" ON "TrainingCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "TrainingCertificate_certificateNumber_idx" ON "TrainingCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "TrainingCertificate_userId_idx" ON "TrainingCertificate"("userId");

-- CreateIndex
CREATE INDEX "TrainingCertificate_courseId_idx" ON "TrainingCertificate"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportCategory_code_key" ON "SupportCategory"("code");

-- CreateIndex
CREATE INDEX "SupportCategory_code_idx" ON "SupportCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTeam_code_key" ON "SupportTeam"("code");

-- CreateIndex
CREATE INDEX "SupportTeam_code_idx" ON "SupportTeam"("code");

-- CreateIndex
CREATE INDEX "SupportTeamMember_userId_idx" ON "SupportTeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTeamMember_teamId_userId_key" ON "SupportTeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportSlaPolicy_priority_key" ON "SupportSlaPolicy"("priority");

-- CreateIndex
CREATE INDEX "SupportSlaPolicy_priority_idx" ON "SupportSlaPolicy"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketNumber_idx" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");

-- CreateIndex
CREATE INDEX "SupportTicket_creatorUserId_idx" ON "SupportTicket"("creatorUserId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedAgentId_idx" ON "SupportTicket"("assignedAgentId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedTeamId_idx" ON "SupportTicket"("assignedTeamId");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_visibility_idx" ON "SupportTicketMessage"("visibility");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_createdAt_idx" ON "SupportTicketMessage"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicketAttachment_ticketId_idx" ON "SupportTicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketAttachment_messageId_idx" ON "SupportTicketAttachment"("messageId");

-- CreateIndex
CREATE INDEX "SupportStatusHistory_ticketId_idx" ON "SupportStatusHistory"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportCsat_ticketId_key" ON "SupportCsat"("ticketId");

-- CreateIndex
CREATE INDEX "SupportCsat_rating_idx" ON "SupportCsat"("rating");

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLesson" ADD CONSTRAINT "TrainingLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuiz" ADD CONSTRAINT "TrainingQuiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TrainingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingQuizQuestion" ADD CONSTRAINT "TrainingQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TrainingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttempt" ADD CONSTRAINT "TrainingAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TrainingQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTeamMember" ADD CONSTRAINT "SupportTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketAttachment" ADD CONSTRAINT "SupportTicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketAttachment" ADD CONSTRAINT "SupportTicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SupportTicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportStatusHistory" ADD CONSTRAINT "SupportStatusHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCsat" ADD CONSTRAINT "SupportCsat_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
