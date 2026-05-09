import { describe, it, expect } from "vitest";
import { scoreRaw } from "../quality";
import type { RawListing } from "../types";

function makeListing(overrides: Partial<RawListing> = {}): RawListing {
  return {
    property_id: "test-001",
    address: {
      line: "123 Main St",
      city: "Austin",
      state_code: "TX",
      neighborhood_name: "Travis Heights",
      coordinate: { lat: 30.25, lon: -97.75 },
    },
    description: {
      beds: 3,
      baths_consolidated: "2",
      sqft: 1800,
      year_built: 2010,
      lot_sqft: 6000,
    },
    last_sold_price: 750_000,
    last_sold_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    photos: Array.from({ length: 12 }, (_, i) => ({
      href: `https://ar.rdcpix.com/photo-${i}.jpg`,
    })),
    ...overrides,
  };
}

describe("scoreRaw", () => {
  it("scores a complete listing highly", () => {
    const { score, reject } = scoreRaw(makeListing());
    expect(reject).toBe(false);
    expect(score).toBeGreaterThanOrEqual(60);
  });

  it("rejects a listing missing street address", () => {
    const listing = makeListing();
    listing.address.line = "";
    const { reject, reasons } = scoreRaw(listing);
    expect(reject).toBe(true);
    expect(reasons).toContain("missing street address");
  });

  it("rejects a listing with price below $50K", () => {
    const { reject, reasons } = scoreRaw(makeListing({ last_sold_price: 10_000 }));
    expect(reject).toBe(true);
    expect(reasons.some((r) => r.includes("price out of range"))).toBe(true);
  });

  it("rejects a listing with price above $50M", () => {
    const { reject } = scoreRaw(makeListing({ last_sold_price: 60_000_000 }));
    expect(reject).toBe(true);
  });

  it("rejects a listing with fewer than 3 photos", () => {
    const { reject, reasons } = scoreRaw(
      makeListing({ photos: [{ href: "https://example.com/a.jpg" }, { href: "https://example.com/b.jpg" }] })
    );
    expect(reject).toBe(true);
    expect(reasons.some((r) => r.includes("too few photos"))).toBe(true);
  });

  it("awards 20 points for >= 5 photos", () => {
    const listing5 = makeListing({
      photos: Array.from({ length: 5 }, (_, i) => ({ href: `https://example.com/${i}.jpg` })),
    });
    const listing4 = makeListing({
      photos: Array.from({ length: 4 }, (_, i) => ({ href: `https://example.com/${i}.jpg` })),
    });
    const { score: s5 } = scoreRaw(listing5);
    const { score: s4 } = scoreRaw(listing4);
    expect(s5 - s4).toBe(20);
  });

  it("awards extra 10 points for >= 10 photos", () => {
    const listing10 = makeListing({
      photos: Array.from({ length: 10 }, (_, i) => ({ href: `https://example.com/${i}.jpg` })),
    });
    const listing5 = makeListing({
      photos: Array.from({ length: 5 }, (_, i) => ({ href: `https://example.com/${i}.jpg` })),
    });
    const { score: s10 } = scoreRaw(listing10);
    const { score: s5 } = scoreRaw(listing5);
    expect(s10 - s5).toBe(10);
  });

  it("does not exceed 100", () => {
    const perfect = makeListing({
      photos: Array.from({ length: 20 }, (_, i) => ({
        href: `https://ar.rdcpix.com/${i}.jpg`,
      })),
    });
    const { score } = scoreRaw(perfect);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalizes missing sqft", () => {
    const withSqft = makeListing();
    const noSqft = makeListing();
    noSqft.description.sqft = undefined;
    expect(scoreRaw(withSqft).score).toBeGreaterThan(scoreRaw(noSqft).score);
  });

  it("penalizes missing neighborhood", () => {
    const withNeighborhood = makeListing();
    const noNeighborhood = makeListing();
    noNeighborhood.address.neighborhood_name = undefined;
    expect(scoreRaw(withNeighborhood).score).toBeGreaterThan(scoreRaw(noNeighborhood).score);
  });
});
