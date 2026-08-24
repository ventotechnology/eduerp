-- DropIndex
DROP INDEX "SupportSlaPolicy_priority_key";

-- AlterTable
ALTER TABLE "PlatformContactSettings" ALTER COLUMN "supportEmail" SET DEFAULT 'teamhimu@gmail.com',
ALTER COLUMN "salesEmail" SET DEFAULT 'teamhimu@gmail.com',
ALTER COLUMN "billingEmail" SET DEFAULT 'teamhimu@gmail.com',
ALTER COLUMN "privacyEmail" SET DEFAULT 'teamhimu@gmail.com';

-- AlterTable
ALTER TABLE "SupportSlaPolicy" ADD COLUMN     "categoryCode" TEXT,
ADD COLUMN     "displayPrecedence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "institutionType" TEXT,
ADD COLUMN     "planTier" TEXT;

-- AlterTable
ALTER TABLE "TrainingCertificate" ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedBy" TEXT,
ADD COLUMN     "signatureHash" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "TrainingCertificateSequence" (
    "id" TEXT NOT NULL DEFAULT 'cert_seq',
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCertificateSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportBusinessHours" (
    "id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "dayOfWeek" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportBusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isWorkingOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportEscalationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" TEXT,
    "status" TEXT,
    "unassignedMinutes" INTEGER,
    "firstResponseRemainingMinutes" INTEGER,
    "resolutionRemainingMinutes" INTEGER,
    "reopenCountThreshold" INTEGER,
    "categoryCode" TEXT,
    "subscriptionPlan" TEXT,
    "actionType" TEXT NOT NULL,
    "targetPriority" TEXT,
    "targetTeamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportEscalationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportBusinessHours_timezone_dayOfWeek_key" ON "SupportBusinessHours"("timezone", "dayOfWeek");

-- CreateIndex
CREATE INDEX "SupportHoliday_date_idx" ON "SupportHoliday"("date");

-- CreateIndex
CREATE INDEX "SupportEscalationRule_isActive_idx" ON "SupportEscalationRule"("isActive");

-- CreateIndex
CREATE INDEX "SupportSlaPolicy_planTier_idx" ON "SupportSlaPolicy"("planTier");

-- CreateIndex
CREATE INDEX "SupportSlaPolicy_categoryCode_idx" ON "SupportSlaPolicy"("categoryCode");

-- CreateIndex
CREATE INDEX "SupportSlaPolicy_institutionType_idx" ON "SupportSlaPolicy"("institutionType");

-- CreateIndex
CREATE INDEX "TrainingCertificate_status_idx" ON "TrainingCertificate"("status");
