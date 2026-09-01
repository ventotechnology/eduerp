-- CreateTable
CREATE TABLE "venomin_integration_outbox" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'COMMERCIAL',
    "sourceRecordType" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "sourceTenantId" TEXT,
    "payloadSafeJson" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venomin_integration_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venomin_integration_outbox_eventId_key" ON "venomin_integration_outbox"("eventId");

-- CreateIndex
CREATE INDEX "venomin_integration_outbox_status_nextAttemptAt_idx" ON "venomin_integration_outbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "venomin_integration_outbox_sourceRecordType_sourceRecordId_idx" ON "venomin_integration_outbox"("sourceRecordType", "sourceRecordId");

-- CreateIndex
CREATE INDEX "venomin_integration_outbox_occurredAt_idx" ON "venomin_integration_outbox"("occurredAt");
