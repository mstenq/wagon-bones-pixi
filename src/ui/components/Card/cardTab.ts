import { TextStyle, type Graphics, type Text } from 'pixi.js';

import {
  ACTION_TAB_ATTACH_OVERLAP,
  ACTION_TAB_HEIGHT,
  ACTION_TAB_VISIBLE_HEIGHT,
  PRICE_TAB_COLOR,
  PRICE_TAB_HEIGHT,
  PRICE_TAB_STROKE,
  PRICE_TAB_TEXT_COLOR,
  SELL_TAB_ATTACH_OVERLAP,
  SELL_TAB_HEIGHT,
  SELL_TAB_LEFT_PADDING,
  SELL_TAB_WIDTH,
  SECONDARY_ACTION_TAB_ATTACH_OVERLAP,
  SECONDARY_ACTION_TAB_HEIGHT,
  SECONDARY_ACTION_TAB_WIDTH,
  SECONDARY_ACTION_TAB_Y_INSET,
  TAB_GREEN,
  TAB_HEIGHT,
  TAB_SHADOW_ALPHA,
  TAB_SHADOW_OFFSET_X,
  TAB_SHADOW_OFFSET_Y,
  TAB_WIDTH,
} from '@/ui/components/Card/config';

export const tabTextStyle = new TextStyle({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 13,
  fontWeight: '700',
  fill: '#ffffff',
  align: 'center',
});

export const priceTabTextStyle = new TextStyle({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: '700',
  fill: PRICE_TAB_TEXT_COLOR,
  align: 'center',
});

export const sellTabTextStyle = new TextStyle({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 11,
  fontWeight: '700',
  fill: '#ffffff',
  align: 'center',
  lineHeight: 13,
});

type TabDrawStyle = {
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeWidth?: number;
};

function drawBottomTabShape(
  graphics: Graphics,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  style: TabDrawStyle = {},
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = 6;
  const fill = style.fill ?? TAB_GREEN;
  const fillAlpha = style.fillAlpha ?? 1;
  const stroke = style.stroke ?? 0x2a8a48;
  const strokeWidth = style.strokeWidth ?? 2;

  graphics.clear();
  graphics.moveTo(-halfW + offsetX, -halfH + offsetY);
  graphics.lineTo(halfW + offsetX, -halfH + offsetY);
  graphics.lineTo(halfW + offsetX, halfH - radius + offsetY);
  graphics.arcTo(halfW + offsetX, halfH + offsetY, halfW - radius + offsetX, halfH + offsetY, radius);
  graphics.lineTo(-halfW + radius + offsetX, halfH + offsetY);
  graphics.arcTo(-halfW + offsetX, halfH + offsetY, -halfW + offsetX, halfH - radius + offsetY, radius);
  graphics.closePath();
  graphics.fill({ color: fill, alpha: fillAlpha });
  if (strokeWidth > 0) {
    graphics.stroke({ color: stroke, width: strokeWidth, alpha: fillAlpha });
  }
}

function drawSellTabShape(graphics: Graphics, offsetX: number, offsetY: number, style: TabDrawStyle = {}): void {
  drawRightSlideTabShape(graphics, SELL_TAB_WIDTH, SELL_TAB_HEIGHT, offsetX, offsetY, style);
}

function drawRightSlideTabShape(
  graphics: Graphics,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  style: TabDrawStyle = {},
): void {
  const halfH = height / 2;
  const radius = 6;
  const fill = style.fill ?? TAB_GREEN;
  const fillAlpha = style.fillAlpha ?? 1;
  const stroke = style.stroke ?? 0x2a8a48;
  const strokeWidth = style.strokeWidth ?? 2;

  graphics.clear();
  graphics.moveTo(offsetX, -halfH + offsetY);
  graphics.lineTo(width - radius + offsetX, -halfH + offsetY);
  graphics.arcTo(width + offsetX, -halfH + offsetY, width + offsetX, -halfH + radius + offsetY, radius);
  graphics.lineTo(width + offsetX, halfH - radius + offsetY);
  graphics.arcTo(width + offsetX, halfH + offsetY, width - radius + offsetX, halfH + offsetY, radius);
  graphics.lineTo(offsetX, halfH + offsetY);
  graphics.closePath();
  graphics.fill({ color: fill, alpha: fillAlpha });
  if (strokeWidth > 0) {
    graphics.stroke({ color: stroke, width: strokeWidth, alpha: fillAlpha });
  }
}

