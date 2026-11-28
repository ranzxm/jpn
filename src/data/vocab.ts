import { shuffleDeck } from "./kana";
import rawVocab from "./vocab.json";

export type Locale = "id" | "en";

export interface LocalizedText {
  id: string;
  en?: string;
}

interface RawVocabEntry {
  bab: number;
  display: string;
  kana: string;
  romaji: string;
  arti: LocalizedText;
  catatan?: LocalizedText;
}

export interface VocabCard extends RawVocabEntry {
  id: string;
}

export type RubySegment =
  | { type: "text"; text: string }
  | { type: "ruby"; base: string; rt: string };

// ponytail: satu file vocab.json (506 entri Bab 1–10); pecah per bab dengan import.meta.glob bila bab > 25 atau bundle terlalu besar
const chapterCounts = new Map<number, number>();

export const VOCAB_CARDS: readonly VocabCard[] = (rawVocab as RawVocabEntry[]).map((entry) => {
  const n = (chapterCounts.get(entry.bab) ?? 0) + 1;
  chapterCounts.set(entry.bab, n);
  return { ...entry, id: `v${entry.bab}-${n}` };
});

export const VOCAB_CHAPTERS: readonly number[] = [...chapterCounts.keys()].sort((a, b) => a - b);

const RUBY_RE = /\{([^|{}]+)\|([^|{}]+)\}/g;

export function parseRuby(display: string): RubySegment[] {
  const segments: RubySegment[] = [];
  let lastIndex = 0;

  for (const match of display.matchAll(RUBY_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", text: display.slice(lastIndex, index) });
    }
    segments.push({ type: "ruby", base: match[1], rt: match[2] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < display.length) {
    segments.push({ type: "text", text: display.slice(lastIndex) });
  }

  return segments;
}

export function stripRuby(display: string): string {
  return display.replace(RUBY_RE, "$1");
}

export function getVocabPool(selectedChapters: readonly number[]): readonly VocabCard[] {
  if (selectedChapters.length === 0) return VOCAB_CARDS;
  const set = new Set(selectedChapters);
  const filtered = VOCAB_CARDS.filter((c) => set.has(c.bab));
  return filtered.length > 0 ? filtered : VOCAB_CARDS;
}

export function createVocabDeck(
  selectedChapters: readonly number[],
  avoidFirstId?: string,
  rng: () => number = Math.random
): VocabCard[] {
  return shuffleDeck(getVocabPool(selectedChapters), avoidFirstId, rng);
}

export function formatChapterLabel(selectedChapters: readonly number[]): string {
  if (selectedChapters.length === 0 || selectedChapters.length >= VOCAB_CHAPTERS.length) {
    return "Semua bab";
  }
  const sorted = [...selectedChapters].sort((a, b) => a - b);
  if (sorted.length <= 3) return `Bab ${sorted.join(", ")}`;
  return `${sorted.length} bab`;
}
