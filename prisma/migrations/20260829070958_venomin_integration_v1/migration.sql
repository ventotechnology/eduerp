-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OfflinePaymentRecord" ALTER COLUMN "approvedBy" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "venomin_identity_links" (
    "id" TEXT NOT NULL,
    "walletmixCustomerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "institutionId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venomin_identity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venomin_provisioning_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "venominCustomerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "institutionId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "responsePayload" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venomin_provisioning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venomin_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseCode" INTEGER,
    "errorMessage" TEXT,
    "safeMessage" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venomin_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venomin_integration_logs" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorId" TEXT,
    "safeMessage" TEXT NOT NULL,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venomin_integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venomin_identity_links_walletmixCustomerId_key" ON "venomin_identity_links"("walletmixCustomerId");

-- CreateIndex
CREATE INDEX "venomin_identity_links_tenantId_idx" ON "venomin_identity_links"("tenantId");

-- CreateIndex
CREATE INDEX "venomin_identity_links_institutionId_idx" ON "venomin_identity_links"("institutionId");

-- CreateIndex
CREATE INDEX "venomin_identity_links_userId_idx" ON "venomin_identity_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "venomin_provisioning_requests_requestId_key" ON "venomin_provisioning_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "venomin_provisioning_requests_idempotencyKey_key" ON "venomin_provisioning_requests"("idempotencyKey");

-- CreateIndex
CREATE INDEX "venomin_provisioning_requests_venominCustomerId_idx" ON "venomin_provisioning_requests"("venominCustomerId");

-- CreateIndex
CREATE INDEX "venomin_provisioning_requests_tenantId_idx" ON "venomin_provisioning_requests"("tenantId");

-- CreateIndex
CREATE INDEX "venomin_provisioning_requests_institutionId_idx" ON "venomin_provisioning_requests"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "venomin_webhook_deliveries_eventId_key" ON "venomin_webhook_deliveries"("eventId");

-- CreateIndex
CREATE INDEX "venomin_webhook_deliveries_eventType_idx" ON "venomin_webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "venomin_webhook_deliveries_status_idx" ON "venomin_webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "venomin_integration_logs_operation_idx" ON "venomin_integration_logs"("operation");

-- CreateIndex
CREATE INDEX "venomin_integration_logs_status_idx" ON "venomin_integration_logs"("status");

-- AddForeignKey
ALTER TABLE "venomin_identity_links" ADD CONSTRAINT "venomin_identity_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venomin_identity_links" ADD CONSTRAINT "venomin_identity_links_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venomin_identity_links" ADD CONSTRAINT "venomin_identity_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
