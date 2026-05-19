import type { RawListing, NormalizedListing } from "./types";
import { recencyCutoffDate } from "@/lib/recency";

export interface QualityResult {
  score: number;
  reject: boolean;
  reasons: string[];
}

const SOLD_24_MONTHS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export function scoreRaw(raw: RawListing): QualityResult {
  const reasons: string[] = [];
  let score = 0;

  const price = raw.last_sold_price ?? raw.list_price;
  const photos = raw.photos ?? [];

  // Hard rejections
  if (!raw.address?.line) {
    return { score: 0, reject: true, reasons: ["missing street address"] };
  }
  if (raw.description.beds == null) {
    return { score: 0, reject: true, reasons: ["missing beds"] };
  }
  if (!price) {
    return { score: 0, reject: true, reasons: ["missing price"] };
  }
  // Drop anything sold before the recency cutoff — mirrors the runtime filter
  // so we stop ingesting old listings that gameplay would exclude anyway.
  if (!raw.last_sold_date || new Date(raw.last_sold_date) < recencyCutoffDate()) {
    return { score: 0, reject: true, reasons: ["sold before 24-month cutoff"] };
  }
  if (price < 50_000 || price > 50_000_000) {
    return { score: 0, reject: true, reasons: [`price out of range: ${price}`] };
  }
  if (photos.length < 3) {
    return { score: 0, reject: true, reasons: [`too few photos: ${photos.length}`] };
  }

  // Scoring rubric
  if (photos.length >= 5) { score += 20; }
  if (photos.length >= 10) { score += 10; }
  if (raw.description.sqft) { score += 10; }
  if (raw.description.year_built) { score += 5; }
  if (raw.description.lot_sqft) { score += 5; }
  if (price >= 100_000 && price <= 15_000_000) { score += 10; }
  if (raw.address.coordinate) { score += 5; }

  if (raw.last_sold_date) {
    const soldMs = new Date(raw.last_sold_date).getTime();
    if (Date.now() - soldMs <= SOLD_24_MONTHS_MS) { score += 10; }
  }

  // Photos from same domain (consistent listing photos, not stock)
  if (photos.length > 0) {
    try {
      const domains = new Set(photos.map((p) => new URL(p.href).hostname));
      if (domains.size === 1) { score += 5; }
    } catch {
      // invalid URL
    }
  }

  return { score: Math.min(100, score), reject: false, reasons };
}

export function scoreNormalized(listing: NormalizedListing): number {
  return listing.qualityScore;
}
