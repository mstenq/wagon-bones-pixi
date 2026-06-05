import { TextStyle } from 'pixi.js';

import { UI_FONT_BODY, UI_FONT_HEADER } from '@/ui/theme/uiTokens';
import { hexToPixiColor } from '@/ui/pixi/color';

export const SHOP_PANEL_FACE_HEX = '#1a1f21';
export const SHOP_PANEL_FACE_COLOR = hexToPixiColor(SHOP_PANEL_FACE_HEX);

export const SHOP_HIT_TRAIL_FACE_HEX = '#aa2222';
export const SHOP_HIT_TRAIL_FACE_COLOR = hexToPixiColor(SHOP_HIT_TRAIL_FACE_HEX);

export const SHOP_REROLL_FACE_HEX = '#2d6b2d';
export const SHOP_REROLL_FACE_COLOR = hexToPixiColor(SHOP_REROLL_FACE_HEX);

export const SHOP_PERMIT_TAB_COLOR = 0x6b4caa;

export const SHOP_PERMIT_LABEL_COLOR = '#ccccdd';

export function shopPermitLabelTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 14,
    fontWeight: '700',
    fill: SHOP_PERMIT_LABEL_COLOR,
    align: 'center',
    letterSpacing: 1,
  });
}

export function shopButtonLabelTextStyle(fontSize = 14): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize,
    fill: '#ffffff',
    align: 'center',
    lineHeight: fontSize + 4,
  });
}

export function shopToastTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 16,
    fill: '#ffd700',
    align: 'center',
  });
}
