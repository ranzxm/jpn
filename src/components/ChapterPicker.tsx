import { useEffect, useRef, useState } from "react";
import { formatChapterLabel } from "../data/vocab";

interface ChapterPickerProps {
  chapters: readonly number[];
  selected: readonly number[];
  onChange: (next: number[]) => void;
}

export function ChapterPicker({ chapters, selected, onChange }: ChapterPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isAll = selected.length === 0;
  const label = formatChapterLabel(selected);
  const rangeLabel =
    chapters.length > 1
      ? `${chapters[0]}–${chapters[chapters.length - 1]}`
      : String(chapters[0] ?? "");

  const toggleChapter = (chapter: number) => {
    const next = selected.includes(chapter)
      ? selected.filter((n) => n !== chapter)
      : [...selected, chapter].sort((a, b) => a - b);
    onChange(next.length >= chapters.length ? [] : next);
  };

  return (
    <div className="chapter-picker" ref={rootRef} data-chapter-picker="">
      <button
        ref={triggerRef}
        type="button"
        className={`chapter-chip${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Pilih bab kosakata: ${label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <svg
          className="chapter-chevron"
          viewBox="0 0 10 6"
          width="9"
          height="5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1.25L5 4.75L9 1.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="chapter-popover" role="group" aria-label="Pilih bab kosakata">
          <button
            type="button"
            className={`chapter-all-btn${isAll ? " is-active" : ""}`}
            aria-pressed={isAll}
            onClick={() => {
              if (!isAll) onChange([]);
            }}
          >
            <span>Semua bab</span>
            <span className="chapter-range">{rangeLabel}</span>
          </button>

          {/* ponytail: grid 5 kolom dengan max-height scroll; tambahkan search/grouping hanya jika bab > 40 */}
          <div className="chapter-grid">
            {chapters.map((ch) => {
              const active = selected.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  className={`chapter-cell${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  aria-label={`Bab ${ch}`}
                  onClick={() => toggleChapter(ch)}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
