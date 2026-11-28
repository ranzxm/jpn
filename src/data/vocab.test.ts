import { describe, expect, test } from "bun:test";
import {
  createVocabDeck,
  formatChapterLabel,
  getVocabPool,
  parseRuby,
  stripRuby,
  VOCAB_CARDS,
  VOCAB_CHAPTERS,
} from "./vocab";

const KANJI_RE = /[\u4e00-\u9faf々ヶ]/;
const OCR_ARTIFACT_RE = /\*|\[ragu:|diragukan|tidak terbaca|fiksi/i;

describe("vocab dataset, ruby parser & chapter deck", () => {
  test("contains chapters 1-10 with unique IDs and zero unannotated kanji or OCR artifacts", () => {
    expect(VOCAB_CHAPTERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(VOCAB_CARDS).toHaveLength(506);

    const ids = new Set<string>();
    for (const card of VOCAB_CARDS) {
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      // Every kanji in display must live inside {base|rt}
      const outsideRuby = card.display.replace(/\{[^|{}]+\|[^|{}]+\}/g, "");
      expect(KANJI_RE.test(outsideRuby)).toBe(false);

      // Every ruby segment must have non-empty base & kana reading
      for (const seg of parseRuby(card.display)) {
        if (seg.type === "ruby") {
          expect(seg.base.length).toBeGreaterThan(0);
          expect(seg.rt.length).toBeGreaterThan(0);
          expect(KANJI_RE.test(seg.rt)).toBe(false);
        }
      }

      // Clean romaji, arti, and no leftover OCR noise or fictional book entries
      expect(card.romaji.trim().length).toBeGreaterThan(0);
      expect(/[^\x20-\x7E]/.test(card.romaji)).toBe(false);
      expect(card.arti.id.trim().length).toBeGreaterThan(0);
      expect(OCR_ARTIFACT_RE.test(card.display)).toBe(false);
      expect(OCR_ARTIFACT_RE.test(card.arti.id)).toBe(false);
      if (card.catatan) {
        expect(OCR_ARTIFACT_RE.test(card.catatan.id)).toBe(false);
      }
    }
  });

  test("parseRuby and stripRuby handle plain kana, single ruby, and multi-ruby words", () => {
    expect(parseRuby("ありがとう")).toEqual([{ type: "text", text: "ありがとう" }]);
    expect(parseRuby("{食|た}べます")).toEqual([
      { type: "ruby", base: "食", rt: "た" },
      { type: "text", text: "べます" },
    ]);
    expect(parseRuby("{食|た}べ{物|もの}")).toEqual([
      { type: "ruby", base: "食", rt: "た" },
      { type: "text", text: "べ" },
      { type: "ruby", base: "物", rt: "もの" },
    ]);
    expect(stripRuby("{撮|と}ります［{写真|しゃしん}を～］")).toBe("撮ります［写真を～］");
  });

  test("chapter filtering and shuffled deck preserve cards and honor avoidFirstId", () => {
    expect(getVocabPool([])).toHaveLength(VOCAB_CARDS.length);

    const ch1and8 = getVocabPool([1, 8]);
    expect(ch1and8.length).toBeGreaterThan(0);
    expect(ch1and8.every((c) => c.bab === 1 || c.bab === 8)).toBe(true);

    const deck = createVocabDeck([1, 8], ch1and8[0].id, () => 0);
    expect(deck).toHaveLength(ch1and8.length);
    expect(deck[0].id).not.toBe(ch1and8[0].id);
  });

  test("formatChapterLabel summarizes all, up to 3, and 4+ selected chapters", () => {
    expect(formatChapterLabel([])).toBe("Semua bab");
    expect(formatChapterLabel([1])).toBe("Bab 1");
    expect(formatChapterLabel([6, 1, 3])).toBe("Bab 1, 3, 6");
    expect(formatChapterLabel([1, 2, 3, 4])).toBe("4 bab");
    expect(formatChapterLabel(VOCAB_CHAPTERS)).toBe("Semua bab");
  });
});
