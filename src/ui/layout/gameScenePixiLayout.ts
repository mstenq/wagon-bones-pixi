import { UI } from '@/game/Constants';
import { DEFAULT_ROUND_CARD_HEIGHT } from '@/ui/components/RoundCard/roundCardTheme';

const BAR_GAP = 8;
const CONTENT_TOP_GAP = 16;
const CONTENT_BOTTOM_GAP = 8;

/** Layout width used when scaling down on narrow viewports. */
export const GAME_SCENE_VIEWPORT_DESIGN_WIDTH = 1000;

export type GameScenePixiLayoutMetrics = {
  contentX: number;
  contentW: number;
  contentCX: number;
  contentTop: number;
  contentBottom: number;
  contentH: number;
  equipBar: { x: number; y: number; w: number; h: number };
  consumableBar: { x: number; y: number; w: number; h: number };
  dicePouch: { x: number; y: number; size: number };
  tagStack: { pouchX: number; pouchY: number };
};

export type GameSceneViewportMetrics = {
  scale: number;
  layoutW: number;
  layoutH: number;
};

/** Minimum virtual canvas height: chrome bars + round-card content band + dice pouch. */
export function gameSceneViewportDesignHeight(): number {
  return (
    UI.EQUIP_BAR_HEIGHT +
    CONTENT_TOP_GAP +
    DEFAULT_ROUND_CARD_HEIGHT +
    CONTENT_BOTTOM_GAP +
    UI.POUCH_MARGIN +
    UI.POUCH_SIZE
  );
}

/** Scale the full chrome layout down on small screens; anchor from the top (not vertical center). */
export function computeGameSceneViewportMetrics(screenW: number, screenH: number): GameSceneViewportMetrics {
  const designW = GAME_SCENE_VIEWPORT_DESIGN_WIDTH;
  const designH = gameSceneViewportDesignHeight();
  const widthScale = screenW / designW;
  const heightScale = screenH / designH;
  const scale = Math.min(1, widthScale, heightScale);

  if (scale >= 1) {
    return { scale: 1, layoutW: screenW, layoutH: screenH };
  }

  return { scale, layoutW: designW, layoutH: designH };
}

export function computeGameScenePixiLayout(screenW: number, screenH: number): GameScenePixiLayoutMetrics {
  const contentX = UI.FELT_PADDING;
  const contentW = screenW - UI.FELT_PADDING * 2;
  const contentCX = screenW / 2;

  const equipBarH = UI.EQUIP_BAR_HEIGHT;
  const equipW = Math.floor((contentW - BAR_GAP) * UI.EQUIP_BAR_RATIO);
  const consumableW = contentW - equipW - BAR_GAP;

  const equipBar = { x: contentX, y: 8, w: equipW, h: equipBarH };
  const consumableBar = { x: contentX + equipW + BAR_GAP, y: 8, w: consumableW, h: equipBarH };

  const pouchX = screenW - UI.POUCH_MARGIN - UI.POUCH_SIZE;
  const pouchY = screenH - UI.POUCH_MARGIN - UI.POUCH_SIZE;
  const dicePouch = { x: pouchX, y: pouchY, size: UI.POUCH_SIZE };

  const contentTop = equipBarH + CONTENT_TOP_GAP;
  const contentBottom = screenH - UI.POUCH_MARGIN - UI.POUCH_SIZE - CONTENT_BOTTOM_GAP;
  const contentH = Math.max(0, contentBottom - contentTop);

  return {
    contentX,
    contentW,
    contentCX,
    contentTop,
    contentBottom,
    contentH,
    equipBar,
    consumableBar,
    dicePouch,
    tagStack: { pouchX, pouchY },
  };
}
