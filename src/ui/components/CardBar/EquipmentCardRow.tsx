import { use, useCallback, useMemo, useRef } from 'react';

import {
  getBossEquipmentDisplayOrder,
  remapEquipmentDisplayOrderAfterRemove,
  remapEquipmentDisplayOrderAfterReorder,
  syncEquipmentDisplayOrder,
} from '@/game/BossEffectsSystem';
import { isEquipmentCursed } from '@/game/ItemsSystem';
import { equipmentActions } from '@/game/store/actions/equipmentActions';
import { useGameRunStore } from '@/game/store/reactHooks';
import { runStore } from '@/game/store/runStore';
import { resolveEquipmentInstance } from '@/game/store/resolve';
import { selectEquipmentBarSnapshot } from '@/game/store/selectors/uiSelectors';
import { getShopEquipmentTexture, shopCardTexturesReady } from '@/ui/shop/shopCardTextures';
import { auraIdToEffectId } from '@/ui/components/CardBar/auraEffectId';
import { EQUIPMENT_CARD_BAR_THEME } from '@/ui/components/CardBar/cardBarTheme';
import { selectEquipmentBarSlots } from '@/ui/components/CardBar/equipmentBarSlots';
import { storedEquipmentInstanceId } from '@/ui/components/CardBar/inventoryItemId';
import { InventoryCardRow } from '@/ui/components/CardBar/InventoryCardRow';
import { Card } from '@/ui/components/Card/Card';
import type { RowReorderMove } from '@/ui/interaction/useReorderableRow';

export type EquipmentCardRowProps = {
  bar: { w: number; h: number };
};

export function EquipmentCardRow({ bar }: EquipmentCardRowProps) {
  use(shopCardTexturesReady);

  const revision = useGameRunStore(selectEquipmentBarSnapshot);
  const purchasedPermitsRevision = useGameRunStore((state) => state.purchasedPermits.join('|'));

  const syncedRevisionRef = useRef<string | null>(null);
  if (syncedRevisionRef.current !== revision) {
    syncedRevisionRef.current = revision;
    syncEquipmentDisplayOrder();
  }

  const slots = useMemo(() => selectEquipmentBarSlots(runStore.getState()), [revision]);
  const itemIds = useMemo(() => slots.map((slot) => storedEquipmentInstanceId(slot.stored)), [slots]);
  const equipIndexByItemId = useMemo(
    () => new Map(slots.map((slot) => [storedEquipmentInstanceId(slot.stored), slot.equipIndex] as const)),
    [slots],
  );
  const slotByItemId = useMemo(
    () => new Map(slots.map((slot) => [storedEquipmentInstanceId(slot.stored), slot] as const)),
    [slots],
  );
  const purchasedPermits = useMemo(
    () => runStore.getState().purchasedPermits,
    [purchasedPermitsRevision],
  );

  const onPersistReorder = useCallback(
    (move: RowReorderMove<string>) => {
      const fromEquip = equipIndexByItemId.get(move.itemId);
      const toEquip = equipIndexByItemId.get(move.targetId);
      if (fromEquip === undefined || toEquip === undefined) {
        return;
      }
      equipmentActions.reorderEquipment(fromEquip, toEquip);
      if (getBossEquipmentDisplayOrder()) {
        remapEquipmentDisplayOrderAfterReorder(fromEquip, toEquip);
      }
    },
    [equipIndexByItemId],
  );

  return (
    <InventoryCardRow
      bar={bar}
      theme={EQUIPMENT_CARD_BAR_THEME}
      itemIds={itemIds}
      orderRevision={revision}
      getItemKey={(itemId) => itemId}
      onPersistReorder={onPersistReorder}
      renderCard={({ itemId, slotIndex, cardRef, hovered, dragging, selected, onSelectedChange }) => {
        const slot = slotByItemId.get(itemId);
        if (!slot) {
          return null;
        }

        let instance;
        try {
          instance = resolveEquipmentInstance(slot.stored, purchasedPermits);
        } catch {
          return null;
        }
        const cursed = isEquipmentCursed(instance);
        const theme = EQUIPMENT_CARD_BAR_THEME;
        const equipIndex = slot.equipIndex;

        return (
          <Card
            ref={cardRef}
            width={theme.cardWidth}
            height={theme.cardHeight}
            texture={getShopEquipmentTexture(slot.stored.defId)}
            effect={auraIdToEffectId(slot.stored.auraId)}
            phase={slotIndex * 1.35}
            hovered={hovered}
            dragging={dragging}
            displayMode="owned"
            sellPrice={cursed ? 0 : slot.stored.sellValue}
            onSell={() => {
              if (cursed) {
                return;
              }
              remapEquipmentDisplayOrderAfterRemove(equipIndex);
              equipmentActions.sellEquipment(equipIndex);
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
