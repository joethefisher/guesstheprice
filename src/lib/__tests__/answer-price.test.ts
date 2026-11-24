import { describe, it, expect } from "vitest";
import { answerPrice, aggregatePrice } from "@/lib/answer-price";

describe("answerPrice", () => {
  it("returns listPrice when present", () => {
    expect(answerPrice({ listPrice: 525_000 })).toBe(525_000);
  });

  it("returns null when listPrice is missing — never the previous sale", () => {
    const listing = { listPrice: null, soldPrice: 300_000 };
    expect(answerPrice(listing)).toBeNull();
  });

  it("treats a non-positive listPrice as missing", () => {
    expect(answerPrice({ listPrice: 0 })).toBeNull();
  });
});

describe("aggregatePrice", () => {
  it("prefers listPrice", () => {
    expect(aggregatePrice({ listPrice: 525_000, soldPrice: 300_000 })).toBe(525_000);
  });

  it("falls back to soldPrice only for legacy rows without a listPrice", () => {
    expect(aggregatePrice({ listPrice: null, soldPrice: 300_000 })).toBe(300_000);
  });
});
