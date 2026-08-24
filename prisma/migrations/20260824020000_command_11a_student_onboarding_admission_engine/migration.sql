-- CreateTable AdmissionSetting
CREATE TABLE IF NOT EXISTS "AdmissionSetting" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "isOnlineAdmissionOpen" BOOLEAN NOT NULL DEFAULT true,
    "applicationStartDate" TIMESTAMP(3),
    "applicationEndDate" TIMESTAMP(3),
    "academicYearId" TEXT,
    "applicationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "admissionFeeDefault" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTestRequired" BOOLEAN NOT NULL DEFAULT false,
    "isInterviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "autoMeritCalculation" BOOLEAN NOT NULL DEFAULT true,
    "testWeight" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "previousResultWeight" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "interviewWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "maxCapacityPerClass" INTEGER NOT NULL DEFAULT 40,
    "allowPortalUserCreation" BOOLEAN NOT NULL DEFAULT true,
    "instructionsText" TEXT,
    "requiredDocumentsJson" TEXT,
    "applicationNumberPrefix" TEXT NOT NULL DEFAULT 'APP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionSetting_pkey" PRIMARY KEY ("id")
);

-- AlterTable AdmissionApplication
ALTER TABLE "AdmissionApplication" 
    ADD COLUMN IF NOT EXISTS "middleName" TEXT,
    ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "nationality" TEXT NOT NULL DEFAULT 'Bangladeshi',
    ADD COLUMN IF NOT EXISTS "nidBirthCertNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "shiftId" TEXT,
    ADD COLUMN IF NOT EXISTS "sectionId" TEXT,
    ADD COLUMN IF NOT EXISTS "academicGroupId" TEXT,
    ADD COLUMN IF NOT EXISTS "subjectCombinationId" TEXT,
    ADD COLUMN IF NOT EXISTS "technologyTradeId" TEXT,
    ADD COLUMN IF NOT EXISTS "batchId" TEXT,
    ADD COLUMN IF NOT EXISTS "hifzProgram" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
    ADD COLUMN IF NOT EXISTS "fatherPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "fatherProfession" TEXT,
    ADD COLUMN IF NOT EXISTS "motherName" TEXT,
    ADD COLUMN IF NOT EXISTS "motherPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "motherProfession" TEXT,
    ADD COLUMN IF NOT EXISTS "previousClass" TEXT,
    ADD COLUMN IF NOT EXISTS "documentsJson" TEXT,
    ADD COLUMN IF NOT EXISTS "applicationFeeAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "admissionFeeStatus" TEXT NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS "admissionFeeAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "waiverPercentage" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "interviewScore" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "interviewNotes" TEXT,
    ADD COLUMN IF NOT EXISTS "interviewDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "admittedStudentId" TEXT;

-- AlterTable Enrollment
ALTER TABLE "Enrollment"
    ADD COLUMN IF NOT EXISTS "campusId" TEXT,
    ADD COLUMN IF NOT EXISTS "shiftId" TEXT,
    ADD COLUMN IF NOT EXISTS "batchId" TEXT,
    ADD COLUMN IF NOT EXISTS "hifzEnrolled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "hifzProgram" TEXT,
    ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AdmissionSetting_institutionId_key" ON "AdmissionSetting"("institutionId");
CREATE INDEX IF NOT EXISTS "AdmissionSetting_institutionId_idx" ON "AdmissionSetting"("institutionId");
CREATE INDEX IF NOT EXISTS "Enrollment_campusId_idx" ON "Enrollment"("campusId");
CREATE INDEX IF NOT EXISTS "Enrollment_classId_idx" ON "Enrollment"("classId");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionSetting_institutionId_fkey') THEN
        ALTER TABLE "AdmissionSetting" ADD CONSTRAINT "AdmissionSetting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionSetting_academicYearId_fkey') THEN
        ALTER TABLE "AdmissionSetting" ADD CONSTRAINT "AdmissionSetting_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_shiftId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_sectionId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_academicGroupId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_academicGroupId_fkey" FOREIGN KEY ("academicGroupId") REFERENCES "AcademicGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_subjectCombinationId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_subjectCombinationId_fkey" FOREIGN KEY ("subjectCombinationId") REFERENCES "SubjectCombinationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_technologyTradeId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_technologyTradeId_fkey" FOREIGN KEY ("technologyTradeId") REFERENCES "TechnologyTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdmissionApplication_batchId_fkey') THEN
        ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_campusId_fkey') THEN
        ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_shiftId_fkey') THEN
        ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_batchId_fkey') THEN
        ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
