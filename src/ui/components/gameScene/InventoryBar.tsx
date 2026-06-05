import type { RunState } from '@/game/store/types';
import { useRunStoreRevision } from '@/game/store/reactHooks';
import { CardBarPanel } from '@/ui/components/gameScene/CardBarPanel';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export type InventoryBarProps = {
  layout: GameScenePixiLayoutMetrics['equipBar'];
  snapshotSelector: (state: RunState) => string;
  labelSelector: (state: RunState) => string;
};

export function InventoryBar({ layout, snapshotSelector, labelSelector }: InventoryBarProps) {
  const slotLabel = useRunStoreRevision(snapshotSelector, labelSelector);

  return (
    <CardBarPanel
      x={layout.x}
      y={layout.y}
      width={layout.w}
      height={layout.h}
      slotLabel={slotLabel}
    />
  );
}
