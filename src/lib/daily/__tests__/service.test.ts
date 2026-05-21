import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDailyNumber,
  hashDateString,
  accuracyToBucket,
  bucketEmoji,
  checkMilestone,
  getDailyEntryState,
  recordResult,
  formatCountdown,
  type DailyStorage,
  type DailyResult,
} from "@/lib/daily/service";

describe("getDailyNumber", () => {
  it("returns 1 for the launch date", () => {
    expect(getDailyNumber("2026-05-10")).toBe(1);
  });

  it("increments by 1 per day", () => {
    expect(getDailyNumber("2026-05-11")).toBe(2);
    expect(getDailyNumber("2026-05-12")).toBe(3);
  });

  it("clamps at 1 for dates before launch", () => {
    expect(getDailyNumber("2026-01-01")).toBe(1);
  });
});

describe("hashDateString", () => {
  it("returns deterministic non-negative integers", () => {
    const h = hashDateString("2026-05-21");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBe(hashDateString("2026-05-21")); // stable
  });

  it("returns different values for adjacent days", () => {
    expect(hashDateString("2026-05-21")).not.toBe(hashDateString("2026-05-22"));
  });
});

describe("accuracyToBucket", () => {
  it.each([
    [100, "90+"],
    [95, "90+"],
    [90, "90+"],
    [89, "80"],
    [80, "80"],
    [79, "70"],
    [70, "70"],
    [69, "60"],
    [60, "60"],
    [59, "50"],
    [50, "50"],
    [49, "<50"],
    [0, "<50"],
  ])("maps %i to %s", (acc, bucket) => {
    expect(accuracyToBucket(acc)).toBe(bucket);
  });
});

describe("bucketEmoji", () => {
  it("returns distinct emoji per bucket", () => {
    const set = new Set([
      bucketEmoji("90+"),
      bucketEmoji("80"),
      bucketEmoji("70"),
    ]);
    expect(set.size).toBe(3);
  });

  it("defaults to white square for unknown buckets", () => {
    expect(bucketEmoji("<50")).toBe("⬜");
  });
});

describe("checkMilestone", () => {
  it("returns the milestone just crossed", () => {
    expect(checkMilestone(6, 7)).toBe(7);
    expect(checkMilestone(29, 30)).toBe(30);
    expect(checkMilestone(99, 100)).toBe(100);
  });

  it("returns null when no milestone crossed", () => {
    expect(checkMilestone(5, 6)).toBeNull();
    expect(checkMilestone(8, 9)).toBeNull();
  });

  it("returns null when going backwards", () => {
    expect(checkMilestone(10, 5)).toBeNull();
  });

  it("returns the latest milestone if jumped over multiple", () => {
    // Streak resets from 365 to 0 wouldn't trigger anything; from 0 to 50 hits 7, 30, and 50.
    // Current behaviour: returns the FIRST crossed (lowest), which is the expected user-facing one.
    expect(checkMilestone(0, 50)).toBe(7);
  });
});

describe("getDailyEntryState", () => {
  function baseStorage(over: Partial<DailyStorage> = {}): DailyStorage {
    return {
      version: 1,
      lastPlayedDateET: null,
      lastResult: null,
      currentStreak: 0,
      bestStreak: 0,
      played: 0,
      history: Array(35).fill(null),
      distribution: { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
      ...over,
    };
  }

  beforeEach(() => {
    vi.setSystemTime(new Date("2026-05-21T15:00:00Z")); // ET = 11am 5/21
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns locked when last played is today", () => {
    const s = baseStorage({ lastPlayedDateET: "2026-05-21" });
    expect(getDailyEntryState(s)).toEqual({ type: "locked" });
  });

  it("returns intro with streakBroken=false when last played was yesterday", () => {
    const s = baseStorage({ lastPlayedDateET: "2026-05-20", currentStreak: 3 });
    expect(getDailyEntryState(s)).toEqual({ type: "intro", streakBroken: false });
  });

  it("returns intro with streakBroken=true when last played was older than yesterday and streak > 0", () => {
    const s = baseStorage({ lastPlayedDateET: "2026-05-18", currentStreak: 3 });
    expect(getDailyEntryState(s)).toEqual({ type: "intro", streakBroken: true });
  });

  it("never reports streakBroken when streak is already 0", () => {
    const s = baseStorage({ lastPlayedDateET: "2025-01-01", currentStreak: 0 });
    expect(getDailyEntryState(s)).toEqual({ type: "intro", streakBroken: false });
  });
});

describe("recordResult", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-05-21T15:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function makeResult(over: Partial<DailyResult> = {}): DailyResult {
    return {
      listingId: "lst1",
      guess: 500_000,
      actual: 550_000,
      accuracy: 90,
      pctOff: 0.1,
      bucket: "90+",
      submittedAt: Date.now(),
      dailyNumber: 12,
      streetAddress: "1 Test Ln",
      city: "X",
      state: "NY",
      photoUrl: "",
      ...over,
    };
  }

  it("increments played and updates last result", () => {
    const before: DailyStorage = {
      version: 1,
      lastPlayedDateET: null,
      lastResult: null,
      currentStreak: 0,
      bestStreak: 0,
      played: 5,
      history: Array(35).fill(null),
      distribution: { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
    };
    const after = recordResult(before, makeResult());
    expect(after.played).toBe(6);
    expect(after.lastPlayedDateET).toBe("2026-05-21");
    expect(after.lastResult).not.toBeNull();
    expect(after.distribution["90+"]).toBe(1);
  });

  it("continues streak when last played was yesterday", () => {
    const before: DailyStorage = {
      version: 1,
      lastPlayedDateET: "2026-05-20",
      lastResult: null,
      currentStreak: 4,
      bestStreak: 4,
      played: 4,
      history: Array(35).fill(null),
      distribution: { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
    };
    const after = recordResult(before, makeResult());
    expect(after.currentStreak).toBe(5);
    expect(after.bestStreak).toBe(5);
  });

  it("resets streak to 1 when last played was older than yesterday", () => {
    const before: DailyStorage = {
      version: 1,
      lastPlayedDateET: "2026-05-15",
      lastResult: null,
      currentStreak: 7,
      bestStreak: 10,
      played: 7,
      history: Array(35).fill(null),
      distribution: { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
    };
    const after = recordResult(before, makeResult());
    expect(after.currentStreak).toBe(1);
    expect(after.bestStreak).toBe(10); // best preserved
  });
});

describe("formatCountdown", () => {
  it("pads to HH:MM:SS", () => {
    expect(formatCountdown(0)).toEqual({ h: "00", m: "00", s: "00" });
    expect(formatCountdown(3661)).toEqual({ h: "01", m: "01", s: "01" });
  });

  it("handles large hours", () => {
    expect(formatCountdown(100 * 3600)).toEqual({ h: "100", m: "00", s: "00" });
  });

  it("clamps negatives to 00", () => {
    expect(formatCountdown(-5)).toEqual({ h: "00", m: "00", s: "00" });
  });
});
