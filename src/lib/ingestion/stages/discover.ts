import { promises as fs } from "fs";
import path from "path";
import type { Market } from "../types";

const MARKETS_PATH = path.resolve(process.cwd(), "data/target-markets.json");

export async function loadMarkets(): Promise<Market[]> {
  const raw = await fs.readFile(MARKETS_PATH, "utf-8");
  return JSON.parse(raw) as Market[];
}

export interface MarketPlan {
  market: Market;
  quota: number;
}

export function planDistribution(markets: Market[], totalQuota: number): MarketPlan[] {
  const totalWeight = markets.reduce((s, m) => s + m.weight, 0);
  return markets.map((market) => ({
    market,
    quota: Math.max(20, Math.round((market.weight / totalWeight) * totalQuota)),
  }));
}

export async function runDiscover(totalQuota = 10_000): Promise<MarketPlan[]> {
  const markets = await loadMarkets();
  const plan = planDistribution(markets, totalQuota);

  console.log("\n── Stage 1: Discover ──────────────────────────────");
  console.log(`Markets: ${markets.length}`);

  const byTier = { metro: 0, secondary: 0, luxury: 0 };
  plan.forEach((p) => { byTier[p.market.tier] += p.quota; });

  console.log(`Planned distribution:`);
  console.log(`  Metro:     ${byTier.metro.toLocaleString()} listings`);
  console.log(`  Secondary: ${byTier.secondary.toLocaleString()} listings`);
  console.log(`  Luxury:    ${byTier.luxury.toLocaleString()} listings`);
  console.log(`  Total:     ${Object.values(byTier).reduce((a, b) => a + b, 0).toLocaleString()} listings\n`);

  plan
    .sort((a, b) => b.quota - a.quota)
    .slice(0, 10)
    .forEach((p) => {
      console.log(`  ${p.market.city}, ${p.market.state} (${p.market.tier}): ${p.quota}`);
    });

  if (plan.length > 10) console.log(`  … and ${plan.length - 10} more markets\n`);

  return plan;
}
