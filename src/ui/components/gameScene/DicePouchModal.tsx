import { Rectangle, TextStyle } from 'pixi.js';
import { useCallback, useMemo } from 'react';

import { FONTS, TEXT_COLORS, UI } from '@/game/Constants';
import { useRunStoreRevision } from '@/game/store/reactHooks';
import { selectDicePouchCounts, selectDicePouchSnapshot } from '@/game/store/selectors/uiSelectors';
import { Button } from '@/ui/components/Button/Button';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export type DicePouchModalProps = {
  metrics: GameScenePixiLayoutMetrics;
  screenW: number;
  screenH: number;
  onClose: () => void;
};

const titleStyle = new TextStyle({
  fontFamily: FONTS.HEADING,
  fontSize: 24,
  fill: TEXT_COLORS.GOLD,
});

const bodyStyle = new TextStyle({
  fontFamily: FONTS.PRIMARY,
  fontSize: 14,
  fill: TEXT_COLORS.SECONDARY,
});

export function DicePouchModal({ metrics, screenW, screenH, onClose }: DicePouchModalProps) {
  const counts = useRunStoreRevision(selectDicePouchSnapshot, selectDicePouchCounts);
  const spentCount = counts.total - counts.available;

  const panelW = Math.min(metrics.contentW - 40, 700);
  const panelH = Math.min(screenH - 80, 500);
  const panelX = metrics.contentX + (metrics.contentW - panelW) / 2;
  const panelY = (screenH - panelH) / 2;

  const dimHitArea = useMemo(() => new Rectangle(0, 0, screenW, screenH), [screenH, screenW]);

  const summaryText = `${counts.total} total dice (${counts.available} available, ${spentCount} spent)`;

  const onDimTap = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <pixiContainer zIndex={500} sortableChildren eventMode="passive">
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.fill({ color: 0x000000, alpha: UI.MODAL_DIM_ALPHA });
          g.rect(0, 0, screenW, screenH);
          g.fill();
        }}
        hitArea={dimHitArea}
        eventMode="static"
        onPointerTap={onDimTap}
      />

      <pixiContainer x={panelX} y={panelY} eventMode="static">
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.fill({ color: UI.MODAL_BG });
            g.roundRect(0, 0, panelW, panelH, UI.MODAL_RADIUS);
            g.fill();
            g.stroke({ color: UI.MODAL_BORDER, width: 2 });
            g.roundRect(0, 0, panelW, panelH, UI.MODAL_RADIUS);
            g.stroke();
          }}
          eventMode="none"
        />

        <pixiText text="Dice Pouch" style={titleStyle} anchor={{ x: 0.5, y: 0 }} x={panelW / 2} y={24} eventMode="none" />

        <pixiText text={summaryText} style={bodyStyle} anchor={{ x: 0.5, y: 0 }} x={panelW / 2} y={72} eventMode="none" />

        <pixiText
          text="Dice list — coming soon"
          style={bodyStyle}
          anchor={{ x: 0.5, y: 0 }}
          x={panelW / 2}
          y={panelH / 2}
          eventMode="none"
        />

        <Button
          x={panelW - 100}
          y={panelH - 48}
          width={80}
          height={32}
          label="Close"
          variant="neutral"
          onClick={onClose}
        />
      </pixiContainer>
    </pixiContainer>
  );
}
