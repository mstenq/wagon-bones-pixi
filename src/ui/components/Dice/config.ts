import type { DiceEnhancement } from '@/game/types';
import type { DiceType } from '@/data/dice';

export { DICE_COUNT, DICE_ENHANCEMENT_OPTIONS, DICE_LABELS, DICE_TYPES, type DiceType } from '@/data/dice';

export function diceTypeFromEnhancement(enhancement: DiceEnhancement): DiceType {
  if (enhancement === null) {
    return 'standard';
  }
  return enhancement;
}

export type DieMode = 'base' | 'selected' | 'debuffed' | 'playedNonScoring' | 'locked';

export const DIE_MODES: DieMode[] = ['base', 'selected', 'debuffed', 'playedNonScoring', 'locked'];

export const DIE_MODE_LABELS: Record<DieMode, string> = {
  base: 'Base',
  selected: 'Selected',
  debuffed: 'Debuffed',
  playedNonScoring: 'Played (non-scoring)',
  locked: 'Locked',
};

export const DIE_SELECTED_LIFT_PX = 30;
/** Dragged die within the row, and DiceRow vs sibling rows (e.g. CardContainer). */
export const DICE_DRAG_Z_INDEX = 1000;

/** Row arc: vertical drop at center slot (px). */
export const DIE_ROW_ARC_DROP_PX = 16;
/** Row arc: extra uniform scale at end slots (0.05 → +5%). */
export const DIE_ROW_SCALE_BOOST = 0.045;

export function dieModeAlpha(mode: DieMode): number {
  if (mode === 'debuffed') {
    return 0.8;
  }
  if (mode === 'playedNonScoring') {
    return 0.7;
  }
  return 1;
}
