import type { ConsumableInstance } from '@/game/ConsumablesSystem';
import type { StoredEquipmentInstance } from '@/game/store/types';

/** Stable drag identity for an equipment instance (survives storage-index reorder). */
export function storedEquipmentInstanceId(stored: StoredEquipmentInstance): string {
  return [
    stored.defId,
    stored.sellValue,
    stored.auraId ?? '',
    JSON.stringify(stored.state),
    (stored.modifiers ?? []).join(','),
    stored.perishableRoundsLeft ?? '',
  ].join(':');
}

/** Stable drag identity for a consumable instance (survives array-index reorder). */
export function consumableInstanceId(consumable: ConsumableInstance): string {
  return [
    consumable.def.id,
    consumable.sellValue,
    consumable.def.aura?.id ?? '',
    consumable.lastUsedConsumableIdBeforeUse ?? '',
  ].join(':');
}
