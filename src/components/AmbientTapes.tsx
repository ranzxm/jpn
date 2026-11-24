import { memo, useEffect, useRef } from "react";
import { HIRAGANA, KATAKANA } from "../data/kana";

export type TapeTheme = "dark" | "light";
type TapeDepth = "back" | "mid" | "front";
type TapeSize = "sm" | "md" | "lg";
type TapeScript = "hira" | "kata";

interface TapeSpec {
  yFrac: number;
  cos: number;
  sin: number;
  dir: -1 | 1;
  speed: number;
  phase: number;
  depth: TapeDepth;
  size: TapeSize;
  script: TapeScript;
  spriteKey: string;
}

interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

interface DepthStyle {
  bg: string;
  border: string;
  text: string;
  shadow: string;
  blur: number;
  offsetY: number;
}

const COLUMN_WIDTH = 640;
const FRAME_MIN_MS = 13; // 60Hz full rate; halves 120Hz+ monitors cleanly without 60Hz jitter drops
const FONT_FAMILY = '"Noto Sans JP", "Yu Gothic UI", "Meiryo", sans-serif';

const HIRA_CHARS = HIRAGANA.map((c) => c.kana);
const KATA_CHARS = KATAKANA.map((c) => c.kana);

const SIZE_SPEC: Record<TapeSize, { height: number; fontSize: number; tracking: string; items: number }> = {
  sm: { height: 26, fontSize: 10, tracking: "0.28em", items: 32 },
  md: { height: 36, fontSize: 12, tracking: "0.22em", items: 28 },
  lg: { height: 48, fontSize: 15, tracking: "0.18em", items: 24 },
};

