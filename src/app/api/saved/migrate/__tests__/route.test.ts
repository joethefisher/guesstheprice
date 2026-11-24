import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const listingFindMany = vi.fn();
const savedCreate = vi.fn((args: unknown) => args);
const transaction = vi.fn(async (ops: unknown[]) => ops);
vi.mock("@/lib/db", () => ({
  prisma: {
    savedHome: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
      create: (a: unknown) => savedCreate(a),
    },
    listing: { findMany: (...a: unknown[]) => listingFindMany(...a) },
    $transaction: (ops: unknown[]) => transaction(ops),
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "u1" } })) }));

import { POST } from "../route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/saved/migrate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const item = (listingId: string) => ({
  listingId, guess: 400_000, tier: "solid", accuracy: 80, savedAt: 1_700_000_000_000,
});

describe("POST /api/saved/migrate (list-price truth)", () => {
  beforeEach(() => {
    listingFindMany.mockReset();
    savedCreate.mockClear();
  });

  it("stores actualPrice from listPrice, never from the body or soldPrice", async () => {
    listingFindMany.mockResolvedValue([{ id: "l1", listPrice: 500_000 }]);
    const res = await POST(req({ items: [{ ...item("l1"), actualPrice: 1 }] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ migrated: 1, skipped: 0 });
    const data = (savedCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(data.actualPrice).toBe(500_000);
    const select = (listingFindMany.mock.calls[0][0] as { select: Record<string, boolean> }).select;
    expect(select).toEqual({ id: true, listPrice: true });
  });

  it("migrates a scored save on a not-yet-backfilled listing with actualPrice null", async () => {
    listingFindMany.mockResolvedValue([{ id: "l1", listPrice: null }]);
    const res = await POST(req({ items: [item("l1")] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ migrated: 1, skipped: 0 });
    const data = (savedCreate.mock.calls[0][0] as { data: Record<string, unknown> }).data;
    expect(data.actualPrice).toBeNull();
    expect(data.guess).toBe(400_000);
  });
});
