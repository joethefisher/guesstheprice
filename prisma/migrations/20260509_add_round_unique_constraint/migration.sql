-- Add unique constraint on (gameId, roundNumber) to enforce Round integrity at the DB level.
-- Previously enforced only via application-level string ID construction.
CREATE UNIQUE INDEX "Round_gameId_roundNumber_key" ON "Round"("gameId", "roundNumber");
