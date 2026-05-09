import { describe, it, expect } from "vitest";
import { scoreGuess, tierFromErrorPct, formatPrice } from "@/lib/scoring";

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

describe("formatPrice", () => {
  it("formats dollar amounts cleanly", () => {
    expect(formatPrice(1_000_000)).toBe("$1,000,000");
    expect(formatPrice(750)).toBe("$750");
    expect(formatPrice(0)).toBe("$0");
  });
});
