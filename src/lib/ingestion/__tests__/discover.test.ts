import { describe, it, expect } from "vitest";
import { planDistribution } from "../stages/discover";
import type { Market } from "../types";

const MARKETS: Market[] = [
  { city: "New York",    state: "NY", tier: "metro",     weight: 1.0 },
  { city: "Austin",      state: "TX", tier: "metro",     weight: 0.9 },
  { city: "Buffalo",     state: "NY", tier: "secondary", weight: 0.6 },
  { city: "Aspen",       state: "CO", tier: "luxury",    weight: 0.25 },
  { city: "Palm Beach",  state: "FL", tier: "luxury",    weight: 0.3 },
];

describe("planDistribution", () => {
  it("distributes quota proportionally to weight", () => {
    const plan = planDistribution(MARKETS, 1000);
    const ny = plan.find((p) => p.market.city === "New York")!;
    const buffalo = plan.find((p) => p.market.city === "Buffalo")!;
    expect(ny.quota).toBeGreaterThan(buffalo.quota);
  });

  it("never assigns fewer than 20 per market", () => {
    const plan = planDistribution(MARKETS, 100);
    for (const p of plan) {
      expect(p.quota).toBeGreaterThanOrEqual(20);
    }
  });

  it("returns a plan entry for every market", () => {
    const plan = planDistribution(MARKETS, 1000);
    expect(plan).toHaveLength(MARKETS.length);
  });

  it("luxury markets get less quota than metro", () => {
    const plan = planDistribution(MARKETS, 5000);
    const aspen = plan.find((p) => p.market.city === "Aspen")!;
    const ny = plan.find((p) => p.market.city === "New York")!;
    expect(aspen.quota).toBeLessThan(ny.quota);
  });

  it("total quota is approximately correct (within 10%)", () => {
    const targetQuota = 10_000;
    const plan = planDistribution(MARKETS, targetQuota);
    const total = plan.reduce((s, p) => s + p.quota, 0);
    expect(total).toBeGreaterThanOrEqual(targetQuota * 0.9);
    expect(total).toBeLessThanOrEqual(targetQuota * 1.1 + MARKETS.length * 20);
  });
});
