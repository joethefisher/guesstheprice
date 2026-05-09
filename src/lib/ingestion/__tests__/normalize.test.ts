import { describe, it, expect } from "vitest";
import { normalizeOne } from "../stages/normalize";
import type { RawListing } from "../types";

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
    const result = normalizeOne(makeRaw({ last_sold_date: "2023-03-20" }));
    expect(result!.soldDate).toBeInstanceOf(Date);
    expect(result!.soldDate!.getFullYear()).toBe(2023);
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

  it("uses list_price when last_sold_price is absent", () => {
    const raw = makeRaw({ last_sold_price: undefined, list_price: 850_000 });
    const result = normalizeOne(raw);
    expect(result!.soldPrice).toBe(850_000);
  });
});
