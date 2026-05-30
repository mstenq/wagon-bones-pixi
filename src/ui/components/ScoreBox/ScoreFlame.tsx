import { useEffect, useRef, type CSSProperties } from "react";

import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";
import { scoreBoxVariantTheme } from "@/ui/components/ScoreBox/scoreBoxTheme";
import { clampFlameIntensity } from "@/ui/components/ScoreBox/scoreFlame";

export type ScoreFlameProps = {
  variant: ScoreBoxVariant;
  /** 0–1 intensity from game logic; 0 hides flames. */
  intensity: number;
};

const FIRE_CELL_SIZE = 2;
const FIRE_DEPTH = 20;
const FIRE_WIND_CHOICES = [-2, -1, -1, 0, 0, 0, 1, 1, 2];

type Rgb = readonly [number, number, number];

const BASE_FIRE_PALETTES: Record<ScoreBoxVariant, readonly Rgb[]> = {
  points: [
    [7, 14, 40],
    [11, 35, 79],
    [15, 66, 122],
    [22, 102, 179],
    [44, 141, 214],
    [70, 183, 238],
    [128, 222, 255],
    [204, 244, 255],
    [255, 255, 255],
  ],
  mult: [
    [27, 7, 16],
    [68, 8, 26],
    [112, 14, 32],
    [168, 27, 36],
    [220, 48, 44],
    [245, 86, 54],
    [255, 133, 69],
    [255, 180, 110],
    [255, 231, 182],
  ],
};

type FlameRuntime = {
  cols: number;
  rows: number;
  values: Uint8Array;
  nextValues: Uint8Array;
  palette: string[];
  surfaceColor: string;
  cellSize: number;
  dpr: number;
  phase: number;
};

function buildPalette(
  variant: ScoreBoxVariant,
  intensity: number,
  surfaceRgb: readonly [number, number, number],
): string[] {
  const source = BASE_FIRE_PALETTES[variant];
  const maxAlpha = 0.74 + intensity * 0.26;
  const lowAlpha = 0.18 + intensity * 0.1;
  const palette: string[] = [];
  const [sr, sg, sb] = surfaceRgb;

  for (let index = 0; index < FIRE_DEPTH; index += 1) {
    const t = index / (FIRE_DEPTH - 1);
    if (index <= 2) {
      const baseAlpha = index === 0 ? 1 : index === 1 ? 0.96 : 0.88;
      palette.push(`rgba(${sr}, ${sg}, ${sb}, ${baseAlpha.toFixed(2)})`);
      continue;
    }

    const rampIndex = Math.min(
      source.length - 1,
      Math.floor(t * (source.length - 1)),
    );
    const [r, g, b] = source[rampIndex] ?? source[source.length - 1] ?? [255, 255, 255];
    const alpha = lowAlpha + (maxAlpha - lowAlpha) * t;
    palette.push(`rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`);
  }

  return palette;
}

function createRuntime(
  widthCssPx: number,
  heightCssPx: number,
  dpr: number,
  palette: string[],
  surfaceColor: string,
): FlameRuntime {
  const cellSize = Math.max(2, Math.round(FIRE_CELL_SIZE * dpr));
  const cols = Math.max(8, Math.ceil((widthCssPx * dpr) / cellSize));
  const rows = Math.max(8, Math.ceil((heightCssPx * dpr) / cellSize));
  const values = new Uint8Array(cols * rows);
  const nextValues = new Uint8Array(cols * rows);

  return {
    cols,
    rows,
    values,
    nextValues,
    palette,
    surfaceColor,
    cellSize,
    dpr,
    phase: Math.random() * Math.PI * 2,
  };
}

function seedFireBase(runtime: FlameRuntime, intensity: number): void {
  const { cols, rows, values } = runtime;
  const bottomStart = (rows - 1) * cols;
  const secondStart = Math.max(0, rows - 2) * cols;
  const thirdStart = Math.max(0, rows - 3) * cols;
  const hottest = runtime.palette.length - 1;
  const baseHeat = Math.max(3, Math.floor(hottest * (0.55 + intensity * 0.4)));

  runtime.phase += 0.085 + intensity * 0.08;

  for (let x = 0; x < cols; x += 1) {
    const xNorm = x / Math.max(1, cols - 1);
    const mountainProfile = Math.pow(Math.sin(xNorm * Math.PI), 1.85);
    const edgeGate = mountainProfile > 0.14 ? 1 : 0;
    const edgeBonus = Math.floor(mountainProfile * (2.4 + intensity * 2.8));
    const wave = Math.sin(runtime.phase + x * (0.25 + intensity * 0.15));
    const sparkle = Math.random() < 0.035 + intensity * 0.1 ? 2 : 0;
    const emberOffset = Math.random() < 0.08 ? 1 : 0;
    const mountainHeat = Math.floor((baseHeat + Math.floor(wave * 2.2) + sparkle) * mountainProfile);
    const heat = Math.min(
      hottest,
      Math.max(0, mountainHeat + edgeBonus + emberOffset) * edgeGate,
    );
    values[bottomStart + x] = heat;
    values[secondStart + x] = Math.max(0, heat - 1 - (Math.random() > 0.66 ? 1 : 0));
    values[thirdStart + x] = Math.max(0, heat - 2 - (Math.random() > 0.5 ? 1 : 0));
  }
}

