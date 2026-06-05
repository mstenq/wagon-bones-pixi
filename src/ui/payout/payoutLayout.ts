import type { PayoutRow } from '@/game/store/types';

const PANEL_MAX_WIDTH = 420;
const PANEL_SIDE_MARGIN = 48;
const ROW_HEIGHT = 40;
const PANEL_TOP_PADDING = 20;
const PANEL_BOTTOM_PADDING = 20;
const DIVIDER_SECTION_HEIGHT = 14;
const BUTTON_GAP = 30;
const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 300;
const CONTENT_BOTTOM_PADDING = 36;

/** Vertical offsets inside the panel face (from panel top edge). */
export const payoutPanelInnerLayout = {
  topPadding: PANEL_TOP_PADDING,
  titleY: PANEL_TOP_PADDING,
  titleLineHeight: 32,
  subtitleLineHeight: 22,
  scoreLineHeight: 24,
} as const;

const TITLE_BLOCK_HEIGHT =
  payoutPanelInnerLayout.titleLineHeight +
  payoutPanelInnerLayout.subtitleLineHeight +
  payoutPanelInnerLayout.scoreLineHeight;

export const payoutPanelInnerOffsets = {
  scoreDividerY: PANEL_TOP_PADDING + TITLE_BLOCK_HEIGHT,
  rowsStartY: PANEL_TOP_PADDING + TITLE_BLOCK_HEIGHT + DIVIDER_SECTION_HEIGHT,
} as const;

export type PayoutLayout = {
  contentCX: number;
  panel: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  };
  buttonY: number;
  buttonWidth: number;
  buttonHeight: number;
};

export function computePayoutPanelHeight(rowCount: number): number {
  return (
    PANEL_TOP_PADDING +
    TITLE_BLOCK_HEIGHT +
    DIVIDER_SECTION_HEIGHT +
    rowCount * ROW_HEIGHT +
    PANEL_BOTTOM_PADDING
  );
}

/** Lay out payout UI within the chrome content band (coordinates relative to content top-left). */
export function computePayoutLayout(contentW: number, contentH: number, rows: PayoutRow[]): PayoutLayout {
  const contentCX = contentW / 2;
  const contentMidY = contentH / 2;
  const contentBottom = contentH;

  const panelW = Math.min(PANEL_MAX_WIDTH, contentW - PANEL_SIDE_MARGIN);
  const panelH = computePayoutPanelHeight(rows.length);
  const panelTopY = contentMidY - panelH / 2;

  const buttonY = Math.min(panelTopY + panelH + BUTTON_GAP + BUTTON_HEIGHT / 2, contentBottom - CONTENT_BOTTOM_PADDING);

  return {
    contentCX,
    panel: {
      centerX: contentCX,
      centerY: panelTopY + panelH / 2,
      width: panelW,
      height: panelH,
    },
    buttonY,
    buttonWidth: BUTTON_WIDTH,
    buttonHeight: BUTTON_HEIGHT,
  };
}

export const PAYOUT_PANEL_ROW_HEIGHT = ROW_HEIGHT;
