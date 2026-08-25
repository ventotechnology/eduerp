-- Migration: 20260825140000_command_12a5e_payment_lifecycle_reconciliation

-- 1. Add checkoutSessionId to SubscriptionOrder
ALTER TABLE "SubscriptionOrder" ADD COLUMN IF NOT EXISTS "checkoutSessionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionOrder_checkoutSessionId_key" ON "SubscriptionOrder"("checkoutSessionId");
CREATE INDEX IF NOT EXISTS "SubscriptionOrder_checkoutSessionId_idx" ON "SubscriptionOrder"("checkoutSessionId");

-- 2. Add attemptNumber and failureCode to SubscriptionPaymentTransaction
ALTER TABLE "SubscriptionPaymentTransaction" ADD COLUMN IF NOT EXISTS "attemptNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SubscriptionPaymentTransaction" ADD COLUMN IF NOT EXISTS "failureCode" TEXT;

-- 3. Create PaymentReconciliationRecord Table
CREATE TABLE IF NOT EXISTS "PaymentReconciliationRecord" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PLATFORM',
    "tenantId" TEXT,
    "gateway" TEXT NOT NULL,
    "batchReference" TEXT,
    "transactionRef" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "providerAmount" DOUBLE PRECISION,
    "localAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'MATCHED',
    "reconciliationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settlementDate" TIMESTAMP(3),
    "settlementRef" TEXT,
    "settlementStatus" TEXT NOT NULL DEFAULT 'SETTLED',
    "notes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReconciliationRecord_pkey" PRIMARY KEY ("id")
);

-- 4. Create Indexes for PaymentReconciliationRecord
CREATE INDEX IF NOT EXISTS "PaymentReconciliationRecord_scope_idx" ON "PaymentReconciliationRecord"("scope");
CREATE INDEX IF NOT EXISTS "PaymentReconciliationRecord_gateway_idx" ON "PaymentReconciliationRecord"("gateway");
CREATE INDEX IF NOT EXISTS "PaymentReconciliationRecord_status_idx" ON "PaymentReconciliationRecord"("status");
CREATE INDEX IF NOT EXISTS "PaymentReconciliationRecord_transactionRef_idx" ON "PaymentReconciliationRecord"("transactionRef");
CREATE INDEX IF NOT EXISTS "PaymentReconciliationRecord_tenantId_idx" ON "PaymentReconciliationRecord"("tenantId");

-- 5. Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReconciliationRecord_tenantId_fkey'
    ) THEN
        ALTER TABLE "PaymentReconciliationRecord" 
        ADD CONSTRAINT "PaymentReconciliationRecord_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