const PALETTE: Record<TapeTheme, { pageBg: string } & Record<TapeDepth, DepthStyle>> = {
  dark: {
    pageBg: "#09090b",
    back: { bg: "#0a0a0c", border: "#151518", text: "#1e1e23", shadow: "", blur: 0, offsetY: 0 },
    mid: { bg: "#0d0d10", border: "#1e1e23", text: "#2c2c33", shadow: "rgba(0,0,0,0.45)", blur: 10, offsetY: 3 },
    front: { bg: "#111115", border: "#27272d", text: "#3f3f46", shadow: "rgba(0,0,0,0.65)", blur: 16, offsetY: 5 },
  },
  light: {
    pageBg: "#ffffff",
    back: { bg: "#fcfcfd", border: "#f0f0f3", text: "#e2e2e7", shadow: "", blur: 0, offsetY: 0 },
    mid: { bg: "#f8f8fa", border: "#e5e5ea", text: "#c9cad1", shadow: "rgba(0,0,0,0.05)", blur: 10, offsetY: 3 },
    front: { bg: "#f4f4f6", border: "#d9d9e0", text: "#a1a1aa", shadow: "rgba(0,0,0,0.09)", blur: 14, offsetY: 4 },
  },
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (max: number) => Math.floor(Math.random() * max);

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function balancedFlags(count: number): boolean[] {
  const half = Math.floor(count / 2);
  const extra = count % 2 === 1 ? [Math.random() < 0.5] : [];
  return shuffle([...Array(half).fill(true), ...Array(half).fill(false), ...extra]);
}

// ponytail: 24 pita prosedural 3 lapis per reload, dirender di 1 canvas dengan sprite cached & clip luar kolom 640px
function createLayer(
  depth: TapeDepth,
  slots: ReadonlyArray<{ y: number; jitterY: number; deg: readonly [number, number] }>,
  sizes: readonly TapeSize[],
  speedRange: readonly [number, number],
): TapeSpec[] {
  const signFlip = Math.random() < 0.5 ? 1 : -1;
  const shuffledSizes = shuffle(sizes);
  const dirs = balancedFlags(slots.length);
  const scripts = balancedFlags(slots.length);

  return shuffle(
    slots.map((slot, i) => {
      const sign = (i % 2 === 0 ? 1 : -1) * signFlip;
      const rad = (rand(slot.deg[0], slot.deg[1]) * sign * Math.PI) / 180;
      const size = shuffledSizes[i];
      const script: TapeScript = scripts[i] ? "kata" : "hira";

      return {
        yFrac: (slot.y + rand(-slot.jitterY, slot.jitterY)) / 100,
        cos: Math.cos(rad),
        sin: Math.sin(rad),
        dir: dirs[i] ? -1 : 1,
        speed: rand(speedRange[0], speedRange[1]),
        phase: rand(0, 1200),
        depth,
        size,
        script,
        spriteKey: `${depth}:${size}:${script}`,
      };
    }),
  );
}

const TAPES: readonly TapeSpec[] = [
  ...createLayer(
    "back",
    [-2, 6, 14, 24, 34, 46, 55, 66, 76, 86, 96].map((y) => ({ y, jitterY: 2.5, deg: [7, 20] })),
    ["sm", "sm", "sm", "md", "md", "md", "md", "lg", "lg", "lg", "lg"],
    [24, 32],
  ),
  ...createLayer(
    "mid",
    [
      { y: 10, jitterY: 3, deg: [5, 11] },
      { y: 18, jitterY: 3, deg: [20, 32] },
      { y: 26, jitterY: 3, deg: [20, 32] },
      { y: 42, jitterY: 3, deg: [22, 34] },
      { y: 50, jitterY: 3, deg: [22, 34] },
      { y: 62, jitterY: 3, deg: [19, 31] },
      { y: 72, jitterY: 3, deg: [19, 30] },
      { y: 80, jitterY: 3, deg: [16, 27] },
    ],
    ["sm", "sm", "sm", "md", "md", "md", "lg", "lg"],
    [33, 42],
  ),
  ...createLayer(
    "front",
    [
      { y: 48, jitterY: 4, deg: [34, 43] },
      { y: 52, jitterY: 4, deg: [34, 43] },
      { y: 27, jitterY: 4, deg: [10, 20] },
      { y: 73, jitterY: 4, deg: [9, 18] },
      { y: 88, jitterY: 3, deg: [5, 12] },
    ],
    ["sm", "sm", "md", "lg", "lg"],
    [43, 54],
  ),
];

// Generate stable random text per unique sprite key once per reload
const SPRITE_TEXTS = new Map<string, { depth: TapeDepth; size: TapeSize; text: string }>();
for (const t of TAPES) {
  if (SPRITE_TEXTS.has(t.spriteKey)) continue;
  const chars = t.script === "kata" ? KATA_CHARS : HIRA_CHARS;
  const text = shuffle(chars)
    .slice(0, SIZE_SPEC[t.size].items)
    .map((ch) => `${ch} / `)
    .join("");
  SPRITE_TEXTS.set(t.spriteKey, { depth: t.depth, size: t.size, text });
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value;
  }
}

function buildSpriteCache(theme: TapeTheme, dpr: number): Map<string, Sprite> {
  const cache = new Map<string, Sprite>();
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) return cache;

  for (const [key, { depth, size, text }] of SPRITE_TEXTS) {
    const dim = SIZE_SPEC[size];
    const style = PALETTE[theme][depth];
    const font = `500 ${dim.fontSize}px ${FONT_FAMILY}`;
    mctx.font = font;
    setLetterSpacing(mctx, dim.tracking);
    const tileW = Math.max(400, Math.ceil(mctx.measureText(text).width));

    const padY = style.blur > 0 ? style.blur + style.offsetY + 2 : 0;
    const bandH = dim.height + padY * 2;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(tileW * dpr);
    canvas.height = Math.ceil(bandH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.scale(dpr, dpr);

    // Pre-bake strip fill & optional soft shadow (overdrawn horizontally so tile edges have zero seam)
    if (style.blur > 0) {
      ctx.shadowColor = style.shadow;
      ctx.shadowBlur = style.blur;
      ctx.shadowOffsetY = style.offsetY;
    }
    ctx.fillStyle = style.bg;
    ctx.fillRect(-padY * 2 - 4, padY, tileW + padY * 4 + 8, dim.height);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Top & bottom 1px borders
    ctx.fillStyle = style.border;
    ctx.fillRect(0, padY, tileW, 1);
    ctx.fillRect(0, padY + dim.height - 1, tileW, 1);

    // Kana text
    ctx.font = font;
    setLetterSpacing(ctx, dim.tracking);
    ctx.fillStyle = style.text;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, padY + dim.height / 2 + 0.5);

    cache.set(key, { canvas, w: tileW, h: bandH });
  }

  return cache;
}

