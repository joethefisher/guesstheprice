import { describe, it, expect } from "vitest";
import { chunkGraphemes } from "../game";

describe("chunkGraphemes", () => {
  it("keeps surrogate-pair emoji intact — regression for share-card tofu bug", () => {
    // 🟩🟨🟧🟥🟥 is 5 emoji but 10 UTF-16 code units. Naive
    // .match(/.{1,5}/g) splits at code-unit 5 and cleaves 🟧 in half,
    // producing orphan surrogates that render as ? tofu on iOS/macOS.
    const s = "🟩🟨🟧🟥🟥";
    expect(s.length).toBe(10);
    expect(Array.from(s).length).toBe(5);
    expect(chunkGraphemes(s, 5)).toEqual(["🟩🟨🟧🟥🟥"]);
    expect(chunkGraphemes(s, 2)).toEqual(["🟩🟨", "🟧🟥", "🟥"]);
  });

  it("returns an empty array for empty input", () => {
    expect(chunkGraphemes("", 5)).toEqual([]);
  });

  it("chunks ASCII exactly like a code-unit split would", () => {
    expect(chunkGraphemes("hello world", 5)).toEqual(["hello", " worl", "d"]);
  });

  it("returns the whole string as one chunk when n >= length", () => {
    expect(chunkGraphemes("abc", 10)).toEqual(["abc"]);
  });
});
