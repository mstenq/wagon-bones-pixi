import { DICE_COUNT } from "@/ui/components/Dice/config";
import { useDice } from "@/ui/store/DiceContext";

export function RollDiceButton() {
  const { roll, isRolling } = useDice();

  return (
    <button
      type="button"
      className="game-roll-button"
      onClick={roll}
      disabled={isRolling}
      aria-busy={isRolling}
    >
      {isRolling ? "Rolling…" : `Roll ${DICE_COUNT} dice`}
    </button>
  );
}