/** Price tab attached to the top edge of the card. */
export function drawPriceTab(graphics: Graphics): void {
  const width = TAB_WIDTH;
  const height = PRICE_TAB_HEIGHT;
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = 6;

  graphics.clear();
  graphics.moveTo(-halfW, halfH);
  graphics.lineTo(-halfW, -halfH + radius);
  graphics.arcTo(-halfW, -halfH, -halfW + radius, -halfH, radius);
  graphics.lineTo(halfW - radius, -halfH);
  graphics.arcTo(halfW, -halfH, halfW, -halfH + radius, radius);
  graphics.lineTo(halfW, halfH);
  graphics.closePath();
  graphics.fill({ color: PRICE_TAB_COLOR });
  graphics.stroke({ color: PRICE_TAB_STROKE, width: 2 });
}

/** Green BUY / SELECT tab tucked under the card bottom edge. */
export function drawBottomActionTab(graphics: Graphics): void {
  drawBottomTabShape(graphics, TAB_WIDTH, ACTION_TAB_HEIGHT, 0, 0);
}

export function drawBottomActionTabStyled(graphics: Graphics, style: TabDrawStyle): void {
  drawBottomTabShape(graphics, TAB_WIDTH, ACTION_TAB_HEIGHT, 0, 0, style);
}

export function drawBottomActionTabShadowStyled(graphics: Graphics): void {
  drawBottomTabShape(graphics, TAB_WIDTH, ACTION_TAB_HEIGHT, TAB_SHADOW_OFFSET_X, TAB_SHADOW_OFFSET_Y, {
    fill: 0x000000,
    fillAlpha: TAB_SHADOW_ALPHA,
    strokeWidth: 0,
  });
}

export function drawBottomActionTabShadow(graphics: Graphics): void {
  drawBottomTabShape(graphics, TAB_WIDTH, ACTION_TAB_HEIGHT, TAB_SHADOW_OFFSET_X, TAB_SHADOW_OFFSET_Y, {
    fill: 0x000000,
    fillAlpha: TAB_SHADOW_ALPHA,
    strokeWidth: 0,
  });
}

/** Sell tab that slides out to the right from behind the card. */
export function drawSellTab(graphics: Graphics): void {
  drawSellTabShape(graphics, 0, 0);
}

export function drawSellTabShadow(graphics: Graphics): void {
  drawSellTabShape(graphics, TAB_SHADOW_OFFSET_X, TAB_SHADOW_OFFSET_Y, {
    fill: 0x000000,
    fillAlpha: TAB_SHADOW_ALPHA,
    strokeWidth: 0,
  });
}

export function formatPrice(price: number): string {
  return `$${price}`;
}

export function formatSellLabel(sellPrice: number): string {
  return `SELL\n${formatPrice(sellPrice)}`;
}

export function syncTabText(text: Text | null, label: string): void {
  if (text) {
    text.text = label;
  }
}

export const PRICE_TAB_Y_OFFSET = -PRICE_TAB_HEIGHT * 0.55;

/** Label sits in the bottom visible portion of the taller tab. */
export const ACTION_TAB_TEXT_Y = ACTION_TAB_HEIGHT / 2 - ACTION_TAB_VISIBLE_HEIGHT / 2;

/** Tab container y; pass squishScaleY so the tab tracks a squishing card bottom. */
export function actionTabAnchorY(cardHeight: number, squishScaleY = 1): number {
  return (cardHeight / 2) * squishScaleY - ACTION_TAB_ATTACH_OVERLAP + ACTION_TAB_HEIGHT / 2;
}

