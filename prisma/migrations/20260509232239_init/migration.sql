-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "beds" INTEGER NOT NULL,
    "baths" DOUBLE PRECISION NOT NULL,
    "sqft" INTEGER,
    "lotSqft" INTEGER,
    "yearBuilt" INTEGER,
    "homeType" TEXT,
    "soldPrice" INTEGER NOT NULL,
    "soldDate" TIMESTAMP(3),
    "isSold" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "qualityScore" INTEGER NOT NULL DEFAULT 50,
    "lastShownAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sourceUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalRounds" INTEGER NOT NULL DEFAULT 10,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalScore" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "guess" INTEGER,
    "score" INTEGER,
    "guessedAt" TIMESTAMP(3),

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "marketsRequested" INTEGER NOT NULL DEFAULT 0,
    "listingsFound" INTEGER NOT NULL DEFAULT 0,
    "listingsIngested" INTEGER NOT NULL DEFAULT 0,
    "listingsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_externalId_key" ON "Listing"("externalId");

-- CreateIndex
CREATE INDEX "Listing_isActive_qualityScore_idx" ON "Listing"("isActive", "qualityScore");

-- CreateIndex
CREATE INDEX "Listing_state_city_idx" ON "Listing"("state", "city");

-- CreateIndex
CREATE INDEX "Listing_soldPrice_idx" ON "Listing"("soldPrice");

-- CreateIndex
CREATE INDEX "Photo_listingId_ordering_idx" ON "Photo"("listingId", "ordering");

-- CreateIndex
CREATE INDEX "Game_sessionId_idx" ON "Game"("sessionId");

-- CreateIndex
CREATE INDEX "Round_gameId_roundNumber_idx" ON "Round"("gameId", "roundNumber");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
