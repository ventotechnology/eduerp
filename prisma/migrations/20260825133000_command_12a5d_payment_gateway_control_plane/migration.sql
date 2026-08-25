-- Command 12A.5D: Payment Gateway Control Plane, Live/Sandbox Credential Management & Health Tracking

-- 1. Update PaymentGatewayConfig
ALTER TABLE "PaymentGatewayConfig" DROP CONSTRAINT IF EXISTS "PaymentGatewayConfig_gateway_key";
DROP INDEX IF EXISTS "PaymentGatewayConfig_gateway_key";

ALTER TABLE "PaymentGatewayConfig"
  ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "merchantName" TEXT,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS "fixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "percentageFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "feeTreatment" TEXT NOT NULL DEFAULT 'MERCHANT_ABSORBS',
  ADD COLUMN IF NOT EXISTS "checkoutEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "refundEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "partialRefundEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recurringEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "callbackUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "encryptedCredentials" TEXT,
  ADD COLUMN IF NOT EXISTS "configMetadata" JSONB,
  ADD COLUMN IF NOT EXISTS "healthStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  ADD COLUMN IF NOT EXISTS "lastHealthCheckAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastHealthCheckLatency" INTEGER,
  ADD COLUMN IF NOT EXISTS "lastHealthCheckError" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSuccessfulTransactionAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "allowTenantOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sharedGatewayAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiredPlanTier" TEXT,
  ADD COLUMN IF NOT EXISTS "bankName" TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "bankBranch" TEXT,
  ADD COLUMN IF NOT EXISTS "bankRouting" TEXT,
  ADD COLUMN IF NOT EXISTS "bankSwift" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- Foreign key for PaymentGatewayConfig tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentGatewayConfig_tenantId_fkey'
  ) THEN
    ALTER TABLE "PaymentGatewayConfig"
      ADD CONSTRAINT "PaymentGatewayConfig_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentGatewayConfig_scope_gateway_tenantId_key" ON "PaymentGatewayConfig"("scope", "gateway", "tenantId");
CREATE INDEX IF NOT EXISTS "PaymentGatewayConfig_scope_idx" ON "PaymentGatewayConfig"("scope");
CREATE INDEX IF NOT EXISTS "PaymentGatewayConfig_tenantId_idx" ON "PaymentGatewayConfig"("tenantId");

-- 2. Create PaymentHealthCheckLog
CREATE TABLE IF NOT EXISTS "PaymentHealthCheckLog" (
  "id" TEXT NOT NULL,
  "gatewayId" TEXT,
  "gateway" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
  "tenantId" TEXT,
  "environment" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "checkedBy" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentHealthCheckLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentHealthCheckLog_gatewayId_fkey'
  ) THEN
    ALTER TABLE "PaymentHealthCheckLog"
      ADD CONSTRAINT "PaymentHealthCheckLog_gatewayId_fkey"
      FOREIGN KEY ("gatewayId") REFERENCES "PaymentGatewayConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PaymentHealthCheckLog_gatewayId_idx" ON "PaymentHealthCheckLog"("gatewayId");
CREATE INDEX IF NOT EXISTS "PaymentHealthCheckLog_gateway_idx" ON "PaymentHealthCheckLog"("gateway");
CREATE INDEX IF NOT EXISTS "PaymentHealthCheckLog_scope_idx" ON "PaymentHealthCheckLog"("scope");
CREATE INDEX IF NOT EXISTS "PaymentHealthCheckLog_tenantId_idx" ON "PaymentHealthCheckLog"("tenantId");
CREATE INDEX IF NOT EXISTS "PaymentHealthCheckLog_checkedAt_idx" ON "PaymentHealthCheckLog"("checkedAt");

-- 3. Update OfflinePaymentRecord
ALTER TABLE "OfflinePaymentRecord"
  ADD COLUMN IF NOT EXISTS "invoiceId" TEXT,
  ADD COLUMN IF NOT EXISTS "orderId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS "submittedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "OfflinePaymentRecord_invoiceId_idx" ON "OfflinePaymentRecord"("invoiceId");
CREATE INDEX IF NOT EXISTS "OfflinePaymentRecord_orderId_idx" ON "OfflinePaymentRecord"("orderId");
CREATE INDEX IF NOT EXISTS "OfflinePaymentRecord_status_idx" ON "OfflinePaymentRecord"("status");
