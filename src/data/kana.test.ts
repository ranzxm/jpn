import { describe, expect, test } from "bun:test";
import { ALL_KANA, createShuffledDeck, getPool, HIRAGANA, KATAKANA } from "./kana";

describe("kana dataset & shuffled deck", () => {
  test("contains exact 104 Hiragana, 104 Katakana, and 208 unique kana (gojuon + dakuten/handakuten + yoon)", () => {
    expect(HIRAGANA).toHaveLength(104);
    expect(KATAKANA).toHaveLength(104);
    expect(ALL_KANA).toHaveLength(208);

    const uniqueIds = new Set(ALL_KANA.map((c) => c.id));
    const uniqueGlyphs = new Set(ALL_KANA.map((c) => c.kana));
    expect(uniqueIds.size).toBe(208);
    expect(uniqueGlyphs.size).toBe(208);

    const byKana = new Map(ALL_KANA.map((c) => [c.kana, c]));
    expect(byKana.get("が")?.romaji).toBe("ga");
    expect(byKana.get("ぱ")?.romaji).toBe("pa");
    expect(byKana.get("じ")?.romaji).toBe("ji");
    expect(byKana.get("ぢ")?.romaji).toBe("ji");
    expect(byKana.get("じ")?.id).not.toBe(byKana.get("ぢ")?.id);
    expect(byKana.get("ず")?.id).not.toBe(byKana.get("づ")?.id);
    expect(byKana.get("きゃ")?.romaji).toBe("kya");
    expect(byKana.get("ピョ")?.romaji).toBe("pyo");
  });

  test("createShuffledDeck preserves all cards for each filter without loss or duplication", () => {
    for (const filter of ["hiragana", "katakana", "all"] as const) {
      const pool = getPool(filter);
      const deck = createShuffledDeck(filter);
      expect(deck).toHaveLength(pool.length);
      expect(new Set(deck.map((c) => c.id))).toEqual(new Set(pool.map((c) => c.id)));
    }
  });

  test("avoidFirstId guarantees new cycle does not immediately repeat previous card", () => {
    const firstCard = HIRAGANA[0];
    // Deterministic rng returning 0 would otherwise keep firstCard at index 0
    const deck = createShuffledDeck("hiragana", firstCard.id, () => 0);
    expect(deck[0].id).not.toBe(firstCard.id);
    expect(deck).toHaveLength(104);
  });
});
