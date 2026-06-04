import { DICE_COUNT } from "@/ui/components/Dice/config";
import { ButtonElement } from "@/ui/components/Button/ButtonElement";
import { gameFacade } from "@/game/facade";
import { useRunStore } from "@/game/store/runStore";

export function RollDiceButton() {
  const isRolling = useRunStore((state) => state.isRolling);

  return (
    <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <ButtonElement
        variant="primary"
        label={isRolling ? "Rolling…" : `Roll ${DICE_COUNT} dice`}
        disabled={isRolling}
        onClick={() => gameFacade.dice.roll()}
        className="min-w-48"
      />
    </div>
  );
}
