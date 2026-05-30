import { DICE_COUNT } from "@/ui/components/Dice/config";
import { gameFacade } from "@/game/facade";
import { useRunStore } from "@/game/store/runStore";

export function RollDiceButton() {
  const isRolling = useRunStore((state) => state.isRolling);

  return (
    <button
      type="button"
      className="game-roll-button"
      onClick={() => gameFacade.dice.roll()}
      disabled={isRolling}
      aria-busy={isRolling}
    >
      {isRolling ? "Rolling…" : `Roll ${DICE_COUNT} dice`}
    </button>
  );
}
