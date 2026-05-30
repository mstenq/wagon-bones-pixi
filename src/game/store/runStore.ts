import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import { DICE_COUNT, type DiceType } from "@/data/dice";
import { rollD12, rollMany } from "@/game/dice/roll";
import { createInitialRunState, type RunState } from "@/game/store/types";

type RunActions = {
  setDiceType: (type: DiceType) => void;
  setDiceOrder: (order: number[]) => void;
  requestRoll: () => void;
  completeRoll: (results: number[]) => void;
  setCardOrder: (order: number[]) => void;
  selectCard: (cardId: number | null) => void;
  sellCard: (cardId: number) => void;
};

export type RunStore = RunState & RunActions;

export const runStore = createStore<RunStore>((set, get) => ({
  ...createInitialRunState(),

  setDiceType(type) {
    set({ diceType: type });
  },

  setDiceOrder(order) {
    set({ diceOrder: order });
  },

  requestRoll() {
    const { isRolling } = get();
    if (isRolling) {
      return;
    }
    set({
      isRolling: true,
      rollTargets: rollMany(DICE_COUNT),
    });
  },

  completeRoll(results) {
    set({
      dieValues: results,
      isRolling: false,
      rollTargets: null,
    });
  },

  setCardOrder(order) {
    set({ cardOrder: order });
  },

  selectCard(cardId) {
    set({ selectedCardId: cardId });
  },

  sellCard(cardId) {
    // Placeholder until full economy/equipment systems land.
    console.log("sell card", cardId);
    set({ selectedCardId: null });
  },
}));

export function getRunState(): RunStore {
  return runStore.getState();
}

export function useRunStore<T>(selector: (state: RunStore) => T): T {
  return useStore(runStore, selector);
}

/** Spinning placeholder value during roll animation. */
export function rollSpinFrame(): number {
  return rollD12();
}
