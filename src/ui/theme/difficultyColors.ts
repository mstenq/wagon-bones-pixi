import { DIFFICULTIES } from '@/game/Constants';
import { getDifficultyBeatColor, getDifficultyBeatStrokeColor } from '@/game/UserStats';

function numberColorToCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** CSS color for a difficulty level card accent (from game data). */
export function difficultyLevelToCss(level: number): string {
  const def = DIFFICULTIES[level - 1];
  if (!def) {
    return '#000000';
  }
  return numberColorToCss(def.color);
}

/** Fill/stroke for profession beat-indicator dot. */
export function beatIndicatorStyles(beatenLevel: number): {
  fill: string | null;
  stroke: string;
} {
  const fillColor = getDifficultyBeatColor(beatenLevel);
  return {
    fill: fillColor !== null ? numberColorToCss(fillColor) : null,
    stroke: numberColorToCss(getDifficultyBeatStrokeColor(beatenLevel)),
  };
}
