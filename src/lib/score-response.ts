/**
 * Shared client handling for POST /api/score failures.
 *
 * 409 means the listing has no listPrice (the answer) and can never be
 * scored. Retrying the same listing cannot succeed, so callers must not offer
 * a "try again" on it: free play swaps in a new home and the daily shows a
 * terminal "unavailable" state.
 */
export const SCORE_UNPLAYABLE_STATUS = 409;

export type ScoreFailure = "unplayable" | "error";

export function classifyScoreFailure(status: number): ScoreFailure {
  return status === SCORE_UNPLAYABLE_STATUS ? "unplayable" : "error";
}

export const PLAY_UNPLAYABLE_MESSAGE =
  "That home's price isn't available, so here's a different one.";

export const DAILY_UNAVAILABLE_MESSAGE =
  "Today's home is unavailable. A new daily drops at midnight ET.";
