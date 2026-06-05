import { TextStyle } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';

import { COLORS, FONTS, TEXT_COLORS } from '@/game/Constants';

export type CardBarPanelProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  slotLabel: string;
};

const slotLabelStyle = new TextStyle({
  fontFamily: FONTS.PRIMARY,
  fontSize: 11,
  fill: TEXT_COLORS.MUTED,
});

export function CardBarPanel({ x, y, width, height, slotLabel }: CardBarPanelProps) {
  const gfxRef = useRef<Graphics | null>(null);

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.fill({ color: COLORS.BG_PRIMARY, alpha: 0.6 });
      graphics.roundRect(0, 0, width, height, 8);
      graphics.fill();
      graphics.stroke({ color: COLORS.SIDEBAR_SECTION_BORDER, width: 1, alpha: 0.5 });
      graphics.roundRect(0, 0, width, height, 8);
      graphics.stroke();
    },
    [height, width],
  );

  return (
    <pixiContainer x={x} y={y} eventMode="passive">
      <pixiGraphics ref={gfxRef} draw={draw} eventMode="none" />
      <pixiText text={slotLabel} style={slotLabelStyle} anchor={{ x: 1, y: 1 }} x={width - 8} y={height - 4} />
    </pixiContainer>
  );
}
