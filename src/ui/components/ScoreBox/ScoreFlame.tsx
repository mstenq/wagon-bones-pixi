import type { CSSProperties } from "react";

import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";
import { scoreBoxVariantTheme } from "@/ui/components/ScoreBox/scoreBoxTheme";
import { clampFlameIntensity } from "@/ui/components/ScoreBox/scoreFlame";

export type ScoreFlameProps = {
  variant: ScoreBoxVariant;
  /** 0–1 intensity from game logic; 0 hides flames. */
  intensity: number;
};

/** Jagged top silhouette; flat bottom sits on the score box edge. */
const FLAME_SILHOUETTE =
  "M0 24 L0 20 2 18 4 21 6 16 8 20 10 14 12 18 14 12 16 17 18 11 20 16 22 10 24 15 26 9 28 14 30 8 32 13 34 9 36 14 38 10 40 15 42 11 44 16 46 12 48 17 50 13 52 18 54 14 56 19 58 15 60 20 62 17 64 24 Z";

type FlameLayerProps = {
  fill: string;
  wrapClassName: string;
  delaySeconds: number;
  speedSeconds: number;
};

function FlameLayer({ fill, wrapClassName, delaySeconds, speedSeconds }: FlameLayerProps) {
  const layerStyle = {
    animationDelay: `${delaySeconds}s`,
    animationDuration: `${speedSeconds}s`,
  } as CSSProperties;

  return (
    <div className={`score-flame__wrap absolute inset-0 ${wrapClassName}`}>
      <svg
        className="score-flame__layer animate-score-flame block size-full"
        style={layerStyle}
        viewBox="0 0 64 24"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <path d={FLAME_SILHOUETTE} fill={fill} />
      </svg>
    </div>
  );
}

export function ScoreFlame({ variant, intensity }: ScoreFlameProps) {
  const flame = clampFlameIntensity(intensity);
  if (flame <= 0) {
    return null;
  }

  const theme = scoreBoxVariantTheme[variant];
  const flameSpeed = 1.05 - flame * 0.35;
  const flameStyle = {
    "--flame-i": flame,
  } as CSSProperties;

  return (
    <div className="score-flame pointer-events-none absolute" style={flameStyle} aria-hidden>
      <FlameLayer
        fill={theme.flameMidColor}
        wrapClassName="score-flame__wrap--mid"
        delaySeconds={-0.18}
        speedSeconds={flameSpeed}
      />
      <FlameLayer
        fill={theme.flameFrontColor}
        wrapClassName="score-flame__wrap--front"
        delaySeconds={-0.36}
        speedSeconds={flameSpeed}
      />
      <FlameLayer
        fill={theme.surfaceColor}
        wrapClassName="score-flame__wrap--surface"
        delaySeconds={0}
        speedSeconds={flameSpeed}
      />
    </div>
  );
}
