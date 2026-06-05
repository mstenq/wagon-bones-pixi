import { TextStyle } from 'pixi.js';

import { TEXT_COLORS } from '@/game/Constants';
import type { PayoutAmountTone } from '@/game/store/types';
import { TAILWIND_500_HEX, UI_FONT_BODY, UI_FONT_HEADER } from '@/ui/theme/uiTokens';
import { hexToPixiColor } from '@/ui/pixi/color';

export const PAYOUT_PANEL_FACE_HEX = '#1a1f21';

export const PAYOUT_TITLE_COLOR = hexToPixiColor(TAILWIND_500_HEX.green);
export const PAYOUT_SUBTITLE_COLOR = hexToPixiColor(TEXT_COLORS.SECONDARY);
export const PAYOUT_SCORE_COLOR = hexToPixiColor(TEXT_COLORS.SCORE_GREEN);
export const PAYOUT_ROW_LABEL_COLOR = hexToPixiColor(TEXT_COLORS.PRIMARY);
export const PAYOUT_ROW_HIGHLIGHT_COLOR = hexToPixiColor(TEXT_COLORS.GOLD);
export const PAYOUT_ROW_MONEY_COLOR = hexToPixiColor(TEXT_COLORS.MONEY);
export const PAYOUT_PANEL_FACE_COLOR = hexToPixiColor(PAYOUT_PANEL_FACE_HEX);

export function payoutTitleTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 28,
    fill: PAYOUT_TITLE_COLOR,
    align: 'center',
  });
}

export function payoutSubtitleTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 16,
    fill: PAYOUT_SUBTITLE_COLOR,
    align: 'center',
  });
}

export function payoutScoreTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 20,
    fill: PAYOUT_SCORE_COLOR,
    align: 'center',
  });
}

export function payoutRowLabelTextStyle(highlight: boolean): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_BODY,
    fontSize: 16,
    fill: highlight ? PAYOUT_ROW_HIGHLIGHT_COLOR : PAYOUT_ROW_LABEL_COLOR,
    align: 'left',
  });
}

function payoutAmountToneColor(tone: PayoutAmountTone | undefined): number {
  if (tone === 'error') {
    return hexToPixiColor(TEXT_COLORS.ERROR_RED);
  }
  return PAYOUT_ROW_MONEY_COLOR;
}

export function payoutRowAmountTextStyle(amountTone?: PayoutAmountTone): TextStyle {
  return new TextStyle({
    fontFamily: UI_FONT_HEADER,
    fontSize: 18,
    fill: payoutAmountToneColor(amountTone),
    align: 'right',
  });
}
