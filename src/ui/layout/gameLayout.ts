import { DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH } from "@/ui/components/Card/Card";
import { DEFAULT_DIE_SIZE } from "@/ui/components/Dice/Die";
import { DICE_COUNT } from "@/ui/components/Dice/config";
import { CARD_COUNT } from "@/ui/components/Card/config";
import { rowMetrics } from "@/ui/interaction/rowLayout";
import type { ReorderableRowLayout } from "@/ui/interaction/useReorderableRow";

export const DESIGN_WIDTH = 880;

export type GameLayout = {
  screenW: number;
  screenH: number;
  contentW: number;
  contentLeft: number;
  titleY: number;
  subtitleY: number;
  cardsLabelY: number;
  cardsHintY: number;
  cards: ReorderableRowLayout;
  diceLabelY: number;
  dice: ReorderableRowLayout;
  hudX: number;
  hudY: number;
};

export function computeGameLayout(screenW: number, screenH: number): GameLayout {
  const contentW = Math.min(DESIGN_WIDTH, Math.max(320, screenW - 40));
  const contentLeft = (screenW - contentW) / 2;

  const titleY = 52;
  const subtitleY = titleY + 36;
  const cardsLabelY = subtitleY + 48;
  const cardsHintY = cardsLabelY + 22;
  const cardsRowY = cardsHintY + 28 + DEFAULT_CARD_HEIGHT / 2;

  const diceLabelY = cardsRowY + DEFAULT_CARD_HEIGHT / 2 + 56;
  const diceRowY = diceLabelY + 36 + DEFAULT_DIE_SIZE / 2;

  const hudY = Math.max(diceRowY + DEFAULT_DIE_SIZE / 2 + 72, screenH - 140);

  const cardsMetrics = rowMetrics(CARD_COUNT, DEFAULT_CARD_WIDTH, 12, contentW);
  const diceMetrics = rowMetrics(DICE_COUNT, DEFAULT_DIE_SIZE, 14, contentW);

  return {
    screenW,
    screenH,
    contentW,
    contentLeft,
    titleY,
    subtitleY,
    cardsLabelY,
    cardsHintY,
    cards: {
      ...cardsMetrics,
      originX: contentLeft + cardsMetrics.originX,
      rowY: cardsRowY,
      count: CARD_COUNT,
    },
    diceLabelY,
    dice: {
      ...diceMetrics,
      originX: contentLeft + diceMetrics.originX,
      rowY: diceRowY,
      count: DICE_COUNT,
    },
    hudX: screenW / 2,
    hudY,
  };
}
