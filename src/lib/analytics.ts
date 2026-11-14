/**
 * Central product-events registry for Vercel Analytics.
 *
 * Why this file exists:
 *   - One place to audit every event name and its prop shape.
 *   - Event names live in the Vercel dashboard forever — centralizing
 *     the string literals here prevents typos/aliases creeping in.
 *   - Call-sites stay readable: `events.roundSubmitted({...})` vs
 *     `track("round_submitted", {...})` scattered everywhere.
 *   - Easy to swap providers (PostHog, Mixpanel) later without touching
 *     every call-site.
 *
 * Conventions:
 *   - Event names: snake_case, verb-past-tense (`round_submitted`).
 *   - Props: flat primitives only (number/string/boolean). No PII.
 *   - Tracking is a no-op in dev + test (Vercel Analytics self-suppresses
 *     when deployed outside Vercel). Safe to call from anywhere.
 */

import { track } from "@vercel/analytics";

type Tier = "expert" | "nailed" | "solid" | "ballpark" | "off" | "yikes";

export const events = {
  // ─── Freeplay funnel ───────────────────────────────────────────────
  gameStarted: () => track("game_started"),

  roundSubmitted: (p: {
    round_number: number;
    accuracy: number; // 0-100
    tier: Tier;
  }) => track("round_submitted", p),

  gameCompleted: (p: {
    total_score: number;
    avg_accuracy: number; // 0-100
  }) => track("game_completed", p),

  // ─── Daily funnel ──────────────────────────────────────────────────
  dailyOpened: (p: {
    state: "intro" | "play" | "locked";
    current_streak: number;
  }) => track("daily_opened", p),

  dailySubmitted: (p: {
    accuracy: number; // 0-100
    new_streak: number;
  }) => track("daily_submitted", p),

  /** Fires exactly once per milestone threshold hit (3, 7, 14, 30). */
  dailyStreakMilestone: (p: { streak: number }) =>
    track("daily_streak_milestone", p),

  // ─── Engagement ────────────────────────────────────────────────────
  homeSaved: (p: { source: "play" | "reveal" | "daily" }) =>
    track("home_saved", p),

  resultShared: () => track("result_shared"),

  notifyMeSubscribed: (p: { source: string }) =>
    track("notify_me_subscribed", p),

  // ─── Auth ──────────────────────────────────────────────────────────
  signUpCompleted: () => track("sign_up_completed"),
};
