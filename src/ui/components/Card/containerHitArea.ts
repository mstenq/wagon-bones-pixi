import { Rectangle } from "pixi.js";

import {
  CARD_OWNED_ENLARGED_SCALE,
  SELL_TAB_ATTACH_OVERLAP,
  SELL_TAB_WIDTH,
} from "@/ui/components/Card/config";

/**
 * Row hit box: card body, plus sell tab overhang on the right only (not into the left neighbor).
 */
export function cardContainerHitArea(cardWidth: number, cardHeight: number): Rectangle {
  const scale = CARD_OWNED_ENLARGED_SCALE;
  const halfW = (cardWidth / 2) * scale;
  const halfH = (cardHeight / 2) * scale;
  const rightExtent = halfW - SELL_TAB_ATTACH_OVERLAP + SELL_TAB_WIDTH;
  return new Rectangle(-halfW, -halfH, halfW + rightExtent, 2 * halfH);
}
