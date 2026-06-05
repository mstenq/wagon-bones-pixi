import { use, useCallback, useMemo } from 'react';

import type { ConsumableDef } from '@/game/ConsumablesSystem';
import { gameFacade } from '@/game/facade';
import { consumableActions } from '@/game/store/actions/consumableActions';
import { useGameRunStore } from '@/game/store/reactHooks';
import { runStore } from '@/game/store/runStore';
import { resolveConsumableList } from '@/game/store/resolve';
import {
  selectCanUseSecondHelpings,
  selectConsumableBarSnapshot,
} from '@/game/store/selectors/uiSelectors';
import { auraIdToEffectId } from '@/ui/components/CardBar/auraEffectId';
import { CONSUMABLE_CARD_BAR_THEME } from '@/ui/components/CardBar/cardBarTheme';
import { consumableInstanceId } from '@/ui/components/CardBar/inventoryItemId';
import { InventoryCardRow } from '@/ui/components/CardBar/InventoryCardRow';
import { Card } from '@/ui/components/Card/Card';
import { playSfx } from '@/ui/audio/sfx';
import { getShopConsumableTexture, shopCardTexturesReady } from '@/ui/shop/shopCardTextures';
import type { RowReorderMove } from '@/ui/interaction/useReorderableRow';

export type ConsumableCardRowProps = {
  bar: { w: number; h: number };
  canUseConsumable: (def: ConsumableDef) => boolean;
};

export function ConsumableCardRow({ bar, canUseConsumable }: ConsumableCardRowProps) {
  use(shopCardTexturesReady);

  const revision = useGameRunStore(selectConsumableBarSnapshot);
  const canUseSecondHelpings = useGameRunStore(selectCanUseSecondHelpings);
  const consumables = useMemo(() => resolveConsumableList(runStore.getState()), [revision]);
  const itemIds = useMemo(() => consumables.map((consumable) => consumableInstanceId(consumable)), [consumables]);
  const slotIndexByItemId = useMemo(
    () =>
      new Map(
        consumables.map((consumable, index) => [consumableInstanceId(consumable), index] as const),
      ),
    [consumables],
  );
  const consumableByItemId = useMemo(
    () =>
      new Map(
        consumables.map((consumable) => [consumableInstanceId(consumable), consumable] as const),
      ),
    [consumables],
  );

  const onPersistReorder = useCallback((move: RowReorderMove<string>) => {
    consumableActions.reorderConsumable(move.fromSlot, move.toSlot);
  }, []);

  return (
    <InventoryCardRow
      bar={bar}
      theme={CONSUMABLE_CARD_BAR_THEME}
      itemIds={itemIds}
      orderRevision={revision}
      getItemKey={(itemId) => itemId}
      onPersistReorder={onPersistReorder}
      renderCard={({ itemId, slotIndex, cardRef, hovered, dragging, selected, onSelectedChange }) => {
        const consumable = consumableByItemId.get(itemId);
        const storeIndex = slotIndexByItemId.get(itemId);
        if (!consumable || storeIndex === undefined) {
          return null;
        }

        const canUseSecondHelpingsCard =
          consumable.def.id !== 'second_helpings' || canUseSecondHelpings;
        const canUseInScene = canUseConsumable(consumable.def);
        const useEnabled = canUseSecondHelpingsCard && canUseInScene;
        const theme = CONSUMABLE_CARD_BAR_THEME;

        return (
          <Card
            ref={cardRef}
            width={theme.cardWidth}
            height={theme.cardHeight}
            texture={getShopConsumableTexture(consumable.def.id, consumable.def.category)}
            effect={auraIdToEffectId(consumable.def.aura?.id)}
            phase={slotIndex * 1.35}
            hovered={hovered}
            dragging={dragging}
            displayMode="owned"
            sellPrice={consumable.sellValue}
            onSell={() => {
              consumableActions.sellConsumable(storeIndex);
            }}
            ownedUseAction={{
              label: 'USE',
              disabled: !useEnabled,
              onAction: () => {
                const consumed = consumableActions.useConsumable(storeIndex);
                if (!consumed) {
                  return;
                }
                playSfx('card1', { volume: 0.5 });
                gameFacade.consumable.use(consumed);
              },
            }}
            embedded
            selected={selected}
            onSelectedChange={onSelectedChange}
          />
        );
      }}
    />
  );
}
