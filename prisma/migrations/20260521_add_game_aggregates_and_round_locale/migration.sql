-- Game gets six denormalized aggregates so profile/leaderboard reads stop
-- needing to join Round + Listing on every page load. Round gets
-- listingCity/listingState so analytics like "which markets are hardest"
-- can group without joining Listing.
--
-- Idempotent on the backfill steps via IS NULL guards. Re-running picks up
-- where it left off. All columns nullable so the migration can land before
-- the code that writes them.

-- 1. Add the new columns (all nullable, no defaults — safe online).
ALTER TABLE "Game"
  ADD COLUMN IF NOT EXISTS "avgAccuracy"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "avgErrorPct"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "bestRoundScore"  INTEGER,
  ADD COLUMN IF NOT EXISTS "worstRoundScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "bestRoundAcc"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "durationMs"      INTEGER;

ALTER TABLE "Round"
  ADD COLUMN IF NOT EXISTS "listingCity"  TEXT,
  ADD COLUMN IF NOT EXISTS "listingState" TEXT;

-- 2. Backfill Round.listingCity / listingState from Listing.
UPDATE "Round" r
SET "listingCity"  = l.city,
    "listingState" = l.state
FROM "Listing" l
WHERE r."listingId" = l.id
  AND r."listingCity" IS NULL;

-- 3. Backfill Game aggregates from completed Rounds.
WITH per_game AS (
  SELECT
    r."gameId"                                                                              AS game_id,
    AVG(r.accuracy)::DOUBLE PRECISION                                                       AS avg_acc,
    AVG(ABS(r.guess - l."soldPrice") / NULLIF(l."soldPrice", 0)::FLOAT)::DOUBLE PRECISION   AS avg_err,
    MAX(r.score)                                                                            AS best_score,
    MIN(r.score)                                                                            AS worst_score,
    MAX(r.accuracy)::DOUBLE PRECISION                                                       AS best_acc
  FROM "Round" r
  JOIN "Listing" l ON l.id = r."listingId"
  WHERE r.guess IS NOT NULL AND r.score IS NOT NULL
  GROUP BY r."gameId"
)
UPDATE "Game" g
SET "avgAccuracy"     = per_game.avg_acc,
    "avgErrorPct"     = per_game.avg_err,
    "bestRoundScore"  = per_game.best_score,
    "worstRoundScore" = per_game.worst_score,
    "bestRoundAcc"    = per_game.best_acc,
    "durationMs"      = (EXTRACT(EPOCH FROM (g."completedAt" - g."startedAt")) * 1000)::INTEGER
FROM per_game
WHERE g.id = per_game.game_id
  AND g."completedAt" IS NOT NULL
  AND g."avgAccuracy" IS NULL;

-- 4. New indexes.
CREATE INDEX IF NOT EXISTS "Game_userId_avgAccuracy_idx"
  ON "Game" ("userId", "avgAccuracy");
CREATE INDEX IF NOT EXISTS "Round_listingState_listingCity_idx"
  ON "Round" ("listingState", "listingCity");
