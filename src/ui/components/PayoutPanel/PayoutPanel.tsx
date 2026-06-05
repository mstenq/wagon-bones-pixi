import { useTick } from '@pixi/react';
import { useMemo, useRef } from 'react';
import type { Graphics } from 'pixi.js';

import type { PayoutRow } from '@/game/store/types';
import { drawButtonFace, drawButtonShadow } from '@/ui/components/Button/buttonVisuals';
import {
  PAYOUT_PANEL_FACE_COLOR,
  payoutRowAmountTextStyle,
  payoutRowLabelTextStyle,
  payoutScoreTextStyle,
  payoutSubtitleTextStyle,
  payoutTitleTextStyle,
} from '@/ui/components/PayoutPanel/payoutTheme';
import {
  PAYOUT_PANEL_ROW_HEIGHT,
  payoutPanelInnerLayout,
  payoutPanelInnerOffsets,
} from '@/ui/payout/payoutLayout';
import { NEO_BORDER_COLOR } from '@/ui/theme/uiTokens';

export type PayoutPanelProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  scoreLine: string;
  rows: PayoutRow[];
};

const PANEL_PADDING_X = 24;

function drawPanelDivider(graphics: Graphics, panelWidth: number, dividerY: number): void {
  const leftX = -panelWidth / 2 + 20;
  const rightX = panelWidth / 2 - 20;

  graphics.clear();
  graphics.moveTo(leftX, dividerY);
  graphics.lineTo(rightX, dividerY);
  graphics.stroke({
    color: NEO_BORDER_COLOR,
    width: 1,
    alpha: 0.5,
    alignment: 1,
  });
}

export function PayoutPanel({ x, y, width, height, title, subtitle, scoreLine, rows }: PayoutPanelProps) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const scoreDividerRef = useRef<Graphics | null>(null);

  const titleStyle = useMemo(() => payoutTitleTextStyle(), []);
  const subtitleStyle = useMemo(() => payoutSubtitleTextStyle(), []);
  const scoreStyle = useMemo(() => payoutScoreTextStyle(), []);

  const panelTheme = useMemo(
    () => ({
      face: PAYOUT_PANEL_FACE_COLOR,
      disabledFace: PAYOUT_PANEL_FACE_COLOR,
    }),
    [],
  );

  const panelTop = -height / 2;
  const inner = payoutPanelInnerLayout;
  const offsets = payoutPanelInnerOffsets;

  const titleY = panelTop + inner.titleY;
  const subtitleY = titleY + inner.titleLineHeight;
  const scoreY = subtitleY + inner.subtitleLineHeight;
  const scoreDividerY = panelTop + offsets.scoreDividerY;
  const rowStartY = panelTop + offsets.rowsStartY;

  const leftX = -width / 2 + PANEL_PADDING_X;
  const rightX = width / 2 - PANEL_PADDING_X;

  useTick(() => {
    if (shadowRef.current) {
      drawButtonShadow(shadowRef.current, width, height);
    }
    if (faceRef.current) {
      drawButtonFace(faceRef.current, width, height, panelTheme, false);
    }
    if (scoreDividerRef.current) {
      drawPanelDivider(scoreDividerRef.current, width, scoreDividerY);
    }
  });

  return (
    <pixiContainer x={x} y={y} sortableChildren eventMode="passive">
      <pixiGraphics ref={shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        <pixiGraphics ref={faceRef} eventMode="none" draw={() => {}} />
        <pixiGraphics ref={scoreDividerRef} eventMode="none" draw={() => {}} />

        <pixiText text={title} style={titleStyle} anchor={{ x: 0.5, y: 0 }} y={titleY} eventMode="none" />

        <pixiText text={subtitle} style={subtitleStyle} anchor={{ x: 0.5, y: 0 }} y={subtitleY} eventMode="none" />

        <pixiText text={scoreLine} style={scoreStyle} anchor={{ x: 0.5, y: 0 }} y={scoreY} eventMode="none" />

        {rows.map((row, index) => {
          const rowY = rowStartY + index * PAYOUT_PANEL_ROW_HEIGHT;
          const labelStyle = payoutRowLabelTextStyle(!!row.highlight);
          const amountStyle = payoutRowAmountTextStyle(row.amountTone);

          return (
            <pixiContainer key={`${row.label}-${index}`} eventMode="none">
              <pixiText text={row.label} style={labelStyle} anchor={{ x: 0, y: 0 }} x={leftX} y={rowY} eventMode="none" />
              <pixiText
                text={row.amount}
                style={amountStyle}
                anchor={{ x: 1, y: 0 }}
                x={rightX}
                y={rowY}
                eventMode="none"
              />
            </pixiContainer>
          );
        })}
      </pixiContainer>
    </pixiContainer>
  );
}
