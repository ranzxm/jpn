import { useCallback, useEffect, useState } from "react";
import { AmbientTapes } from "./components/AmbientTapes";
import { Flashcard } from "./components/Flashcard";
import { createShuffledDeck, type KanaCard, type ScriptFilter } from "./data/kana";

type Theme = "dark" | "light";

const FILTERS: ReadonlyArray<{ id: ScriptFilter; label: string }> = [
  { id: "hiragana", label: "Hiragana" },
  { id: "katakana", label: "Katakana" },
  { id: "all", label: "Semua" },
];

function FilterIcon({ id }: { id: ScriptFilter }) {
  if (id === "hiragana") return <span className="seg-glyph" lang="ja" aria-hidden="true">あ</span>;
  if (id === "katakana") return <span className="seg-glyph" lang="ja" aria-hidden="true">ア</span>;
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="2.25" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.25" y="9.25" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="9.25" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [filter, setFilter] = useState<ScriptFilter>("hiragana");
  const [deckState, setDeckState] = useState<{ cards: KanaCard[]; index: number }>(() => ({
    cards: createShuffledDeck("hiragana"),
    index: 0,
  }));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleFilterChange = (next: ScriptFilter) => {
    if (next === filter) return;
    setFilter(next);
    setDeckState({ cards: createShuffledDeck(next), index: 0 });
  };

  const handleNext = useCallback(() => {
    setDeckState((prev) => {
      if (prev.index + 1 < prev.cards.length) {
        return { ...prev, index: prev.index + 1 };
      }
      const lastId = prev.cards[prev.index]?.id;
      return { cards: createShuffledDeck(filter, lastId), index: 0 };
    });
  }, [filter]);

  const { cards, index } = deckState;
  const current = cards[index];

  return (
    <div className="page">
      <AmbientTapes theme={theme} />

      <div className="column">
        <header className="header">
          <h1 className="title">Learning Japanese.</h1>

          <div className="controls">
            <div className="segmented" role="group" aria-label="Pilih huruf">
              {FILTERS.map((f) => {
                const active = f.id === filter;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`seg-btn${active ? " is-active" : ""}`}
                    aria-label={f.label}
                    aria-pressed={active}
                    title={f.label}
                    onClick={() => handleFilterChange(f.id)}
                  >
                    <FilterIcon id={f.id} />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="theme-btn"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                  <path
                    d="M8 1.5V3M8 13V14.5M3.4 3.4L4.46 4.46M11.54 11.54L12.6 12.6M1.5 8H3M13 8H14.5M3.4 12.6L4.46 11.54M11.54 4.46L12.6 3.4M11 8A3 3 0 1 1 5 8A3 3 0 1 1 11 8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                  <path
                    d="M13.2 9.8A5.5 5.5 0 0 1 6.2 2.8A5.5 5.5 0 1 0 13.2 9.8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="stage">
          <Flashcard card={current} onNext={handleNext} />
        </main>
      </div>
    </div>
  );
}
