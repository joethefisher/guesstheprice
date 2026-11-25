import type { RawListing, NormalizedListing } from "./types";

export interface QualityResult {
  score: number;
  reject: boolean;
  reasons: string[];
}

export function scoreRaw(raw: RawListing): QualityResult {
  const reasons: string[] = [];
  let score = 0;

  // The answer is the for-sale listing's asking price. `last_sold_price` is the
  // home's PREVIOUS sale (often years old) and must never be the truth.
  const price = raw.list_price;
  const photos = raw.photos ?? [];

  // Hard rejections
  if (!raw.address?.line) {
    return { score: 0, reject: true, reasons: ["missing street address"] };
  }
  if (raw.description.beds == null) {
    return { score: 0, reject: true, reasons: ["missing beds"] };
  }
  if (!price) {
    return { score: 0, reject: true, reasons: ["missing list price"] };
  }
  // No sale-age rejection: with list-price truth, when the home last sold is
  // irrelevant to whether the round is fair.
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

  // Has a list price (always true past the hard reject). Replaces the old
  // "sold within 24 months" bonus so the rubric's max — and therefore the
  // share of listings clearing the >=50 play threshold — is unchanged.
  score += 10;

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
