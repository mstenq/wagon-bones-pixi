import { useTick } from "@pixi/react";
import { Text, type Container, type Text as PixiText, type TextStyle } from "pixi.js";
import { useCallback, useMemo, useRef } from "react";

import {
  WAVE_CLICK_BUMP_PX,
  WAVE_CLICK_RIPPLE_MS,
  WAVE_IDLE_STAGGER_S,
  waveClickBumpY,
  waveIdleAmplitudePx,
  waveIdleOffsetY,
} from "@/ui/components/WaveBounce/waveBounce";

export type WaveBouncePixiClickRipple = {
  normX: number;
  startMs: number;
};

export type WaveBouncePixiProps = {
  text: string;
  style: TextStyle;
  fontSizePx?: number;
  /** When true, idle wave is frozen (e.g. parent hovered). Click ripple still runs. */
  idleWavePaused?: boolean;
  reducedMotion?: boolean;
  staggerSeconds?: number;
  amplitudePx?: number;
  charGapPx?: number;
  clickRipple?: WaveBouncePixiClickRipple | null;
  clickRippleDurationMs?: number;
  clickBumpPx?: number;
  y?: number;
};

type CharLayout = {
  char: string;
  x: number;
};

const measureCache = new Map<string, number>();

function measureCharWidth(char: string, style: TextStyle): number {
  const key = `${char}:${style.fontSize}:${style.fontFamily}`;
  const cached = measureCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const probe = new Text({ text: char, style });
  const width = probe.width;
  probe.destroy();
  measureCache.set(key, width);
  return width;
}

function buildCharLayouts(text: string, style: TextStyle, charGapPx: number): CharLayout[] {
  const chars = [...text];
  const layouts: CharLayout[] = [];
  let cursor = 0;

  for (const char of chars) {
    layouts.push({ char, x: cursor });
    cursor += measureCharWidth(char, style) + charGapPx;
  }

  return layouts;
}

export function WaveBouncePixi({
  text,
  style,
  fontSizePx = 28,
  idleWavePaused = false,
  reducedMotion = false,
  staggerSeconds = WAVE_IDLE_STAGGER_S,
  amplitudePx,
  charGapPx = 2,
  clickRipple = null,
  clickRippleDurationMs = WAVE_CLICK_RIPPLE_MS,
  clickBumpPx = WAVE_CLICK_BUMP_PX,
  y = 0,
}: WaveBouncePixiProps) {
  const rowRef = useRef<Container | null>(null);
  const charRefs = useRef<(PixiText | null)[]>([]);
  const timeRef = useRef(0);

  const resolvedAmplitude = amplitudePx ?? waveIdleAmplitudePx(fontSizePx);

  const layouts = useMemo(
    () => buildCharLayouts(text, style, charGapPx),
    [charGapPx, style, text],
  );

  const totalWidth = useMemo(() => {
    if (layouts.length === 0) {
      return 0;
    }
    const last = layouts[layouts.length - 1]!;
    return last.x + measureCharWidth(last.char, style);
  }, [layouts, style]);

  const bindRow = useCallback(
    (node: Container | null) => {
      rowRef.current = node;
      if (node) {
        node.x = -totalWidth / 2;
        node.y = y;
      }
    },
    [totalWidth, y],
  );

  useTick((ticker) => {
    const dt = ticker.deltaMS / 1000;
    timeRef.current += dt;
    const now = performance.now();
    const rippleActive =
      clickRipple !== null &&
      clickRipple.startMs > 0 &&
      now - clickRipple.startMs < clickRippleDurationMs;

    for (let index = 0; index < layouts.length; index += 1) {
      const node = charRefs.current[index];
      if (!node) {
        continue;
      }

      let offsetY = 0;
      if (!reducedMotion && !idleWavePaused) {
        offsetY += waveIdleOffsetY(
          timeRef.current,
          index,
          staggerSeconds,
          resolvedAmplitude,
        );
      }

      if (rippleActive && clickRipple) {
        offsetY += waveClickBumpY(
          now - clickRipple.startMs,
          index,
          layouts.length,
          clickRipple.normX,
          clickBumpPx,
          clickRippleDurationMs,
        );
      }

      node.y = offsetY;
    }
  });

  return (
    <pixiContainer ref={bindRow} eventMode="none">
      {layouts.map(({ char, x }, index) => (
        <pixiText
          key={`${index}-${char}`}
          ref={(node) => {
            charRefs.current[index] = node;
          }}
          text={char}
          x={x}
          y={0}
          anchor={{ x: 0, y: 0.5 }}
          style={style}
          eventMode="none"
        />
      ))}
    </pixiContainer>
  );
}
