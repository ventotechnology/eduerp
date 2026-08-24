-- AlterEnum
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'STANDARD';

-- DropIndex
DROP INDEX IF EXISTS "SubscriptionPlan_tier_key";

-- AlterTable
ALTER TABLE "PlanFeature" ADD COLUMN     "description" TEXT,
ADD COLUMN     "limitValue" INTEGER,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "annualDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "annualPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "apiAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "badge" TEXT,
ADD COLUMN     "buttonText" TEXT NOT NULL DEFAULT 'Choose Plan',
ADD COLUMN     "code" TEXT NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT',
ADD COLUMN     "customDomain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "includedEmails" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxTeachers" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "monthlyDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'starter',
ADD COLUMN     "trialDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tier" SET DEFAULT 'STARTER',
ALTER COLUMN "priceMonthlyBdt" SET DEFAULT 0,
ALTER COLUMN "priceMonthlyUsd" SET DEFAULT 0,
ALTER COLUMN "maxStudents" SET DEFAULT 500,
ALTER COLUMN "maxCampuses" SET DEFAULT 1,
ALTER COLUMN "maxStorageGb" SET DEFAULT 20,
ALTER COLUMN "includedSms" SET DEFAULT 1000;

UPDATE "SubscriptionPlan" SET "code" = "tier"::text, "slug" = lower("tier"::text);

-- CreateTable
CREATE TABLE "SignupApplication" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "institutionType" "InstitutionType" NOT NULL DEFAULT 'SCHOOL',
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "address" TEXT NOT NULL,
    "desiredSlug" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "checkoutToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "signupId" TEXT,
    "tenantId" TEXT,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "paymentId" TEXT,
    "trxId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT,
    "tenantId" TEXT,
    "planId" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "subTotal" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "transactionRef" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "paymentId" TEXT,
    "trxId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "providerResponseRef" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "minAmount" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxAmount" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformBillingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxName" TEXT NOT NULL DEFAULT 'VAT',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRegistrationReference" TEXT,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformBillingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDiscount" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableTier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupApplication_desiredSlug_key" ON "SignupApplication"("desiredSlug");

-- CreateIndex
CREATE UNIQUE INDEX "SignupApplication_checkoutToken_key" ON "SignupApplication"("checkoutToken");

-- CreateIndex
CREATE INDEX "SignupApplication_email_idx" ON "SignupApplication"("email");

-- CreateIndex
CREATE INDEX "SignupApplication_desiredSlug_idx" ON "SignupApplication"("desiredSlug");

-- CreateIndex
CREATE INDEX "SignupApplication_status_idx" ON "SignupApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionOrder_orderNumber_key" ON "SubscriptionOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionOrder_paymentId_key" ON "SubscriptionOrder"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionOrder_trxId_key" ON "SubscriptionOrder"("trxId");

-- CreateIndex
CREATE INDEX "SubscriptionOrder_orderNumber_idx" ON "SubscriptionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SubscriptionOrder_status_idx" ON "SubscriptionOrder"("status");

-- CreateIndex
CREATE INDEX "SubscriptionOrder_signupId_idx" ON "SubscriptionOrder"("signupId");

-- CreateIndex
CREATE INDEX "SubscriptionOrder_tenantId_idx" ON "SubscriptionOrder"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_invoiceNumber_key" ON "SubscriptionInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_tenantId_idx" ON "SubscriptionInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_invoiceNumber_idx" ON "SubscriptionInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_status_idx" ON "SubscriptionInvoice"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentTransaction_orderId_idx" ON "SubscriptionPaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentTransaction_paymentId_idx" ON "SubscriptionPaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentTransaction_trxId_idx" ON "SubscriptionPaymentTransaction"("trxId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentTransaction_status_idx" ON "SubscriptionPaymentTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_gateway_key" ON "PaymentGatewayConfig"("gateway");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_gateway_idx" ON "PaymentGatewayConfig"("gateway");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_isEnabled_idx" ON "PaymentGatewayConfig"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureKey_key" ON "PlanFeature"("planId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- AddForeignKey
ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "SignupApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionOrder" ADD CONSTRAINT "SubscriptionOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SubscriptionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPaymentTransaction" ADD CONSTRAINT "SubscriptionPaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SubscriptionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

