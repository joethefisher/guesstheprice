import { describe, it, expect } from "vitest";
import {
  scoreGuess,
  tierFromErrorPct,
  formatPrice,
  accuracyFromGuess,
  computeGameAggregates,
  type RoundForAggregate,
} from "@/lib/scoring";

describe("scoreGuess", () => {
  it("perfect guess returns 100", () => {
    const r = scoreGuess(1_000_000, 1_000_000);
    expect(r.score).toBe(100);
    expect(r.tier).toBe("expert");
    expect(r.errorDollars).toBe(0);
  });

  it("5% over returns 95", () => {
    const r = scoreGuess(1_050_000, 1_000_000);
    expect(r.score).toBe(95);
    expect(r.tier).toBe("nailed");
    expect(r.errorDollars).toBe(50_000);
  });

  it("50% under returns 50", () => {
    const r = scoreGuess(500_000, 1_000_000);
    expect(r.score).toBe(50);
    expect(r.tier).toBe("off");
    expect(r.errorDollars).toBe(-500_000);
  });

  it("100% over caps at 0", () => {
    const r = scoreGuess(2_000_000, 1_000_000);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("yikes");
  });

  it("wildly over also caps at 0", () => {
    const r = scoreGuess(50_000_000, 1_000_000);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("yikes");
  });

  it("symmetric — same error % over vs under gets same score", () => {
    const over = scoreGuess(1_200_000, 1_000_000);
    const under = scoreGuess(800_000, 1_000_000);
    expect(over.score).toBe(under.score);
  });

  it("throws on zero or negative actual", () => {
    expect(() => scoreGuess(100, 0)).toThrow();
    expect(() => scoreGuess(100, -1)).toThrow();
  });

  it("throws on negative guess", () => {
    expect(() => scoreGuess(-100, 100)).toThrow();
  });
});

describe("tierFromErrorPct", () => {
  it("tier boundaries", () => {
    expect(tierFromErrorPct(0)).toBe("expert");
    expect(tierFromErrorPct(0.02)).toBe("expert");
    expect(tierFromErrorPct(0.021)).toBe("nailed");
    expect(tierFromErrorPct(0.05)).toBe("nailed");
    expect(tierFromErrorPct(0.10)).toBe("solid");
    expect(tierFromErrorPct(0.15)).toBe("solid");
    expect(tierFromErrorPct(0.25)).toBe("ballpark");
    expect(tierFromErrorPct(0.40)).toBe("off");
    expect(tierFromErrorPct(0.99)).toBe("yikes");
  });
});

describe("accuracyFromGuess", () => {
  it("perfect guess returns 1", () => {
    expect(accuracyFromGuess(1_000_000, 1_000_000)).toBe(1);
  });

  it("50% over returns 0.5", () => {
    expect(accuracyFromGuess(1_500_000, 1_000_000)).toBeCloseTo(0.5, 5);
  });

  it("50% under returns 0.5 (symmetric)", () => {
    expect(accuracyFromGuess(500_000, 1_000_000)).toBeCloseTo(0.5, 5);
  });

  it("100% over clamps to 0", () => {
    expect(accuracyFromGuess(2_000_000, 1_000_000)).toBe(0);
  });

  it("wildly over still clamps to 0 (never negative)", () => {
    expect(accuracyFromGuess(50_000_000, 1_000_000)).toBe(0);
  });

  it("zero actual returns 0 instead of throwing", () => {
    expect(accuracyFromGuess(100, 0)).toBe(0);
  });

  it("matches score/100 for any non-clamped guess", () => {
    const cases = [
      [1_000_000, 1_000_000],
      [1_050_000, 1_000_000],
      [800_000, 1_000_000],
      [1_300_000, 1_000_000],
    ];
    for (const [g, a] of cases) {
      expect(accuracyFromGuess(g, a)).toBeCloseTo(scoreGuess(g, a).score / 100, 5);
    }
  });
});

describe("computeGameAggregates", () => {
  function r(over: Partial<RoundForAggregate> = {}): RoundForAggregate {
    return { score: 80, accuracy: 0.8, guess: 900_000, soldPrice: 1_000_000, ...over };
  }

  it("returns all-nulls for a game with no finished rounds", () => {
    const agg = computeGameAggregates([
      { score: null, accuracy: null, guess: null, soldPrice: 1_000_000 },
      { score: null, accuracy: null, guess: 500_000, soldPrice: 1_000_000 },
    ]);
    expect(agg).toEqual({
      avgAccuracy: null,
      avgErrorPct: null,
      bestRoundScore: null,
      worstRoundScore: null,
      bestRoundAcc: null,
    });
  });

  it("computes best/worst score and avg accuracy across finished rounds", () => {
    const agg = computeGameAggregates([
      r({ score: 100, accuracy: 1 }),
      r({ score: 50, accuracy: 0.5 }),
      r({ score: 75, accuracy: 0.75 }),
    ]);
    expect(agg.bestRoundScore).toBe(100);
    expect(agg.worstRoundScore).toBe(50);
    expect(agg.bestRoundAcc).toBe(1);
    expect(agg.avgAccuracy).toBeCloseTo(0.75, 5);
  });

  it("computes avg error % from guess and soldPrice", () => {
    // 10%, 30%, 20% => avg 20%
    const agg = computeGameAggregates([
      r({ guess: 1_100_000, soldPrice: 1_000_000 }),
      r({ guess: 700_000, soldPrice: 1_000_000 }),
      r({ guess: 1_200_000, soldPrice: 1_000_000 }),
    ]);
    expect(agg.avgErrorPct).toBeCloseTo(0.2, 5);
  });

  it("ignores rounds with null guess or zero soldPrice when computing errorPct", () => {
    const agg = computeGameAggregates([
      r({ score: 100, accuracy: 1, guess: 1_000_000, soldPrice: 1_000_000 }),
      r({ score: 50, accuracy: 0.5, guess: null, soldPrice: 1_000_000 }),
      r({ score: 0, accuracy: 0, guess: 0, soldPrice: 0 }),
    ]);
    // Only the first round contributes to errorPct.
    expect(agg.avgErrorPct).toBe(0);
    // But all three with non-null accuracy contribute to avgAccuracy.
    expect(agg.avgAccuracy).toBeCloseTo(0.5, 5);
  });

  it("excludes unfinished rounds (null score) from min/max/avg", () => {
    const agg = computeGameAggregates([
      r({ score: 100, accuracy: 1 }),
      { score: null, accuracy: null, guess: null, soldPrice: 1_000_000 },
    ]);
    expect(agg.bestRoundScore).toBe(100);
    expect(agg.worstRoundScore).toBe(100);
    expect(agg.avgAccuracy).toBe(1);
  });
});

describe("formatPrice", () => {
  it("formats dollar amounts cleanly", () => {
    expect(formatPrice(1_000_000)).toBe("$1,000,000");
    expect(formatPrice(750)).toBe("$750");
    expect(formatPrice(0)).toBe("$0");
  });
});
