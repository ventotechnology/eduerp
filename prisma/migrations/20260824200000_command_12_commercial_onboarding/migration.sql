-- CreateEnum
CREATE TYPE "TenantProvisioningStatus" AS ENUM (
  'DRAFT',
  'SIGNUP_STARTED',
  'EMAIL_VERIFICATION_PENDING',
  'PROFILE_PENDING',
  'PLAN_SELECTED',
  'PAYMENT_PENDING',
  'PAYMENT_VERIFICATION',
  'PROVISIONING',
  'ACTIVE_TRIAL',
  'ACTIVE_PAID',
  'PAST_DUE',
  'GRACE_PERIOD',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
  'PROVISIONING_FAILED',
  'ARCHIVED'
);

-- AlterTable Tenant
ALTER TABLE "Tenant" ADD COLUMN "status" "TenantProvisioningStatus" NOT NULL DEFAULT 'ACTIVE_PAID';
ALTER TABLE "Tenant" ADD COLUMN "isTestTenant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tenant" ADD COLUMN "provisioningKey" TEXT;

-- AlterTable TenantDomain
ALTER TABLE "TenantDomain" ADD COLUMN "verificationToken" TEXT;
ALTER TABLE "TenantDomain" ADD COLUMN "sslStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "TenantDomain" ADD COLUMN "redirectToPrimary" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- CreateTable TenantOnboardingProgress
CREATE TABLE "TenantOnboardingProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable TenantFeatureOverride
CREATE TABLE "TenantFeatureOverride" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable OfflinePaymentRecord
CREATE TABLE "OfflinePaymentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "referenceNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofDocumentUrl" TEXT,
    "notes" TEXT,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflinePaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_provisioningKey_key" ON "Tenant"("provisioningKey");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboardingProgress_tenantId_key" ON "TenantOnboardingProgress"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboardingProgress_tenantId_idx" ON "TenantOnboardingProgress"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboardingProgress_isCompleted_idx" ON "TenantOnboardingProgress"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeatureOverride_tenantId_featureKey_key" ON "TenantFeatureOverride"("tenantId", "featureKey");

-- CreateIndex
CREATE INDEX "TenantFeatureOverride_tenantId_idx" ON "TenantFeatureOverride"("tenantId");

-- CreateIndex
CREATE INDEX "OfflinePaymentRecord_tenantId_idx" ON "OfflinePaymentRecord"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantOnboardingProgress" ADD CONSTRAINT "TenantOnboardingProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFeatureOverride" ADD CONSTRAINT "TenantFeatureOverride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePaymentRecord" ADD CONSTRAINT "OfflinePaymentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
