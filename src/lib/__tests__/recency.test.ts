import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { recencyCutoffDate, RECENCY_CUTOFF_MONTHS } from "@/lib/recency";

describe("recencyCutoffDate", () => {
  beforeAll(() => {
    // Pin Date.now so the test is deterministic regardless of when it runs.
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns a date exactly RECENCY_CUTOFF_MONTHS earlier", () => {
    const cutoff = recencyCutoffDate();
    const now = new Date();
    expect(cutoff.getUTCFullYear() * 12 + cutoff.getUTCMonth()).toBe(
      now.getUTCFullYear() * 12 + now.getUTCMonth() - RECENCY_CUTOFF_MONTHS,
    );
  });

  it("preserves the day-of-month from now", () => {
    const cutoff = recencyCutoffDate();
    const now = new Date();
    expect(cutoff.getUTCDate()).toBe(now.getUTCDate());
  });

  it("never returns a future date", () => {
    expect(recencyCutoffDate().getTime()).toBeLessThan(Date.now());
  });
});
