import {
  DIE_ROW_ARC_DROP_PX,
  DIE_ROW_SCALE_BOOST,
} from "@/ui/components/Dice/config";

export type RowArcPose = {
  yOffset: number;
  scale: number;
};

/** Normalized horizontal position in row: -1 (left) … 0 (center) … +1 (right). */
export function rowSlotT(slotIndex: number, count: number): number {
  if (count <= 1) {
    return 0;
  }
  return (slotIndex / (count - 1)) * 2 - 1;
}

/**
 * Arc pose for a slot in a horizontal row (Y offset and scale).
 * @param strength 0 = flat (e.g. while dragging), 1 = full arc.
 */
export function rowArcPose(
  slotIndex: number,
  count: number,
  strength = 1,
): RowArcPose {
  const t = rowSlotT(slotIndex, count);
  const centerWeight = 1 - t * t;
  const endWeight = 1 - centerWeight;
  const blend = strength;

  return {
    yOffset: -centerWeight * DIE_ROW_ARC_DROP_PX * blend,
    scale: 1 + endWeight * DIE_ROW_SCALE_BOOST * blend,
  };
}
