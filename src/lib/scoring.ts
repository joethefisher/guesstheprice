/**
 * Pricetag scoring logic.
 *
 * A guess produces a score from 0 to 100 based on percent error from actual.
 *
 *   error_pct = min(1, |guess - actual| / actual)
 *   score     = round(100 * (1 - error_pct))
 *
 * Examples:
 *   actual $1.0M, guess $1.0M  -> 100 (perfect)
 *   actual $1.0M, guess $1.05M -> 95
 *   actual $1.0M, guess $1.5M  -> 50
 *   actual $1.0M, guess $2.0M  -> 0  (capped, 100% over)
 *
 * Note we cap at 100% error so wildly wrong guesses don't go negative.
 * Going under is symmetric to going over (e.g. $500k guess on $1M actual
 * is the same -50 points as $1.5M guess on $1M actual).
 */

export type AccuracyTier =
  | "expert"   // within 2%
  | "nailed"   // within 5%
  | "solid"    // within 15%
  | "ballpark" // within 30%
  | "off"      // within 50%
  | "yikes";   // beyond 50%

export interface ScoreResult {
  score: number;          // 0-100
  errorPct: number;       // 0-1
  errorDollars: number;   // signed (negative = under, positive = over)
  tier: AccuracyTier;
}

/**
 * 0..1 accuracy snapshot stored on Round and aggregated into Game.avgAccuracy /
 * bestRoundAcc. Symmetric to {@link scoreGuess} but kept as a separate helper
 * so writes don't have to round-trip through ScoreResult.
 */
export function accuracyFromGuess(guess: number, actual: number): number {
  if (actual <= 0) return 0;
  return Math.max(0, 1 - Math.abs(guess - actual) / actual);
}

/**
 * Per-round inputs needed to compute the denormalized Game aggregates. Mirrors
 * the prisma.round.findMany select used in the games/[id] PATCH handler.
 */
export interface RoundForAggregate {
  score: number | null;
  accuracy: number | null;
  guess: number | null;
  soldPrice: number;
}

export interface GameAggregates {
  avgAccuracy: number | null;
  avgErrorPct: number | null;
  bestRoundScore: number | null;
  worstRoundScore: number | null;
  bestRoundAcc: number | null;
}

/**
 * Reduce a game's rounds into the six denormalized values written to Game on
 * completion. Returns nulls when there are no finished rounds (e.g. a game
 * was abandoned mid-way) so the DB schema's nullable contract is preserved.
 */
export function computeGameAggregates(rounds: RoundForAggregate[]): GameAggregates {
  const finished = rounds.filter((r) => r.score != null && r.accuracy != null);
  const accuracies = finished.map((r) => r.accuracy as number);
  const scores = finished.map((r) => r.score as number);
  const errors = finished
    .filter((r) => r.guess != null && r.soldPrice > 0)
    .map((r) => Math.abs((r.guess as number) - r.soldPrice) / r.soldPrice);

  return {
    avgAccuracy: accuracies.length
      ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
      : null,
    avgErrorPct: errors.length
      ? errors.reduce((a, b) => a + b, 0) / errors.length
      : null,
    bestRoundScore: scores.length ? Math.max(...scores) : null,
    worstRoundScore: scores.length ? Math.min(...scores) : null,
    bestRoundAcc: accuracies.length ? Math.max(...accuracies) : null,
  };
}

export function scoreGuess(guess: number, actual: number): ScoreResult {
  if (actual <= 0) {
    throw new Error("actual price must be positive");
  }
  if (guess < 0) {
    throw new Error("guess cannot be negative");
  }

  const errorDollars = guess - actual;
  const rawErrorPct = Math.abs(errorDollars) / actual;
  const errorPct = Math.min(1, rawErrorPct);
  const score = Math.round(100 * (1 - errorPct));

  const tier = tierFromErrorPct(rawErrorPct);

  return { score, errorPct, errorDollars, tier };
}

/**
 * Tier ceilings as percent-error. Order matters: each tier owns the band
 * between the previous one's ceiling and its own. Tweak these to retune
 * difficulty — every tier badge, share-card emoji, and combo-streak rule
 * downstream reads from this single source.
 */
export const TIER_THRESHOLDS = {
  expert: 0.02,   // within 2%
  nailed: 0.05,   // within 5%
  solid: 0.15,    // within 15%
  ballpark: 0.30, // within 30%
  off: 0.50,      // within 50%
  // yikes: anything beyond `off`
} as const;

export function tierFromErrorPct(errorPct: number): AccuracyTier {
  if (errorPct <= TIER_THRESHOLDS.expert) return "expert";
  if (errorPct <= TIER_THRESHOLDS.nailed) return "nailed";
  if (errorPct <= TIER_THRESHOLDS.solid) return "solid";
  if (errorPct <= TIER_THRESHOLDS.ballpark) return "ballpark";
  if (errorPct <= TIER_THRESHOLDS.off) return "off";
  return "yikes";
}

/**
 * Wordle-style emoji square for share cards.
 */
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

/**
 * Format dollars as a clean string with thousands separators.
 */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

/**
 * Format a signed delta with explicit sign.
 */
export function formatDelta(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  const abs = Math.abs(n);
  return `${sign}${formatPrice(abs).replace("$", "$")}`;
}
