import { useApplication, useTick } from '@pixi/react';
import { useCallback, useMemo, useState } from 'react';

import { CardContainer } from '@/ui/components/CardContainer/CardContainer';
import { DiceRow } from '@/ui/components/DiceRow/DiceRow';
import { computeGameLayout, computeViewportMetrics } from '@/ui/layout/gameLayout';

export function GameScene() {
  const { app } = useApplication();
  const [screenSize, setScreenSize] = useState(() => ({
    w: app.screen.width,
    h: app.screen.height,
  }));

  const syncScreenSize = useCallback(() => {
    const w = app.screen.width;
    const h = app.screen.height;
    setScreenSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, [app]);

  useTick(syncScreenSize);

  const viewport = useMemo(() => computeViewportMetrics(screenSize.w, screenSize.h), [screenSize.h, screenSize.w]);

  const layout = useMemo(
    () => computeGameLayout(viewport.layoutW, viewport.layoutH),
    [viewport.layoutH, viewport.layoutW],
  );

  const gameContent = (
    <>
      <CardContainer layout={layout.cards} />
      <DiceRow layout={layout.dice} />
    </>
  );

  if (viewport.scale >= 1) {
    return (
      <pixiContainer sortableChildren eventMode="passive">
        {gameContent}
      </pixiContainer>
    );
  }

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <pixiContainer
        x={screenSize.w / 2}
        y={screenSize.h / 2}
        scale={viewport.scale}
        sortableChildren
        eventMode="passive"
      >
        <pixiContainer x={-viewport.layoutW / 2} y={-viewport.layoutH / 2} sortableChildren eventMode="passive">
          {gameContent}
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}
