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
  homeType: string | null;
  photos: { url: string; caption?: string | null; thumbnailUrl?: string | null }[];
}

export interface ScoreResponse {
  score: number;
  tier: AccuracyTier;
  errorPct: number;
  errorDollars: number;
  actualPrice: number;
  streetAddress: string;
  reaction: string;
  subReaction: string;
}

export interface RoundResult {
  listing: ListingPublic;
  guess: number;
  score: number;
  tier: AccuracyTier;
  errorPct: number;
  errorDollars: number;
  actualPrice: number;
  streetAddress: string;
  reaction: string;
}

export interface SavedHome {
  listingId: string;
  neighborhood: string | null;
  city: string;
  state: string;
  photoUrl: string;
  guess: number;
  actualPrice: number;
  tier: AccuracyTier;
  accuracy: number;
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
