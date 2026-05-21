import type { MapBlock, LatLng } from "@/lib/map";

export type AccuracyTier = "expert" | "nailed" | "solid" | "ballpark" | "off" | "yikes";

export interface ListingPublic {
  id: string;
  neighborhood: string | null;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  yearSold: number | null;
  homeType: string | null;
  photos: { url: string; caption?: string | null; thumbnailUrl?: string | null }[];
  /** Obfuscated centroid for pre-submit map preview. Null if listing has no coords. */
  map?: MapBlock | null;
}

export interface ScoreResponse {
  score: number;
  tier: AccuracyTier;
  errorPct: number;
  errorDollars: number;
  actualPrice: number;
  streetAddress: string;
  /** Exact coords — only returned after a guess is locked in. */
  exact?: LatLng | null;
  reaction: string;
  subReaction: string;
}

export interface RoundResult {
  listing: ListingPublic;
  guess: number;
  score: number;         // post-multiplier
  pointsRaw?: number;   // pre-multiplier score from API
  multiplier?: number;  // multiplier applied this round
  comboBrokenFrom?: number | null; // multiplier at time of combo break; null/undefined = no break
  tier: AccuracyTier;
  errorPct: number;
  errorDollars: number;
  actualPrice: number;
  streetAddress: string;
  reaction: string;
  /** Exact lat/lng — only available after a guess has been scored. */
  exact?: LatLng | null;
}

// Combo multiplier for a given consecutive-close-call count.
export function comboMultiplier(combo: number): number {
  if (combo >= 7) return 3.0;
  if (combo >= 5) return 2.0;
  if (combo >= 3) return 1.5;
  if (combo >= 2) return 1.2;
  return 1.0;
}

// Compute next combo value after a round with the given errorPct.
// Hot tier or better (≤10%) increments; Off/Yikes (>30%) resets; Solid/Ballpark holds.
export function nextCombo(combo: number, errorPct: number): number {
  if (errorPct <= 0.10) return combo + 1;
  if (errorPct > 0.30) return 0;
  return combo;
}

export interface SavedHome {
  listingId: string;
  neighborhood: string | null;
  city: string;
  state: string;
  photoUrl: string;
  // Score fields are null when the user saves a listing before revealing the
  // answer. They get filled in by the reveal-upgrade effect once the round
  // resolves. Pre-existing localStorage records have non-null values.
  guess: number | null;
  actualPrice: number | null;
  tier: AccuracyTier | null;
  accuracy: number | null;
  savedAt: number;
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDelta(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${formatPrice(Math.abs(n))}`;
}

export function tierEmoji(tier: AccuracyTier): string {
  switch (tier) {
    case "expert":
    case "nailed":
      return "🟩";
    case "solid":
      return "🟨";
    case "ballpark":
      return "🟧";
    case "off":
    case "yikes":
      return "🟥";
  }
}
