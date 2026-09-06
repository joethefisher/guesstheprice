-- CreateTable
CREATE TABLE "NotifyWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'daily-locked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotifyWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotifyWaitlist_email_key" ON "NotifyWaitlist"("email");

-- CreateIndex
CREATE INDEX "NotifyWaitlist_createdAt_idx" ON "NotifyWaitlist"("createdAt");
