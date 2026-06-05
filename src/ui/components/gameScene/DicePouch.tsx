import { Rectangle, TextStyle } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import { useCallback, useMemo, useRef, useState } from 'react';

import { COLORS, FONTS, TEXT_COLORS, UI } from '@/game/Constants';
import { useRunStoreRevision } from '@/game/store/reactHooks';
import { selectDicePouchCounts, selectDicePouchSnapshot } from '@/game/store/selectors/uiSelectors';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export type DicePouchProps = {
  layout: GameScenePixiLayoutMetrics['dicePouch'];
  onOpen: () => void;
};

const countStyle = new TextStyle({
  fontFamily: FONTS.PRIMARY,
  fontSize: 11,
  fill: TEXT_COLORS.SECONDARY,
});

const iconStyle = new TextStyle({
  fontSize: 22,
});

export function DicePouch({ layout, onOpen }: DicePouchProps) {
  const counts = useRunStoreRevision(selectDicePouchSnapshot, selectDicePouchCounts);
  const [hovered, setHovered] = useState(false);
  const gfxRef = useRef<Graphics | null>(null);

  const size = layout.size;
  const hitArea = useMemo(() => new Rectangle(0, 0, size, size), [size]);

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const fill = hovered ? COLORS.BTN_HOVER : COLORS.SIDEBAR_SECTION;
      graphics.fill({ color: fill, alpha: 1 });
      graphics.roundRect(0, 0, size, size, 8);
      graphics.fill();
      graphics.stroke({ color: COLORS.SIDEBAR_SECTION_BORDER, width: 1, alpha: 0.8 });
      graphics.roundRect(0, 0, size, size, 8);
      graphics.stroke();
    },
    [hovered, size],
  );

  const countText = `${counts.available}/${counts.total}`;

  return (
    <pixiContainer
      x={layout.x}
      y={layout.y}
      zIndex={150}
      hitArea={hitArea}
      eventMode="static"
      cursor="pointer"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerTap={onOpen}
    >
      <pixiGraphics ref={gfxRef} draw={draw} eventMode="none" />
      <pixiText text="🎲" style={iconStyle} anchor={0.5} x={size / 2} y={size / 2 - 8} eventMode="none" />
      <pixiText text={countText} style={countStyle} anchor={0.5} x={size / 2} y={size / 2 + 14} eventMode="none" />
    </pixiContainer>
  );
}
