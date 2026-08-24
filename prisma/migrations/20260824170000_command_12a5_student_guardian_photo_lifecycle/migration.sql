-- AlterTable Guardian
ALTER TABLE "Guardian" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "Guardian" ADD COLUMN IF NOT EXISTS "fatherPhotoUrl" TEXT;
ALTER TABLE "Guardian" ADD COLUMN IF NOT EXISTS "motherPhotoUrl" TEXT;
ALTER TABLE "Guardian" ADD COLUMN IF NOT EXISTS "guardianPhotoUrl" TEXT;

-- AlterTable AdmissionSetting
ALTER TABLE "AdmissionSetting" ADD COLUMN IF NOT EXISTS "requireStudentPhotoOnAdmission" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdmissionSetting" ADD COLUMN IF NOT EXISTS "requireStudentPhotoOnEnrollment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdmissionSetting" ADD COLUMN IF NOT EXISTS "requireStudentPhotoOnIdCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdmissionSetting" ADD COLUMN IF NOT EXISTS "maxUploadSizeMb" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "AdmissionSetting" ADD COLUMN IF NOT EXISTS "allowCameraCapture" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable MediaAsset
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "category" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedByUserId" TEXT,
    "source" TEXT DEFAULT 'DIRECT_UPLOAD',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_entityType_entityId_idx" ON "MediaAsset"("tenantId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "MediaAsset_objectKey_idx" ON "MediaAsset"("objectKey");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MediaAsset_tenantId_fkey'
    ) THEN
        ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
