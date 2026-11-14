-- Add unsubscribe token to NotifyWaitlist (backfill existing rows, then
-- enforce NOT NULL + UNIQUE). gen_random_uuid() is available via pgcrypto,
-- enabled by default on Supabase.
ALTER TABLE "NotifyWaitlist" ADD COLUMN "unsubToken" TEXT;
UPDATE "NotifyWaitlist" SET "unsubToken" = gen_random_uuid()::text WHERE "unsubToken" IS NULL;
ALTER TABLE "NotifyWaitlist" ALTER COLUMN "unsubToken" SET NOT NULL;
CREATE UNIQUE INDEX "NotifyWaitlist_unsubToken_key" ON "NotifyWaitlist"("unsubToken");

-- Delivery ledger for daily-notification idempotency.
CREATE TABLE "NotifyDelivery" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dailyNumber" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotifyDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotifyDelivery_email_dailyNumber_key" ON "NotifyDelivery"("email", "dailyNumber");
CREATE INDEX "NotifyDelivery_dailyNumber_idx" ON "NotifyDelivery"("dailyNumber");
