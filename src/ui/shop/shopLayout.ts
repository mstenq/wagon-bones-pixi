export const SHOP_CARD_HEIGHT = 235;
export const SHOP_CARD_WIDTH = 150;
export const SHOP_CARD_SPACING = 185;
export const SHOP_PRICE_TAG_SPACE = 36;
export const SHOP_BTN_COL_W = 130;
export const SHOP_BOX_PAD = 16;
export const SHOP_BOX_GAP = 12;
export const SHOP_BOX_RADIUS = 12;
export const SHOP_BTN_W = 126;
export const SHOP_CONTENT_PAD = 12;
export const SHOP_BTN_H = 52;
export const SHOP_BTN_STACK_GAP = 8;
export const SHOP_ROW_TOP_GAP = 20;
export const SHOP_PERMIT_SCALE = 1.2;
export const SHOP_PERMIT_LABEL_GAP = 20;

export type ShopBoxLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type ShopButtonLayout = {
  hitTrail: { x: number; y: number; width: number; height: number };
  reroll: { x: number; y: number; width: number; height: number };
};

export type ShopCardSlotLayout = {
  x: number;
  y: number;
};

export type ShopPanelLayout = {
  contentCX: number;
  stockRow: ShopBoxLayout;
  permitsPacksRow: ShopBoxLayout;
  stockButtons: ShopButtonLayout;
  stockCardAreaLeft: number;
  stockCardAreaWidth: number;
  stockCardSlots: ShopCardSlotLayout[];
  permitSlots: ShopCardSlotLayout[];
  packSlots: ShopCardSlotLayout[];
  primaryPermitLabelX: number;
  bonusPermitLabelX: number | null;
};

function rowInnerHeight(): number {
  return SHOP_CARD_HEIGHT + SHOP_PRICE_TAG_SPACE + SHOP_BOX_PAD * 2;
}

function rowCardCenterY(): number {
  return SHOP_BOX_PAD + SHOP_PRICE_TAG_SPACE + SHOP_CARD_HEIGHT / 2;
}

function centerCardSlots(count: number, areaLeft: number, areaWidth: number, centerY: number): ShopCardSlotLayout[] {
  if (count <= 0) {
    return [];
  }
  const totalW = count > 1 ? (count - 1) * SHOP_CARD_SPACING : 0;
  const startX = areaLeft + areaWidth / 2 - totalW / 2;
  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * SHOP_CARD_SPACING,
    y: centerY,
  }));
}

export function computeShopPanelLayout(contentW: number, _contentH: number, stockCount: number, packCount: number, permitCount: number): ShopPanelLayout {
  const panelW = contentW - SHOP_CONTENT_PAD * 2;
  const contentCX = SHOP_CONTENT_PAD + panelW / 2;
  const rowH = rowInnerHeight();
  const cardCenterY = rowCardCenterY();
  const stockRowY = SHOP_ROW_TOP_GAP;
  const stockRow: ShopBoxLayout = {
    x: SHOP_CONTENT_PAD,
    y: stockRowY,
    width: panelW,
    height: rowH,
    centerX: contentCX,
    centerY: cardCenterY,
  };

  const permitsPacksRowY = stockRowY + rowH + SHOP_BOX_GAP;
  const permitsPacksRow: ShopBoxLayout = {
    x: SHOP_CONTENT_PAD,
    y: permitsPacksRowY,
    width: panelW,
    height: rowH,
    centerX: contentCX,
    centerY: cardCenterY,
  };

  const btnColX = SHOP_BOX_PAD + SHOP_BTN_COL_W / 2;
  const hitTrailY = cardCenterY - SHOP_BTN_H / 2 - SHOP_BTN_STACK_GAP / 2;
  const rerollY = cardCenterY + SHOP_BTN_H / 2 + SHOP_BTN_STACK_GAP / 2;

  const stockButtons: ShopButtonLayout = {
    hitTrail: { x: btnColX, y: hitTrailY, width: SHOP_BTN_W, height: SHOP_BTN_H },
    reroll: { x: btnColX, y: rerollY, width: SHOP_BTN_W, height: SHOP_BTN_H },
  };

  const stockCardAreaLeft = SHOP_BOX_PAD + SHOP_BTN_COL_W + 8;
  const stockCardAreaWidth = panelW - stockCardAreaLeft - SHOP_BOX_PAD;
  const stockCardSlots = centerCardSlots(stockCount, stockCardAreaLeft, stockCardAreaWidth, cardCenterY);

  const permitPanelW = Math.floor(panelW * 0.42);
  const packPanelLeft = permitPanelW + SHOP_BOX_PAD;
  const packPanelW = panelW - packPanelLeft - SHOP_BOX_PAD;

  const permitAreaLeft = SHOP_BOX_PAD + 40;
  const permitAreaWidth = permitPanelW - SHOP_BOX_PAD - 40;
  const permitSlots = centerCardSlots(permitCount, permitAreaLeft, permitAreaWidth, cardCenterY);

  const packAreaLeft = packPanelLeft + SHOP_BOX_PAD;
  const packAreaWidth = packPanelW - SHOP_BOX_PAD * 2;
  const packSlots = centerCardSlots(packCount, packAreaLeft, packAreaWidth, cardCenterY);

  const primaryPermitLabelX = permitAreaLeft - SHOP_PERMIT_LABEL_GAP;
  const bonusPermitLabelX = permitCount > 1 && permitSlots[1] ? permitSlots[0]!.x - SHOP_PERMIT_LABEL_GAP : null;

  return {
    contentCX,
    stockRow,
    permitsPacksRow,
    stockButtons,
    stockCardAreaLeft,
    stockCardAreaWidth,
    stockCardSlots,
    permitSlots,
    packSlots,
    primaryPermitLabelX,
    bonusPermitLabelX,
  };
}

