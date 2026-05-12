-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gameType" TEXT NOT NULL DEFAULT 'freeplay',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "totalRounds" SET DEFAULT 5;

-- CreateIndex
CREATE INDEX "Game_userId_completedAt_idx" ON "Game"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "Game_totalScore_idx" ON "Game"("totalScore");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
