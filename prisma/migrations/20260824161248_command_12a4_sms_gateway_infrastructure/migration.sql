-- CreateTable
CREATE TABLE "SmsProvider" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'HTTP_API',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "baseUrl" TEXT,
    "senderId" TEXT,
    "encryptedCredentials" TEXT NOT NULL,
    "encryptionVersion" TEXT NOT NULL DEFAULT 'v1',
    "supportsUnicode" BOOLEAN NOT NULL DEFAULT true,
    "supportsBulk" BOOLEAN NOT NULL DEFAULT true,
    "supportsBalanceCheck" BOOLEAN NOT NULL DEFAULT false,
    "supportsDlr" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSmsConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceMode" TEXT NOT NULL DEFAULT 'PLATFORM_SHARED',
    "activeProviderId" TEXT,
    "allowFallback" BOOLEAN NOT NULL DEFAULT false,
    "bonusSmsCredits" INTEGER NOT NULL DEFAULT 0,
    "purchasedSmsCredits" INTEGER NOT NULL DEFAULT 0,
    "customSenderId" TEXT,
    "isApprovedForPlatformSms" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSmsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsAddonPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "messageQuantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "validityDays" INTEGER NOT NULL DEFAULT 365,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsAddonPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsBroadcast" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerId" TEXT,
    "providerScope" TEXT NOT NULL DEFAULT 'PLATFORM',
    "providerName" TEXT,
    "audienceType" TEXT NOT NULL,
    "audienceFilter" TEXT,
    "message" TEXT NOT NULL,
    "isUnicode" BOOLEAN NOT NULL DEFAULT false,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "validRecipientCount" INTEGER NOT NULL DEFAULT 0,
    "segmentCount" INTEGER NOT NULL DEFAULT 1,
    "totalSegments" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "requestedByRole" TEXT,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsDelivery" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "recipientType" TEXT,
    "recipientReferenceId" TEXT,
    "recipientName" TEXT,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "segments" INTEGER NOT NULL DEFAULT 1,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsUsageLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "broadcastId" TEXT,
    "quantity" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'INCLUDED_QUOTA',
    "providerId" TEXT,
    "billingPeriod" TEXT,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsUsageLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsProvider_scope_status_idx" ON "SmsProvider"("scope", "status");

-- CreateIndex
CREATE INDEX "SmsProvider_tenantId_idx" ON "SmsProvider"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSmsConfig_tenantId_key" ON "TenantSmsConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSmsConfig_tenantId_idx" ON "TenantSmsConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsAddonPackage_slug_key" ON "SmsAddonPackage"("slug");

-- CreateIndex
CREATE INDEX "SmsAddonPackage_isActive_displayOrder_idx" ON "SmsAddonPackage"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "SmsBroadcast_tenantId_createdAt_idx" ON "SmsBroadcast"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsBroadcast_status_idx" ON "SmsBroadcast"("status");

-- CreateIndex
CREATE INDEX "SmsDelivery_broadcastId_status_idx" ON "SmsDelivery"("broadcastId", "status");

-- CreateIndex
CREATE INDEX "SmsDelivery_phone_idx" ON "SmsDelivery"("phone");

-- CreateIndex
CREATE INDEX "SmsUsageLedger_tenantId_createdAt_idx" ON "SmsUsageLedger"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsUsageLedger_billingPeriod_idx" ON "SmsUsageLedger"("billingPeriod");

-- AddForeignKey
ALTER TABLE "SmsProvider" ADD CONSTRAINT "SmsProvider_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSmsConfig" ADD CONSTRAINT "TenantSmsConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSmsConfig" ADD CONSTRAINT "TenantSmsConfig_activeProviderId_fkey" FOREIGN KEY ("activeProviderId") REFERENCES "SmsProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsBroadcast" ADD CONSTRAINT "SmsBroadcast_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsBroadcast" ADD CONSTRAINT "SmsBroadcast_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "SmsProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsDelivery" ADD CONSTRAINT "SmsDelivery_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "SmsBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsUsageLedger" ADD CONSTRAINT "SmsUsageLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsUsageLedger" ADD CONSTRAINT "SmsUsageLedger_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "SmsBroadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;
