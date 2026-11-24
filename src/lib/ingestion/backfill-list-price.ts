/**
 * Pure helpers for scripts/backfill-list-price.ts. Kept free of Prisma and
 * fs side effects so they can be unit-tested.
 */

export interface CacheFile {
  ts?: number;
  data?: { listings?: Array<{ property_id?: string; list_price?: number | null }> };
}

/**
 * Build externalId → list_price from raw-cache files. When an id appears in
 * more than one file, the most recently cached (`ts`) observation wins.
 * Non-positive / missing prices are ignored.
 */
export function buildListPriceMap(files: CacheFile[]): Map<string, number> {
  const best = new Map<string, { price: number; ts: number }>();
  for (const f of files) {
    const ts = typeof f?.ts === "number" ? f.ts : 0;
    for (const l of f?.data?.listings ?? []) {
      const id = l?.property_id;
      const price = l?.list_price;
      if (!id || typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue;
      const prev = best.get(id);
      if (!prev || ts >= prev.ts) best.set(id, { price: Math.round(price), ts });
    }
  }
  return new Map([...best].map(([id, v]) => [id, v.price]));
}

export interface BackfillRow {
  id: string;
  externalId: string;
  listPrice: number | null;
  playable: boolean; // isActive && qualityScore >= 50
}

export interface BackfillPlan {
  updates: Array<{ id: string; listPrice: number }>;
  counts: {
    total: number;
    matched: number;
    unchanged: number;
    toSet: number;
    toChange: number;
    unmatched: number;
    playableTotal: number;
    playableMatched: number;
    playableUnmatched: number;
  };
}

/**
 * Decide which rows need writing. Idempotent: rows whose listPrice already
 * equals the cache value are left alone, so a second --apply is a no-op.
 * Rows with no cache match are never touched (they stay null → not playable).
 */
export function planBackfill(rows: BackfillRow[], prices: Map<string, number>): BackfillPlan {
  const updates: BackfillPlan["updates"] = [];
  const c: BackfillPlan["counts"] = {
    total: rows.length, matched: 0, unchanged: 0, toSet: 0, toChange: 0,
    unmatched: 0, playableTotal: 0, playableMatched: 0, playableUnmatched: 0,
  };
  for (const r of rows) {
    if (r.playable) c.playableTotal++;
    const p = prices.get(r.externalId);
    if (p == null) {
      c.unmatched++;
      if (r.playable) c.playableUnmatched++;
      continue;
    }
    c.matched++;
    if (r.playable) c.playableMatched++;
    if (r.listPrice === p) { c.unchanged++; continue; }
    if (r.listPrice == null) c.toSet++; else c.toChange++;
    updates.push({ id: r.id, listPrice: p });
  }
  return { updates, counts: c };
}
