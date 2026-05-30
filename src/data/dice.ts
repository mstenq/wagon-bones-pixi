/** Dice catalog — export only, no imports. */

export const DICE_COUNT = 8;

export const DICE_TYPES = [
  "standard",
  "wooden",
  "stone",
  "steel",
  "gold",
  "bone",
  "diamond",
  "lucky",
  "loaded",
] as const;

export type DiceType = (typeof DICE_TYPES)[number];

export const DICE_LABELS: Record<DiceType, string> = {
  standard: "Standard",
  wooden: "Wooden",
  stone: "Stone",
  steel: "Steel",
  gold: "Gold",
  bone: "Bone",
  diamond: "Diamond",
  lucky: "Lucky",
  loaded: "Loaded",
};
