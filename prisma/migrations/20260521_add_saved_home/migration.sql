-- CreateTable
CREATE TABLE "SavedHome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "guess" INTEGER,
    "actualPrice" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "tier" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedHome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedHome_userId_listingId_key" ON "SavedHome"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SavedHome_userId_savedAt_idx" ON "SavedHome"("userId", "savedAt");

-- AddForeignKey
ALTER TABLE "SavedHome" ADD CONSTRAINT "SavedHome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedHome" ADD CONSTRAINT "SavedHome_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
