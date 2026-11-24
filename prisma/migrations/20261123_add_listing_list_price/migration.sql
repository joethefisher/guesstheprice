-- Additive only: nullable list price (the scoring truth) on Listing.
-- No backfill here — run scripts/backfill-list-price.ts after deploy.
ALTER TABLE "Listing" ADD COLUMN "listPrice" INTEGER;
CREATE INDEX "Listing_listPrice_idx" ON "Listing"("listPrice");
