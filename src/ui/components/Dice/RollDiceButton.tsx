import { DICE_COUNT } from "@/ui/components/Dice/config";
import { gameFacade } from "@/game/facade";
import { useRunStore } from "@/game/store/runStore";
import { panelButtonClass } from "@/ui/styles/panelControls";

export function RollDiceButton() {
  const isRolling = useRunStore((state) => state.isRolling);

  return (
    <button
      type="button"
      className={`${panelButtonClass} absolute bottom-8 left-1/2 z-10 -translate-x-1/2 px-5 py-2.5`}
      onClick={() => gameFacade.dice.roll()}
      disabled={isRolling}
      aria-busy={isRolling}
    >
      {isRolling ? "Rolling…" : `Roll ${DICE_COUNT} dice`}
    </button>
  );
}
