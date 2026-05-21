import { describe, it, expect } from "vitest";
import {
  centroidFromExact,
  buildMapBlock,
  DEFAULT_NEIGHBORHOOD_ZOOM,
} from "@/lib/map";

describe("centroidFromExact", () => {
  it("snaps lat/lng to the center of a 0.01° cell", () => {
    const c = centroidFromExact(40.748817, -73.985428); // Empire State Building
    expect(c.lat).toBeCloseTo(40.745, 5);
    expect(c.lng).toBeCloseTo(-73.985, 5); // floor(-7398.5428)/100 + 0.005 = -73.99 + 0.005 = -73.985
  });

  it("is deterministic for the same input", () => {
    const a = centroidFromExact(34.0522, -118.2437);
    const b = centroidFromExact(34.0522, -118.2437);
    expect(a).toEqual(b);
  });

  it("returns a centroid offset from the exact location", () => {
    // The point: a client reading the centroid cannot recover the exact pin.
    const exact = { lat: 40.7128, lng: -74.0060 };
    const centroid = centroidFromExact(exact.lat, exact.lng);
    expect(centroid).not.toEqual(exact);
    // But it should be within ~1.5 km
    const latDiff = Math.abs(centroid.lat - exact.lat);
    const lngDiff = Math.abs(centroid.lng - exact.lng);
    expect(latDiff).toBeLessThan(0.015);
    expect(lngDiff).toBeLessThan(0.015);
  });

  it("works in the southern hemisphere", () => {
    const c = centroidFromExact(-33.8688, 151.2093); // Sydney
    expect(c.lat).toBeGreaterThan(-34);
    expect(c.lat).toBeLessThan(-33);
    expect(c.lng).toBeGreaterThan(151);
    expect(c.lng).toBeLessThan(152);
  });
});

describe("buildMapBlock", () => {
  it("returns null when lat or lng is null", () => {
    expect(buildMapBlock(null, -73.98)).toBeNull();
    expect(buildMapBlock(40.7, null)).toBeNull();
    expect(buildMapBlock(null, null)).toBeNull();
  });

  it("returns a MapBlock with snapped centroid and default zoom", () => {
    const block = buildMapBlock(40.748817, -73.985428);
    expect(block).not.toBeNull();
    expect(block!.zoom).toBe(DEFAULT_NEIGHBORHOOD_ZOOM);
    expect(block!.centroid.lat).toBeCloseTo(40.745, 5);
  });
});
