import { useMemo } from 'react';

import type { ConsumableDef } from '@/game/ConsumablesSystem';
import type { RunState } from '@/game/store/types';
import { useGameRunStore } from '@/game/store/reactHooks';
import { CardBarPanel } from '@/ui/components/gameScene/CardBarPanel';
import { ConsumableCardRow } from '@/ui/components/CardBar/ConsumableCardRow';
import { EquipmentCardRow } from '@/ui/components/CardBar/EquipmentCardRow';
import type { GameScenePixiLayoutMetrics } from '@/ui/layout/gameScenePixiLayout';

export type InventoryBarProps = {
  variant: 'equipment' | 'consumable';
  layout: GameScenePixiLayoutMetrics['equipBar'];
  snapshotSelector: (state: RunState) => string;
  labelSelector: (state: RunState) => string;
  canUseConsumable?: (def: ConsumableDef) => boolean;
};

export function InventoryBar({
  variant,
  layout,
  snapshotSelector,
  labelSelector,
  canUseConsumable,
}: InventoryBarProps) {
  const slotLabel = useGameRunStore(labelSelector);
  useGameRunStore(snapshotSelector);

  const bar = useMemo(() => ({ w: layout.w, h: layout.h }), [layout.h, layout.w]);

  return (
    <pixiContainer x={layout.x} y={layout.y} sortableChildren eventMode="passive">
      <CardBarPanel x={0} y={0} width={layout.w} height={layout.h} slotLabel={slotLabel} />
      {variant === 'equipment' ? (
        <EquipmentCardRow bar={bar} />
      ) : (
        <ConsumableCardRow bar={bar} canUseConsumable={canUseConsumable!} />
      )}
    </pixiContainer>
  );
}
