import { describe, it, expect } from "vitest";
import { buildListPriceMap, planBackfill, type BackfillRow } from "../backfill-list-price";

describe("buildListPriceMap", () => {
  it("maps property_id to list_price, latest cache entry wins", () => {
    const m = buildListPriceMap([
      { ts: 1, data: { listings: [{ property_id: "a", list_price: 100_000 }, { property_id: "b", list_price: 200_000 }] } },
      { ts: 2, data: { listings: [{ property_id: "a", list_price: 95_000 }] } },
    ]);
    expect(m.get("a")).toBe(95_000);
    expect(m.get("b")).toBe(200_000);
  });

  it("ignores missing, null, and non-positive prices and malformed files", () => {
    const m = buildListPriceMap([
      { ts: 1, data: { listings: [{ property_id: "a", list_price: null }, { property_id: "b", list_price: 0 }, { list_price: 5 }] } },
      {} as never,
    ]);
    expect(m.size).toBe(0);
  });
});

describe("planBackfill", () => {
  const prices = new Map([["x1", 300_000], ["x2", 400_000], ["x3", 500_000]]);
  const rows: BackfillRow[] = [
    { id: "1", externalId: "x1", listPrice: null, playable: true },     // set
    { id: "2", externalId: "x2", listPrice: 400_000, playable: true },  // unchanged
    { id: "3", externalId: "x3", listPrice: 450_000, playable: false }, // change
    { id: "4", externalId: "nope", listPrice: null, playable: true },   // unmatched
  ];

  it("counts and plans only rows that need writing", () => {
    const { updates, counts } = planBackfill(rows, prices);
    expect(updates).toEqual([{ id: "1", listPrice: 300_000 }, { id: "3", listPrice: 500_000 }]);
    expect(counts).toEqual({
      total: 4, matched: 3, unchanged: 1, toSet: 1, toChange: 1, unmatched: 1,
      playableTotal: 3, playableMatched: 2, playableUnmatched: 1,
    });
  });

  it("is idempotent: applying the plan then re-planning yields no updates", () => {
    const { updates } = planBackfill(rows, prices);
    const applied = rows.map((r) => {
      const u = updates.find((x) => x.id === r.id);
      return u ? { ...r, listPrice: u.listPrice } : r;
    });
    expect(planBackfill(applied, prices).updates).toEqual([]);
  });

  it("never touches unmatched rows", () => {
    const { updates } = planBackfill(rows, prices);
    expect(updates.some((u) => u.id === "4")).toBe(false);
  });
});