function stepFire(runtime: FlameRuntime, intensity: number): void {
  const { cols, rows, values, nextValues } = runtime;
  seedFireBase(runtime, intensity);

  nextValues.fill(0);

  for (let y = rows - 2; y >= 0; y -= 1) {
    for (let x = 0; x < cols; x += 1) {
      const sourceIndex = (y + 1) * cols + x;
      const sourceValue = values[sourceIndex] ?? 0;
      const wind = FIRE_WIND_CHOICES[(Math.random() * FIRE_WIND_CHOICES.length) | 0] ?? 0;
      const spreadX = Math.max(0, Math.min(cols - 1, x + wind));
      const targetIndex = y * cols + spreadX;
      const fade = (Math.random() * (2.2 + (1 - intensity) * 2.1)) | 0;
      const propagated = Math.max(0, sourceValue - fade);
      const currentTarget = nextValues[targetIndex] ?? 0;

      if (propagated > currentTarget) {
        nextValues[targetIndex] = propagated;
      }
    }
  }

  values.set(nextValues);
}

function drawFire(runtime: FlameRuntime, ctx: CanvasRenderingContext2D): void {
  const { cols, rows, values, palette, surfaceColor, cellSize, dpr } = runtime;
  const width = cols * cellSize;
  const height = rows * cellSize;
  ctx.clearRect(0, 0, width, height);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (y >= rows - 2) {
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize + dpr, cellSize + dpr);
        continue;
      }

      const value = values[y * cols + x] ?? 0;
      if (value <= 0) {
        continue;
      }
      ctx.fillStyle = palette[value] ?? palette[palette.length - 1] ?? "rgba(255,255,255,0.6)";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize + dpr, cellSize + dpr);
    }
  }
}

export function ScoreFlame({ variant, intensity }: ScoreFlameProps) {
  const flame = clampFlameIntensity(intensity);
  const theme = scoreBoxVariantTheme[variant];
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // This effect is required because canvas animation + resize observation need direct DOM and RAF lifecycles.
  useEffect(() => {
    if (flame <= 0) {
      return;
    }

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return;
    }

    let runtime: FlameRuntime | null = null;
    let rafId = 0;
    const dpr = window.devicePixelRatio || 1;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      runtime = createRuntime(
        bounds.width,
        bounds.height,
        dpr,
        buildPalette(variant, flame, theme.surfaceRgb),
        `rgb(${theme.surfaceRgb[0]}, ${theme.surfaceRgb[1]}, ${theme.surfaceRgb[2]})`,
      );
      const width = runtime.cols * runtime.cellSize;
      const height = runtime.rows * runtime.cellSize;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${Math.round(width / dpr)}px`;
      canvas.style.height = `${Math.round(height / dpr)}px`;
      context.imageSmoothingEnabled = false;

      // Fill from dark to hot so the first render doesn't pop in from empty.
      runtime.values.fill(0);
      seedFireBase(runtime, flame);
      stepFire(runtime, flame);
      drawFire(runtime, context);
    };

    const frame = () => {
      if (runtime) {
        stepFire(runtime, flame);
        drawFire(runtime, context);
      }
      rafId = window.requestAnimationFrame(frame);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(frame);
    }

    return () => {
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [variant, flame]);

  if (flame <= 0) {
    return null;
  }

  const flameStyle = {
    "--flame-i": flame,
  } as CSSProperties;

  return (
    <div
      ref={hostRef}
      className="score-flame pointer-events-none absolute overflow-hidden"
      style={flameStyle}
      aria-hidden
    >
      <canvas ref={canvasRef} className="score-flame__canvas block size-full" />
    </div>
  );
}
