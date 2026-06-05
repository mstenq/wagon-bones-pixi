import { DEFAULT_ROUND_CARD_HEIGHT, DEFAULT_ROUND_CARD_WIDTH } from '@/ui/components/RoundCard/roundCardTheme';

const CARD_GAP = 20;

export type RoundSelectCardPlacement = {
  round: number;
  x: number;
  y: number;
};

export type RoundSelectLayout = {
  cards: RoundSelectCardPlacement[];
};

/** Lay out round cards within the chrome content band (coordinates relative to content top-left). */
export function computeRoundSelectLayout(contentW: number, contentH: number): RoundSelectLayout {
  const colW = Math.min(DEFAULT_ROUND_CARD_WIDTH, (contentW - CARD_GAP * 2) / 3);
  const totalW = colW * 3 + CARD_GAP * 2;
  const startX = (contentW - totalW) / 2 + colW / 2;
  const cardsY = contentH / 2;

  const cards: RoundSelectCardPlacement[] = [];
  for (let round = 1; round <= 3; round++) {
    const x = startX + (round - 1) * (colW + CARD_GAP);
    cards.push({ round, x, y: cardsY });
  }

  return { cards };
}

export { DEFAULT_ROUND_CARD_HEIGHT, DEFAULT_ROUND_CARD_WIDTH };
