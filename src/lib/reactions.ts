/**
 * Reaction copy bank. Pulled at random for each reveal to keep the game fresh.
 *
 * Voice principles (from design brief):
 * - Conversational, never corporate
 * - Light snark welcomed
 * - Match the result energy
 * - Never moralize about prices
 */

import type { AccuracyTier } from "./scoring";

const reactions: Record<AccuracyTier, string[]> = {
  expert: [
    "Are you a real estate agent?",
    "Get out. Just get out.",
    "You're either psychic or this is your job.",
    "Suspiciously accurate.",
    "Were you AT the closing?",
    "You guessed exactly that on purpose, didn't you."
  ],
  nailed: [
    "You nailed it.",
    "Chef's kiss.",
    "Comp expert behavior.",
    "Eerily close.",
    "Zillow could hire you.",
    "That was almost too good."
  ],
  solid: [
    "Solid guess.",
    "Real estate brain detected.",
    "You know your markets.",
    "Respectable.",
    "Within shouting distance.",
    "Not bad at all."
  ],
  ballpark: [
    "In the ballpark.",
    "You're in the right zip code, at least.",
    "Same county, give or take.",
    "Close enough for jazz.",
    "We'll allow it.",
    "Reasonable, if not impressive."
  ],
  off: [
    "Not quite.",
    "That's a bit of a stretch.",
    "You and the market disagree.",
    "Bold guess. Wrong, but bold.",
    "The math is not mathing.",
    "Swing and a miss."
  ],
  yikes: [
    "Yikes.",
    "What were you thinking?",
    "Have you seen a house before?",
    "Did you guess in pesos?",
    "Bro.",
    "That is wildly off.",
    "We're going to need to talk about this.",
    "The vibes were not enough this time."
  ]
};

/**
 * Get a random reaction for the given tier.
 * Stable for the same input if you pass a seed.
 */
export function getReaction(tier: AccuracyTier, seed?: string): string {
  const options = reactions[tier];
  if (seed) {
    // Deterministic pick based on seed (so reloading doesn't change the copy)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return options[Math.abs(hash) % options.length];
  }
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Sub-headline copy nudging next action.
 */
export function getSubReaction(tier: AccuracyTier): string {
  switch (tier) {
    case "expert":
      return "Genuinely impressive.";
    case "nailed":
      return "You've got the touch.";
    case "solid":
      return "You know what you're doing.";
    case "ballpark":
      return "Keep going, you'll dial it in.";
    case "off":
      return "The next one's a fresh start.";
    case "yikes":
      return "We don't talk about this round.";
  }
}
