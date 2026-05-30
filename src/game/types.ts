import type { DiceType } from "@/data/dice";
import type { ItemType } from "@/data/items";

/** Minimal die model — will grow when the full engine lands. */
export type Die = {
  id: number;
  type: DiceType;
  faceValue: number;
};

export type { DiceType, ItemType };
