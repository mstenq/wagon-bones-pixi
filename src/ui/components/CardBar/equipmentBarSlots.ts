import { getBossEquipmentDisplayOrder } from '@/game/BossEffectsSystem';
import { getRunState } from '@/game/store/runStore';
import type { RunState, StoredEquipmentInstance } from '@/game/store/types';

export type EquipmentBarSlot = {
  equipIndex: number;
  stored: StoredEquipmentInstance;
};

function identityEquipmentBarSlots(equipment: StoredEquipmentInstance[]): EquipmentBarSlot[] {
  return equipment.map((stored, equipIndex) => ({ equipIndex, stored }));
}

/** Visual equipment bar slots respecting Land Slide display order (pure read — sync boss order separately). */
export function selectEquipmentBarSlots(state: RunState = getRunState()): EquipmentBarSlot[] {
  const equipment = state.equipment;
  if (equipment.length === 0) {
    return [];
  }

  const displayOrder = getBossEquipmentDisplayOrder();
  if (!displayOrder || displayOrder.length !== equipment.length) {
    return identityEquipmentBarSlots(equipment);
  }

  const slots: EquipmentBarSlot[] = [];
  for (const equipIndex of displayOrder) {
    const stored = equipment[equipIndex];
    if (!stored) {
      return identityEquipmentBarSlots(equipment);
    }
    slots.push({ equipIndex, stored });
  }

  return slots;
}
