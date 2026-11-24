/**
 * The single source of truth for "what price is this round scored against".
 *
 * Listings come from a FOR-SALE endpoint, so the answer is the asking price
 * captured at ingest (`Listing.listPrice`). `Listing.soldPrice` holds the
 * home's PREVIOUS sale and must never be used as the answer.
 *
 * Listings without a listPrice (not yet backfilled) are not playable: they
 * are filtered out of every gameplay query and /api/score refuses them. We
 * deliberately do NOT fall back to soldPrice — that is the bug being fixed.
 */
export function answerPrice(listing: { listPrice: number | null }): number | null {
  const p = listing.listPrice;
  return p != null && p > 0 ? p : null;
}

/**
 * Price used to recompute aggregates for rounds that already exist. Rounds
 * scored before list-price truth shipped were scored against soldPrice, and
 * their stored score/accuracy are never rewritten; this is only used for the
 * derived errorPct when a game completes.
 */
export function aggregatePrice(listing: { listPrice: number | null; soldPrice: number }): number {
  return answerPrice(listing) ?? listing.soldPrice;
}
