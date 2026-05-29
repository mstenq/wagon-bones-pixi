import { useApplication, useTick } from "@pixi/react";
import { useCallback, useMemo, useState } from "react";

import { CardsHand } from "@/ui/components/CardBar/CardBar";
import { DiceRow } from "@/ui/components/DiceRow.tsx/DiceRow";
import { computeGameLayout } from "@/ui/layout/gameLayout";

import "@/ui/pixi/extend";



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

  const layout = useMemo(
    () => computeGameLayout(screenSize.w, screenSize.h),
    [screenSize.h, screenSize.w],
  );

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <CardsHand layout={layout.cards} />
      <DiceRow layout={layout.dice} />
    </pixiContainer>
  );
}
