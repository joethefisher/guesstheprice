import { describe, it, expect, vi } from "vitest";

const { cacheCalls } = vi.hoisted(() => ({ cacheCalls: [] as { keyParts: string[] }[] }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown, keyParts: string[]) => {
    cacheCalls.push({ keyParts });
    return fn;
  },
}));

const countEligibleListings = vi.fn(async () => 10);
const fetchDailyListing = vi.fn(async (offset: number) => ({ id: `l${offset}` }));
vi.mock("@/lib/listing-fetch", () => ({
  countEligibleListings: () => countEligibleListings(),
  fetchDailyListing: (o: number) => fetchDailyListing(o),
}));

import { GET } from "../route";

describe("GET /api/daily", () => {
  it("uses the v2 cache key so pre-list-price v1 dailies are never served", () => {
    expect(cacheCalls).toHaveLength(1);
    expect(cacheCalls[0].keyParts).toEqual(["api:daily:v2"]);
  });

  it("picks via the eligible (listPrice-gated) count and fetch", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(countEligibleListings).toHaveBeenCalled();
    const offset = fetchDailyListing.mock.calls[0][0];
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(10);
  });
});
