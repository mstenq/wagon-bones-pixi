import { DEFAULT_DIE_SIZE } from '@/ui/components/Dice/Die';
import { DICE_COUNT } from '@/data/dice';
import { rowMetrics } from '@/ui/interaction/rowLayout';
import type { ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';

export const DESIGN_WIDTH = 880;

/** Viewport width at and above which game content uses 1:1 screen coordinates. */
export const VIEWPORT_SCALE_BREAKPOINT = 1000;

const VIEWPORT_DESIGN_WIDTH = VIEWPORT_SCALE_BREAKPOINT;

/** Unscaled layout height (dice row + roll-button margin). */
export const VIEWPORT_DESIGN_HEIGHT = DEFAULT_DIE_SIZE + 160;

export type ViewportMetrics = {
  scale: number;
  layoutW: number;
  layoutH: number;
};

export function computeViewportMetrics(screenW: number, screenH: number): ViewportMetrics {
  const widthScale = screenW / VIEWPORT_DESIGN_WIDTH;
  const heightScale = screenH / VIEWPORT_DESIGN_HEIGHT;
  const scale = Math.min(1, widthScale, heightScale);

  if (scale >= 1) {
    return { scale: 1, layoutW: screenW, layoutH: screenH };
  }

  return { scale, layoutW: VIEWPORT_DESIGN_WIDTH, layoutH: VIEWPORT_DESIGN_HEIGHT };
}

export type GameLayout = {
  dice: ReorderableRowLayout;
};

export function computeGameLayout(screenW: number, screenH: number): GameLayout {
  const contentW = Math.min(DESIGN_WIDTH, Math.max(320, screenW - 40));
  const contentLeft = (screenW - contentW) / 2;

  const diceRowY = Math.min(screenH * 0.45, screenH - DEFAULT_DIE_SIZE - 160);
  const diceMetrics = rowMetrics(DICE_COUNT, DEFAULT_DIE_SIZE, 14, contentW);

  return {
    dice: {
      ...diceMetrics,
      originX: contentLeft + diceMetrics.originX,
      rowY: diceRowY,
      count: DICE_COUNT,
    },
  };
}
