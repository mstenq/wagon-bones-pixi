import type { Graphics } from 'pixi.js';
import { useCallback, useRef } from 'react';

import { COLORS, UI } from '@/game/Constants';

export type FeltOverlayProps = {
  width: number;
  height: number;
};

export function FeltOverlay({ width, height }: FeltOverlayProps) {
  const gfxRef = useRef<Graphics | null>(null);

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      graphics.fill({ color: COLORS.BG_FELT, alpha: UI.FELT_ALPHA });
      graphics.roundRect(0, 0, width, height, UI.FELT_RADIUS);
      graphics.fill();
    },
    [height, width],
  );

  return <pixiGraphics ref={gfxRef} draw={draw} eventMode="none" />;
}