/** Price tab container y; tracks the squishing card top edge. */
export function priceTabAnchorY(cardHeight: number, squishScaleY = 1): number {
  return -(cardHeight / 2) * squishScaleY + PRICE_TAB_Y_OFFSET;
}

/** Tab container x; tracks owned-mode card scale on the right edge. */
export function sellTabAnchorX(cardWidth: number, ownedScale = 1): number {
  return (cardWidth / 2) * ownedScale - SELL_TAB_ATTACH_OVERLAP;
}

/** Inner slide from hidden to fully revealed (flush with card edge). */
export function sellTabInnerX(reveal: number): number {
  return -SELL_TAB_WIDTH + reveal * SELL_TAB_WIDTH;
}

export function secondaryActionTabAnchorX(cardWidth: number, cardScale = 1): number {
  return (cardWidth / 2) * cardScale - SECONDARY_ACTION_TAB_ATTACH_OVERLAP;
}

export function secondaryActionTabAnchorY(cardHeight: number, cardScale = 1): number {
  const halfH = (cardHeight / 2) * cardScale;
  return halfH - SECONDARY_ACTION_TAB_Y_INSET - SECONDARY_ACTION_TAB_HEIGHT / 2;
}

export function secondaryActionTabInnerX(reveal: number): number {
  return -SECONDARY_ACTION_TAB_WIDTH + reveal * SECONDARY_ACTION_TAB_WIDTH;
}

/** Right-side shop tab; flat left edge tucks under the card. */
export function drawRightShopActionTab(graphics: Graphics, style: TabDrawStyle = {}): void {
  drawRightSlideTabShape(graphics, SECONDARY_ACTION_TAB_WIDTH, SECONDARY_ACTION_TAB_HEIGHT, 0, 0, {
    ...style,
    fill: style.fill ?? TAB_GREEN,
    stroke: style.stroke ?? 0x2a8a48,
  });
}

export function drawRightShopActionTabShadow(graphics: Graphics): void {
  drawRightSlideTabShape(
    graphics,
    SECONDARY_ACTION_TAB_WIDTH,
    SECONDARY_ACTION_TAB_HEIGHT,
    TAB_SHADOW_OFFSET_X,
    TAB_SHADOW_OFFSET_Y,
    {
      fill: 0x000000,
      fillAlpha: TAB_SHADOW_ALPHA,
      strokeWidth: 0,
    },
  );
}

export const SELL_TAB_TEXT_X = SELL_TAB_LEFT_PADDING + (SELL_TAB_WIDTH - SELL_TAB_LEFT_PADDING) / 2;

export const SECONDARY_ACTION_TAB_TEXT_X = SECONDARY_ACTION_TAB_WIDTH / 2;

/** Consumable USE tab on owned inventory cards (Phaser blue). */
export const OWNED_USE_TAB_COLOR = 0x2255aa;
export const OWNED_USE_TAB_STROKE = 0x1a4488;

export function drawOwnedUseTab(graphics: Graphics): void {
  drawRightSlideTabShape(graphics, SECONDARY_ACTION_TAB_WIDTH, SECONDARY_ACTION_TAB_HEIGHT, 0, 0, {
    fill: OWNED_USE_TAB_COLOR,
    stroke: OWNED_USE_TAB_STROKE,
  });
}

export function drawOwnedUseTabShadow(graphics: Graphics): void {
  drawRightSlideTabShape(
    graphics,
    SECONDARY_ACTION_TAB_WIDTH,
    SECONDARY_ACTION_TAB_HEIGHT,
    TAB_SHADOW_OFFSET_X,
    TAB_SHADOW_OFFSET_Y,
    {
      fill: 0x000000,
      fillAlpha: TAB_SHADOW_ALPHA,
      strokeWidth: 0,
    },
  );
}

/** Re-export for hit-area / layout math in Card. */
export {
  ACTION_TAB_ATTACH_OVERLAP,
  ACTION_TAB_HEIGHT,
  ACTION_TAB_VISIBLE_HEIGHT,
  SELL_TAB_HEIGHT,
  SELL_TAB_WIDTH,
  TAB_HEIGHT,
  TAB_WIDTH,
};
