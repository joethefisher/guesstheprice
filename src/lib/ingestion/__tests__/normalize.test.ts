import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { normalizeOne } from "../stages/normalize";
import type { RawListing } from "../types";

// Pin "now" so recency-based quality rejections are deterministic. Tests use
// sold dates within the last 24 months relative to this anchor.
beforeAll(() => {
  vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
});
afterAll(() => {
  vi.useRealTimers();
});

function makeRaw(overrides: Partial<RawListing> = {}): RawListing {
  return {
    property_id: "norm-001",
    address: {
      line: "456 Oak Avenue",
      city: "Denver",
      state_code: "CO",
      neighborhood_name: "Cherry Creek",
      postal_code: "80206",
      coordinate: { lat: 39.72, lon: -104.95 },
    },
    description: {
      beds: 4,
      baths_consolidated: "3.5",
      sqft: 2800,
      year_built: 2008,
      lot_sqft: 7200,
      type: "single_family",
    },
    list_price: 1_450_000,
    last_sold_price: 1_200_000,
    last_sold_date: "2024-06-15",
    photos: Array.from({ length: 8 }, (_, i) => ({
      href: `https://photos.example.com/${i}.jpg`,
      width: 1600,
      height: 1067,
    })),
    ...overrides,
  };
}

describe("normalizeOne", () => {
  it("returns a valid NormalizedListing for a good listing", () => {
    const result = normalizeOne(makeRaw());
    expect(result).not.toBeNull();
    expect(result!.externalId).toBe("norm-001");
    expect(result!.source).toBe("realtor");
    expect(result!.city).toBe("Denver");
    expect(result!.state).toBe("CO");
    // Truth is the asking price, not the previous sale.
    expect(result!.listPrice).toBe(1_450_000);
    expect(result!.soldPrice).toBe(1_200_000);
    expect(result!.baths).toBe(3.5);
    expect(result!.photos).toHaveLength(8);
  });

  it("returns null for a rejected listing (too few photos)", () => {
    const result = normalizeOne(makeRaw({ photos: [{ href: "https://photos.example.com/0.jpg" }] }));
    expect(result).toBeNull();
  });

  it("returns null for a listing with no price", () => {
    const raw = makeRaw();
    raw.last_sold_price = undefined;
    raw.list_price = undefined;
    expect(normalizeOne(raw)).toBeNull();
  });

  it("maps photos to ordered array capped at 20", () => {
    const raw = makeRaw({
      photos: Array.from({ length: 25 }, (_, i) => ({
        href: `https://photos.example.com/${i}.jpg`,
      })),
    });
    const result = normalizeOne(raw);
    expect(result!.photos).toHaveLength(20);
    expect(result!.photos[0].ordering).toBe(0);
    expect(result!.photos[19].ordering).toBe(19);
  });

  it("parses soldDate correctly", () => {
    const result = normalizeOne(makeRaw({ last_sold_date: "2025-03-20" }));
    expect(result!.soldDate).toBeInstanceOf(Date);
    expect(result!.soldDate!.getFullYear()).toBe(2025);
  });

  it("handles missing baths_consolidated gracefully", () => {
    const raw = makeRaw();
    raw.description.baths_consolidated = undefined;
    const result = normalizeOne(raw);
    expect(result!.baths).toBe(0);
  });

  it("stores sourceUrl in each photo", () => {
    const result = normalizeOne(makeRaw());
    expect(result!.photos[0].sourceUrl).toBe("https://photos.example.com/0.jpg");
  });

  it("keeps list_price as truth and falls back soldPrice to it when there is no prior sale", () => {
    const raw = makeRaw({ last_sold_price: undefined, last_sold_date: undefined, list_price: 850_000 });
    const result = normalizeOne(raw);
    expect(result!.listPrice).toBe(850_000);
    expect(result!.soldPrice).toBe(850_000);
    expect(result!.soldDate).toBeUndefined();
  });

  it("returns null when list_price is missing even if a previous sale exists", () => {
    const raw = makeRaw({ list_price: undefined, last_sold_price: 900_000 });
    expect(normalizeOne(raw)).toBeNull();
  });

  it("does not reject listings whose previous sale is older than 24 months", () => {
    const result = normalizeOne(makeRaw({ last_sold_date: "2006-03-31" }));
    expect(result).not.toBeNull();
    expect(result!.listPrice).toBe(1_450_000);
  });
});
