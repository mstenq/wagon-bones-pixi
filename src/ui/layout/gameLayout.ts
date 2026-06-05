import { UI } from '@/game/Constants';
import { DEFAULT_DIE_SIZE } from '@/ui/components/Dice/Die';
import { DICE_COUNT } from '@/data/dice';
import { rowMetrics } from '@/ui/interaction/rowLayout';
import type { ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';

export const DESIGN_WIDTH = 880;

export type GameLayout = {
  dice: ReorderableRowLayout;
};

/** Lay out the dice row within the chrome content band (coordinates relative to content top-left). */
export function computeGameLayout(contentW: number, contentH: number): GameLayout {
  const bandW = Math.min(DESIGN_WIDTH, Math.max(320, contentW - 40));
  const contentLeft = (contentW - bandW) / 2;

  const diceRowY = Math.min(contentH * UI.ROLL_Y_RATIO, contentH - DEFAULT_DIE_SIZE - 80);
  const diceMetrics = rowMetrics(DICE_COUNT, DEFAULT_DIE_SIZE, 14, bandW);

  return {
    dice: {
      ...diceMetrics,
      originX: contentLeft + diceMetrics.originX,
      rowY: diceRowY,
      count: DICE_COUNT,
    },
  };
}
