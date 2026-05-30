import type { DiceType } from "@/data/dice";
import { getRunState } from "@/game/store/runStore";

export const gameFacade = {
  dice: {
    getType: () => getRunState().diceType,
    setType: (type: DiceType) => getRunState().setDiceType(type),
    getValues: () => getRunState().dieValues,
    getOrder: () => getRunState().diceOrder,
    setOrder: (order: number[]) => getRunState().setDiceOrder(order),
    isRolling: () => getRunState().isRolling,
    getRollTargets: () => getRunState().rollTargets,
    roll: () => getRunState().requestRoll(),
    completeRoll: (results: number[]) => getRunState().completeRoll(results),
  },
  cards: {
    getOrder: () => getRunState().cardOrder,
    setOrder: (order: number[]) => getRunState().setCardOrder(order),
    getSelectedId: () => getRunState().selectedCardId,
    selectCard: (cardId: number | null) => getRunState().selectCard(cardId),
    sellCard: (cardId: number) => getRunState().sellCard(cardId),
  },
} as const;

export { gameFacade as default };
