/** Dice catalog — Pixi compatibility exports (no imports). */

export const DICE_COUNT = 8;

export const DICE_TYPES = [
  'standard',
  'wooden',
  'stone',
  'steel',
  'gold',
  'bone',
  'diamond',
  'lucky',
  'loaded',
] as const;

export type DiceType = (typeof DICE_TYPES)[number];

/** Alphabetical order for enhancement picker UIs. */
export const DICE_ENHANCEMENT_OPTIONS = [
  'bone',
  'diamond',
  'gold',
  'loaded',
  'lucky',
  'standard',
  'steel',
  'stone',
  'wooden',
] as const satisfies readonly DiceType[];

export const DICE_LABELS: Record<DiceType, string> = {
  standard: 'Standard',
  wooden: 'Wooden',
  stone: 'Stone',
  steel: 'Steel',
  gold: 'Gold',
  bone: 'Bone',
  diamond: 'Diamond',
  lucky: 'Lucky',
  loaded: 'Loaded',
};
