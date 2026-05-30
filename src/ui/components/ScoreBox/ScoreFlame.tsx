import { useEffect, useRef, type CSSProperties } from "react";

import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";
import { scoreBoxVariantTheme } from "@/ui/components/ScoreBox/scoreBoxTheme";
import { clampFlameIntensity } from "@/ui/components/ScoreBox/scoreFlame";
import {
  createFlamePalette,
  createFlameRuntime,
  drawFlame,
  stepFlame,
  type FlameRuntime,
} from "@/ui/components/ScoreBox/scoreFlameEngine";

export type ScoreFlameProps = {
  variant: ScoreBoxVariant;
  /** 0–1 intensity from game logic; 0 hides flames. */
  intensity: number;
};

type FlameVisualConfig = {
  surfaceRgb: readonly [number, number, number];
  surfaceColorCss: string;
};

function buildVisualConfig(
  variant: ScoreBoxVariant,
): FlameVisualConfig {
  const { surfaceRgb } = scoreBoxVariantTheme[variant];
  return {
    surfaceRgb,
    surfaceColorCss: `rgb(${surfaceRgb[0]}, ${surfaceRgb[1]}, ${surfaceRgb[2]})`,
  };
}

export function ScoreFlame({ variant, intensity }: ScoreFlameProps) {
  const flame = clampFlameIntensity(intensity);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<FlameRuntime | null>(null);
  const intensityRef = useRef(0);

  const isActive = flame > 0;
  const visual = buildVisualConfig(variant);

  // This effect is required because canvas animation + resize observation need direct DOM and RAF lifecycles.
  useEffect(() => {
    intensityRef.current = flame;
  }, [flame]);

  // This effect is required because palette updates must be synchronized to intensity changes for live flame tuning.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    runtime.palette = createFlamePalette(variant, flame, visual.surfaceRgb);
  }, [variant, flame, visual.surfaceRgb]);

  // This effect is required because canvas setup uses DOM measurement, observers, and RAF animation lifecycle.
  useEffect(() => {
    if (!isActive) {
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

    let rafId = 0;
    const dpr = window.devicePixelRatio || 1;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      runtimeRef.current = createFlameRuntime(
        bounds.width,
        bounds.height,
        dpr,
        createFlamePalette(variant, intensityRef.current, visual.surfaceRgb),
        visual.surfaceColorCss,
      );
      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }
      const width = runtime.cols * runtime.cellSize;
      const height = runtime.rows * runtime.cellSize;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${Math.round(width / dpr)}px`;
      canvas.style.height = `${Math.round(height / dpr)}px`;
      context.imageSmoothingEnabled = false;

      // Fill from dark to hot so the first render doesn't pop in from empty.
      runtime.values.fill(0);
      stepFlame(runtime, intensityRef.current);
      drawFlame(runtime, context);
    };

    const frame = () => {
      const runtime = runtimeRef.current;
      if (runtime) {
        stepFlame(runtime, intensityRef.current);
        drawFlame(runtime, context);
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
      runtimeRef.current = null;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [variant, isActive, visual.surfaceColorCss, visual.surfaceRgb]);

  if (!isActive) {
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
