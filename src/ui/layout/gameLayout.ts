import { DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH } from "@/ui/components/Card/Card";
import { DEFAULT_DIE_SIZE } from "@/ui/components/Dice/Die";
import { CARD_COUNT } from "@/data/items";
import { DICE_COUNT } from "@/data/dice";
import { rowMetrics } from "@/ui/interaction/rowLayout";
import type { ReorderableRowLayout } from "@/ui/interaction/useReorderableRow";

export const DESIGN_WIDTH = 880;

export type GameLayout = {
  cards: ReorderableRowLayout;
  dice: ReorderableRowLayout;
};

export function computeGameLayout(screenW: number, screenH: number): GameLayout {
  const contentW = Math.min(DESIGN_WIDTH, Math.max(320, screenW - 40));
  const contentLeft = (screenW - contentW) / 2;

  const cardsRowY = 52 + 36 + 48 + 22 + 28 + DEFAULT_CARD_HEIGHT / 2;
  const diceRowY = Math.min(
    cardsRowY + DEFAULT_CARD_HEIGHT / 2 + 56 + 36 + DEFAULT_DIE_SIZE / 2,
    screenH - DEFAULT_DIE_SIZE - 160,
  );

  const cardsMetrics = rowMetrics(CARD_COUNT, DEFAULT_CARD_WIDTH, 12, contentW);
  const diceMetrics = rowMetrics(DICE_COUNT, DEFAULT_DIE_SIZE, 14, contentW);

  return {
    cards: {
      ...cardsMetrics,
      originX: contentLeft + cardsMetrics.originX,
      rowY: cardsRowY,
      count: CARD_COUNT,
    },
    dice: {
      ...diceMetrics,
      originX: contentLeft + diceMetrics.originX,
      rowY: diceRowY,
      count: DICE_COUNT,
    },
  };
}
