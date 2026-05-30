import { CARD_COUNT } from "@/data/items";
import { DICE_COUNT, type DiceType } from "@/data/dice";

export type RunState = {
  diceType: DiceType;
  /** Face values indexed by die id. */
  dieValues: number[];
  /** Slot order — each entry is a die id. */
  diceOrder: number[];
  isRolling: boolean;
  /** Targets for the in-flight roll animation; null when idle. */
  rollTargets: number[] | null;
  /** Card container slot order — each entry is a card id. */
  cardOrder: number[];
  selectedCardId: number | null;
};

export function createInitialRunState(): RunState {
  return {
    diceType: "standard",
    dieValues: Array(DICE_COUNT).fill(1),
    diceOrder: Array.from({ length: DICE_COUNT }, (_, index) => index),
    isRolling: false,
    rollTargets: null,
    cardOrder: Array.from({ length: CARD_COUNT }, (_, cardId) => cardId),
    selectedCardId: null,
  };
}
