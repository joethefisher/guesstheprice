import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    listing: { findUnique: (...a: unknown[]) => findUnique(...a) },
    game: { findUnique: vi.fn() },
    round: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { POST } from "../route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/score", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const base = {
  id: "l1", city: "Austin", state: "TX", streetAddress: "1 Main St",
  latitude: null, longitude: null, photos: [],
};

describe("POST /api/score", () => {
  beforeEach(() => findUnique.mockReset());

  it("scores against listPrice, not the previous sale", async () => {
    findUnique.mockResolvedValue({ ...base, listPrice: 500_000, soldPrice: 250_000 });
    const res = await POST(req({ listingId: "l1", guess: 500_000 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.actualPrice).toBe(500_000);
    expect(json.errorPct).toBe(0);
  });

  it("refuses listings with no listPrice instead of falling back to soldPrice", async () => {
    findUnique.mockResolvedValue({ ...base, listPrice: null, soldPrice: 250_000 });
    const res = await POST(req({ listingId: "l1", guess: 250_000 }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.actualPrice).toBeUndefined();
  });
});
