import { describe, it, expect, vi } from "vitest";
import { runConcurrent } from "../stages/mirror";

describe("runConcurrent", () => {
  it("preserves index ordering of results", async () => {
    const items = [1, 2, 3, 4, 5];
    const out = await runConcurrent(items, 3, async (n) => n * 10);
    expect(out).toEqual([10, 20, 30, 40, 50]);
  });

  it("respects the concurrency limit", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 50 }, (_, i) => i);

    await runConcurrent(items, 8, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      // Small async pause so workers actually overlap
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return null;
    });

    expect(maxInFlight).toBeLessThanOrEqual(8);
    expect(maxInFlight).toBeGreaterThan(1); // proves concurrency actually fired
  });

  it("processes every item exactly once", async () => {
    const seen = new Set<number>();
    const items = Array.from({ length: 100 }, (_, i) => i);
    await runConcurrent(items, 16, async (n) => {
      if (seen.has(n)) throw new Error(`duplicate: ${n}`);
      seen.add(n);
      return null;
    });
    expect(seen.size).toBe(100);
  });

  it("returns empty array for empty input", async () => {
    const out = await runConcurrent([], 8, async () => "x");
    expect(out).toEqual([]);
  });

  it("handles concurrency >= items count without error", async () => {
    const out = await runConcurrent([1, 2, 3], 100, async (n) => n);
    expect(out).toEqual([1, 2, 3]);
  });

  it("clamps concurrency to at least 1", async () => {
    // 0 or negative concurrency would normally produce 0 workers — verify
    // the guard kicks in so we don't silently no-op the whole batch.
    const out = await runConcurrent([10, 20, 30], 0, async (n) => n);
    expect(out).toEqual([10, 20, 30]);
  });

  it("propagates errors from the task function", async () => {
    await expect(
      runConcurrent([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error("boom");
        return n;
      }),
    ).rejects.toThrow("boom");
  });
});
