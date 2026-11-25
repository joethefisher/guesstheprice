import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma } from "@prisma/client";

const queryRaw = vi.fn(async (_q: unknown) => [] as unknown[]);
const count = vi.fn(async (_a: unknown) => 3);
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: (q: unknown) => queryRaw(q),
    listing: { count: (a: unknown) => count(a) },
  },
}));

import {
  PLAYABLE_SQL, PLAYABLE_WHERE, fetchDailyListing, fetchOneListing,
  fetchListingsBatch, countEligibleListings,
} from "../listing-fetch";

const sqlText = (q: unknown) => (q as Prisma.Sql).sql;

describe("listing-fetch playability", () => {
  beforeEach(() => { queryRaw.mockClear(); count.mockClear(); });

  it("PLAYABLE_SQL and PLAYABLE_WHERE both require a listPrice", () => {
    expect(PLAYABLE_SQL.sql).toContain(`"listPrice" IS NOT NULL`);
    expect(PLAYABLE_WHERE.listPrice).toEqual({ not: null });
  });

  it("daily selection and count only consider listings with a listPrice", async () => {
    await fetchDailyListing(2);
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain(`"listPrice" IS NOT NULL`);
    await countEligibleListings();
    expect(count).toHaveBeenCalledWith({ where: PLAYABLE_WHERE });
  });

  it("random + batch queries use the same predicate", async () => {
    await fetchOneListing();
    await fetchListingsBatch(3);
    for (const call of queryRaw.mock.calls) {
      expect(sqlText(call[0])).toContain(PLAYABLE_SQL.sql);
    }
  });
});
