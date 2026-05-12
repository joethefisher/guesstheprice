/**
 * Daily service — ET date math, localStorage schema, streak logic.
 *
 * All persistence lives under STORAGE_KEY ("pricetag.daily.v1") so it
 * cannot collide with any existing host keys.
 */

export const STORAGE_KEY = "pricetag.daily.v1";

// Day 1 of the daily game.
const LAUNCH_DATE_ET = "2026-05-10";
const MILESTONE_THRESHOLDS = [7, 30, 50, 100, 365] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccuracyBucket = "90+" | "80" | "70" | "60" | "50" | "<50";

export interface DailyResult {
  listingId: string;
  guess: number;
  actual: number;
  accuracy: number;   // 0–100
  pctOff: number;     // 0–1
  bucket: AccuracyBucket;
  submittedAt: number;
  dailyNumber: number;
  streetAddress: string;
  city: string;
  state: string;
  photoUrl: string;
}

export interface DailyStorage {
  version: 1;
  lastPlayedDateET: string | null;
  lastResult: DailyResult | null;
  currentStreak: number;
  bestStreak: number;
  played: number;
  history: (number | null)[];           // last 35 days oldest→newest; null = missed
  distribution: Record<AccuracyBucket, number>;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD in America/New_York. */
export function getTodayET(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Returns the previous day in ET as YYYY-MM-DD. */
export function getYesterdayET(): string {
  const d = new Date(getTodayET() + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Days since launch, 1-indexed. */
export function getDailyNumber(dateET?: string): number {
  const target = dateET ?? getTodayET();
  const launch = new Date(LAUNCH_DATE_ET + "T00:00:00Z");
  const current = new Date(target + "T00:00:00Z");
  const diffDays = Math.round((current.getTime() - launch.getTime()) / 86_400_000);
  return Math.max(1, diffDays + 1);
}

/** Seconds until next midnight ET. */
export function secondsUntilMidnightET(): number {
  const now = new Date();
  const etMidnight = new Date(
    new Date(getTodayET() + "T00:00:00Z").getTime() + 86_400_000
  );
  // Adjust for ET offset
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayMidnight = new Date(etNow);
  todayMidnight.setHours(24, 0, 0, 0);
  const localOffsetMs = todayMidnight.getTime() - now.getTime();
  return Math.max(0, Math.floor(localOffsetMs / 1000));
}

/** Formats seconds as HH:MM:SS. */
export function formatCountdown(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function defaultStorage(): DailyStorage {
  return {
    version: 1,
    lastPlayedDateET: null,
    lastResult: null,
    currentStreak: 0,
    bestStreak: 0,
    played: 0,
    history: Array(35).fill(null),
    distribution: { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
  };
}

export function loadStorage(): DailyStorage {
  if (typeof window === "undefined") return defaultStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorage();
    const parsed = JSON.parse(raw) as DailyStorage;
    if (parsed.version !== 1) return defaultStorage();
    // Ensure distribution has all buckets
    const def = defaultStorage();
    return {
      ...def,
      ...parsed,
      distribution: { ...def.distribution, ...parsed.distribution },
    };
  } catch {
    return defaultStorage();
  }
}

export function saveStorage(data: DailyStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or disabled
  }
}

// ─── Bucket math ──────────────────────────────────────────────────────────────

export function accuracyToBucket(accuracy: number): AccuracyBucket {
  if (accuracy >= 90) return "90+";
  if (accuracy >= 80) return "80";
  if (accuracy >= 70) return "70";
  if (accuracy >= 60) return "60";
  if (accuracy >= 50) return "50";
  return "<50";
}

// ─── State logic ──────────────────────────────────────────────────────────────

export type DailyEntryState =
  | { type: "locked" }
  | { type: "intro"; streakBroken: boolean };

/**
 * Determines whether the player has already played today and whether
 * their streak was broken by missing yesterday.
 */
export function getDailyEntryState(storage: DailyStorage): DailyEntryState {
  const todayET = getTodayET();
  if (storage.lastPlayedDateET === todayET) {
    return { type: "locked" };
  }
  const yesterdayET = getYesterdayET();
  const streakBroken =
    storage.currentStreak > 0 &&
    storage.lastPlayedDateET !== null &&
    storage.lastPlayedDateET !== yesterdayET;
  return { type: "intro", streakBroken };
}

/**
 * Checks if a milestone was just crossed given old and new streak values.
 */
export function checkMilestone(
  oldStreak: number,
  newStreak: number
): (typeof MILESTONE_THRESHOLDS)[number] | null {
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (oldStreak < threshold && newStreak >= threshold) return threshold;
  }
  return null;
}

/**
 * Persists a daily result to localStorage and returns updated storage.
 */
export function recordResult(
  storage: DailyStorage,
  result: DailyResult
): DailyStorage {
  const todayET = getTodayET();
  const yesterdayET = getYesterdayET();

  // Compute new streak
  const streakContinues =
    storage.lastPlayedDateET === null ||
    storage.lastPlayedDateET === yesterdayET;
  const newStreak = streakContinues ? storage.currentStreak + 1 : 1;
  const newBest = Math.max(storage.bestStreak, newStreak);

  // Append to 35-day history (shift oldest off front)
  const newHistory = [...storage.history.slice(1), result.accuracy];

  // Update distribution
  const newDist = { ...storage.distribution };
  newDist[result.bucket] = (newDist[result.bucket] ?? 0) + 1;

  const updated: DailyStorage = {
    ...storage,
    lastPlayedDateET: todayET,
    lastResult: result,
    currentStreak: newStreak,
    bestStreak: newBest,
    played: storage.played + 1,
    history: newHistory,
    distribution: newDist,
  };

  saveStorage(updated);
  return updated;
}

/**
 * Returns the emoji for a given accuracy bucket — used in share text.
 */
export function bucketEmoji(bucket: AccuracyBucket): string {
  switch (bucket) {
    case "90+": return "🟩";
    case "80": return "🟧";
    case "70": return "🟨";
    case "60": return "⬛";
    default: return "⬜";
  }
}

/**
 * Builds the shareable text block.
 */
export function buildShareText(
  dailyNumber: number,
  accuracy: number,
  bucket: AccuracyBucket,
  streak: number,
  history: (number | null)[]
): string {
  const recent = history.slice(-7).filter((v) => v !== null) as number[];
  const emojiRow = recent.map((v) => bucketEmoji(accuracyToBucket(v))).join("");
  return [
    `Pricetag #${dailyNumber} — ${accuracy}%`,
    emojiRow,
    `🔥${streak} · guesstheprice.ai`,
  ].join("\n");
}

/**
 * Milestone copy for each threshold.
 */
export function milestoneHeadline(threshold: number): string {
  switch (threshold) {
    case 7:   return "One full week.";
    case 30:  return "A month of perfect form.";
    case 50:  return "Halfway to a hundred.";
    case 100: return "A century. Take a bow.";
    case 365: return "A full year. Absurd.";
    default:  return `${threshold} days straight.`;
  }
}

/**
 * Simple non-cryptographic hash for deterministic daily listing selection.
 * djb2 variant.
 */
export function hashDateString(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) ^ dateStr.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash;
}
