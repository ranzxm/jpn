import { useCallback, useEffect, useRef, useState } from "react";
import type { KanaCard } from "../data/kana";

interface FlashcardProps {
  card: KanaCard;
  onNext: () => void;
}

const TAP_MAX_PX = 8;
const SWIPE_DISTANCE_PX = 85;
const FLICK_MIN_PX = 36;
const FLICK_VELOCITY = 0.45;
const EXIT_DURATION_MS = 180;

export function Flashcard({ card, onNext }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<-1 | 0 | 1>(0);

  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    moved: boolean;
  } | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const triggerSwipeNext = useCallback(
    (dir: -1 | 1) => {
      if (exitDir !== 0) return;
      setIsDragging(false);
      setExitDir(dir);
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        setFlipped(false);
        setDragX(0);
        setExitDir(0);
        onNext();
      }, EXIT_DURATION_MS);
    },
    [exitDir, onNext]
  );

  // Reset visual state whenever deck filter swaps card externally
  useEffect(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setFlipped(false);
    setDragX(0);
    setIsDragging(false);
    setExitDir(0);
  }, [card.id]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const inHeaderControl = e.target instanceof Element && e.target.closest("header") !== null;

      if (e.code === "Space" && !inHeaderControl) {
        e.preventDefault();
        if (exitDir === 0) setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        triggerSwipeNext(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerSwipeNext(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitDir, triggerSwipeNext]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitDir !== 0 || (e.pointerType === "mouse" && e.button !== 0)) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or non-capturable pointers fall back to in-element tracking
    }
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && (Math.abs(dx) > TAP_MAX_PX || Math.abs(dy) > TAP_MAX_PX)) {
      g.moved = true;
    }
    if (g.moved) {
      setDragX(dx);
    }
  };

  const finishGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gestureRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture was never active
    }

    if (cancelled) {
      setIsDragging(false);
      setDragX(0);
      return;
    }

    const dx = e.clientX - g.startX;
    const elapsed = Math.max(1, performance.now() - g.startTime);
    const velocity = Math.abs(dx) / elapsed;

    if (!g.moved) {
      setIsDragging(false);
      setDragX(0);
      setFlipped((f) => !f);
      return;
    }

    const shouldAdvance =
      Math.abs(dx) >= SWIPE_DISTANCE_PX ||
      (Math.abs(dx) >= FLICK_MIN_PX && velocity >= FLICK_VELOCITY);

    if (shouldAdvance) {
      triggerSwipeNext(dx >= 0 ? 1 : -1);
    } else {
      setIsDragging(false);
      setDragX(0);
    }
  };

  const offsetX = exitDir !== 0 ? exitDir * 440 : dragX;
  const rotation = offsetX * 0.032;
  const opacity = exitDir !== 0 ? 0 : Math.max(0.35, 1 - Math.abs(dragX) / 380);

  return (
    <div
      key={card.id}
      className={`card-wrap${isDragging ? " is-dragging" : ""}${exitDir !== 0 ? " is-exiting" : ""}`}
      style={{
        transform: `translate3d(${offsetX}px, 0, 0) rotate(${rotation}deg)`,
        opacity,
      }}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? `${card.kana}, romaji ${card.romaji}` : card.kana}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => finishGesture(e, false)}
      onPointerCancel={(e) => finishGesture(e, true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (exitDir === 0) setFlipped((f) => !f);
        }
      }}
    >
      <div className={`card-inner${flipped ? " is-flipped" : ""}`}>
        <div className="card-face card-front" aria-hidden={flipped}>
          <span className={`card-glyph${card.kana.length > 1 ? " is-combo" : ""}`} lang="ja">
            {card.kana}
          </span>
        </div>

        <div className="card-face card-back" aria-hidden={!flipped}>
          <div className="card-answer">
            <span className="card-romaji">{card.romaji}</span>
            <span className="card-ref" lang="ja">
              {card.kana}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
