import { useApplication, useTick } from '@pixi/react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { DicePouch } from '@/ui/components/gameScene/DicePouch';
import { DicePouchModal } from '@/ui/components/gameScene/DicePouchModal';
import { InventoryBar } from '@/ui/components/gameScene/InventoryBar';
import { FeltOverlay } from '@/ui/components/gameScene/FeltOverlay';
import { TagStack } from '@/ui/components/gameScene/TagStack';
import {
  selectConsumableBarSlotLabel,
  selectConsumableBarSnapshot,
  selectEquipmentBarSlotLabel,
  selectEquipmentBarSnapshot,
} from '@/game/store/selectors/uiSelectors';
import {
  computeGameScenePixiLayout,
  computeGameSceneViewportMetrics,
  type GameScenePixiLayoutMetrics,
} from '@/ui/layout/gameScenePixiLayout';

export type GameSceneContentSize = {
  w: number;
  h: number;
};

export type GameSceneChromeContext = {
  pouchLaunch: { x: number; y: number };
};

export type GameScenePixiLayoutProps = {
  children: (contentSize: GameSceneContentSize, chrome: GameSceneChromeContext) => ReactNode;
};

type ChromeLayerProps = {
  layoutW: number;
  layoutH: number;
  metrics: GameScenePixiLayoutMetrics;
  pouchModalOpen: boolean;
  onOpenPouch: () => void;
  onClosePouch: () => void;
  children: ReactNode;
};

function ChromeLayer({
  layoutW,
  layoutH,
  metrics,
  pouchModalOpen,
  onOpenPouch,
  onClosePouch,
  children,
}: ChromeLayerProps) {
  return (
    <pixiContainer sortableChildren eventMode="passive">
      <FeltOverlay width={layoutW} height={layoutH} />
      <InventoryBar
        layout={metrics.equipBar}
        snapshotSelector={selectEquipmentBarSnapshot}
        labelSelector={selectEquipmentBarSlotLabel}
      />
      <InventoryBar
        layout={metrics.consumableBar}
        snapshotSelector={selectConsumableBarSnapshot}
        labelSelector={selectConsumableBarSlotLabel}
      />
      <pixiContainer y={metrics.contentTop} sortableChildren eventMode="passive">
        {children}
      </pixiContainer>
      <TagStack metrics={metrics} />
      <DicePouch layout={metrics.dicePouch} onOpen={onOpenPouch} />
      {pouchModalOpen ? (
        <DicePouchModal metrics={metrics} screenW={layoutW} screenH={layoutH} onClose={onClosePouch} />
      ) : null}
    </pixiContainer>
  );
}

export function GameScenePixiLayout({ children }: GameScenePixiLayoutProps) {
  const { app } = useApplication();
  const [screenSize, setScreenSize] = useState(() => ({
    w: app.screen.width,
    h: app.screen.height,
  }));
  const [pouchModalOpen, setPouchModalOpen] = useState(false);

  const syncScreenSize = useCallback(() => {
    const w = app.screen.width;
    const h = app.screen.height;
    setScreenSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, [app]);

  useTick(syncScreenSize);

  const viewport = useMemo(
    () => computeGameSceneViewportMetrics(screenSize.w, screenSize.h),
    [screenSize.h, screenSize.w],
  );

  const metrics = useMemo(
    () => computeGameScenePixiLayout(viewport.layoutW, viewport.layoutH),
    [viewport.layoutH, viewport.layoutW],
  );

  const contentSize = useMemo(
    (): GameSceneContentSize => ({ w: metrics.contentW, h: metrics.contentH }),
    [metrics.contentH, metrics.contentW],
  );

  const pouchLaunch = {
    x: metrics.dicePouch.x + metrics.dicePouch.size / 2,
    y: metrics.dicePouch.y + metrics.dicePouch.size / 2 - metrics.contentTop,
  };
  const sceneContent = children(contentSize, { pouchLaunch });

  const chrome = (
    <ChromeLayer
      layoutW={viewport.layoutW}
      layoutH={viewport.layoutH}
      metrics={metrics}
      pouchModalOpen={pouchModalOpen}
      onOpenPouch={() => setPouchModalOpen(true)}
      onClosePouch={() => setPouchModalOpen(false)}
    >
      {sceneContent}
    </ChromeLayer>
  );

  if (viewport.scale >= 1) {
    return (
      <pixiContainer sortableChildren eventMode="passive">
        {chrome}
      </pixiContainer>
    );
  }

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <pixiContainer
        x={screenSize.w / 2}
        y={0}
        scale={viewport.scale}
        sortableChildren
        eventMode="passive"
      >
        <pixiContainer x={-viewport.layoutW / 2} y={0} sortableChildren eventMode="passive">
          {chrome}
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
}