export const AmbientTapes = memo(function AmbientTapes({ theme }: { theme: TapeTheme }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<TapeTheme>(theme);
  const rebuildRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = theme;
    rebuildRef.current?.();
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let sprites = new Map<string, Sprite>();
    let rafId = 0;
    let elapsedSec = 0;
    let lastFrameMs = 0;
    let disposed = false;

    const draw = () => {
      const sideW = Math.floor((width - COLUMN_WIDTH) / 2);
      if (sideW <= 0 || height <= 0) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clip strictly to left & right side strips; skip the 640px opaque center column completely
      ctx.beginPath();
      ctx.rect(0, 0, sideW, height);
      ctx.rect(width - sideW, 0, sideW, height);
      ctx.clip();

      ctx.fillStyle = PALETTE[themeRef.current].pageBg;
      ctx.fillRect(0, 0, sideW, height);
      ctx.fillRect(width - sideW, 0, sideW, height);

      const cx = width * 0.5;
      for (let i = 0; i < TAPES.length; i++) {
        const tape = TAPES[i];
        const sprite = sprites.get(tape.spriteKey);
        if (!sprite) continue;

        const tileW = sprite.w;
        const halfSpan = cx / tape.cos + sprite.h;
        const rawShift = tape.phase + tape.dir * elapsedSec * tape.speed;
        const shift = ((rawShift % tileW) + tileW) % tileW;

        ctx.setTransform(
          tape.cos * dpr,
          tape.sin * dpr,
          -tape.sin * dpr,
          tape.cos * dpr,
          cx * dpr,
          tape.yFrac * height * dpr,
        );

        const yTop = -sprite.h * 0.5;
        const startX = shift + Math.floor((-halfSpan - shift) / tileW) * tileW;
        for (let x = startX; x < halfSpan; x += tileW) {
          ctx.drawImage(sprite.canvas, x, yTop, tileW, sprite.h);
        }
      }

      ctx.restore();
    };

    const stopLoop = () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (disposed || document.hidden || motionQuery.matches || width <= COLUMN_WIDTH) return;

      const dt = lastFrameMs === 0 ? 0 : now - lastFrameMs;
      if (lastFrameMs === 0 || dt >= FRAME_MIN_MS) {
        elapsedSec += Math.min(dt, 100) / 1000;
        lastFrameMs = now;
        draw();
      }
      rafId = requestAnimationFrame(tick);
    };

    const startOrRenderOnce = () => {
      stopLoop();
      if (disposed || width <= COLUMN_WIDTH) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      draw();
      if (!motionQuery.matches && !document.hidden) {
        lastFrameMs = 0;
        rafId = requestAnimationFrame(tick);
      }
    };

    const rebuildSprites = () => {
      if (disposed) return;
      sprites = buildSpriteCache(themeRef.current, dpr);
      draw();
    };

    const resize = () => {
      const nextW = canvas.clientWidth || window.innerWidth;
      const nextH = canvas.clientHeight || window.innerHeight;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const dprChanged = nextDpr !== dpr;

      width = nextW;
      height = nextH;
      dpr = nextDpr;

      if (width <= COLUMN_WIDTH) {
        canvas.width = 0;
        canvas.height = 0;
        stopLoop();
        return;
      }

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      if (dprChanged || sprites.size === 0) {
        sprites = buildSpriteCache(themeRef.current, dpr);
      }
      startOrRenderOnce();
    };

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startOrRenderOnce();
    };

    const onMotionChange = () => startOrRenderOnce();

    rebuildRef.current = rebuildSprites;
    resize();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);
    document.fonts?.ready.then(() => {
      if (!disposed && width > COLUMN_WIDTH) rebuildSprites();
    });

    return () => {
      disposed = true;
      rebuildRef.current = null;
      stopLoop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-bg" aria-hidden="true" />;
});
