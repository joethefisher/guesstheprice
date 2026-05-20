-- Add a materialised accuracy column to Round so the landing
-- "last 24h" aggregate doesn't have to join + recompute on every
-- request. Range is [0, 1]; clamping at 0 prevents wild guesses
-- (e.g. $10M on a $200K house) from dragging an AVG negative.

ALTER TABLE "Round" ADD COLUMN "accuracy" DOUBLE PRECISION;

-- Backfill existing rounds from the listing's sold price.
UPDATE "Round" r
SET "accuracy" = GREATEST(0, 1 - ABS(r."guess" - l."soldPrice")::float / l."soldPrice")
FROM "Listing" l
WHERE r."listingId" = l.id
  AND r."guess" IS NOT NULL
  AND l."soldPrice" > 0;

-- Covering index for the rolling-24h aggregate. Bare guessedAt is enough;
-- Postgres will combine with the new column via the heap scan.
CREATE INDEX "Round_guessedAt_idx" ON "Round"("guessedAt");
