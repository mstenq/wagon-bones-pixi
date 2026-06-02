import { GameCanvas } from "@/ui/app/GameCanvas";
import { RollDiceButton } from "@/ui/components/Dice/RollDiceButton";
import {
  DICE_ENHANCEMENT_OPTIONS,
  DICE_LABELS,
  type DiceType,
} from "@/ui/components/Dice/config";
import { useRunStore } from "@/game/store/runStore";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

function DiceEnhancementSelect() {
  const diceType = useRunStore((state) => state.diceType);
  const setDiceType = useRunStore((state) => state.setDiceType);

  return (
    <label className={`${panelLabelClass} fixed top-4 left-4 z-10`}>
      Enhancement
      <select
        className={panelSelectClass}
        value={diceType}
        onChange={(event) => setDiceType(event.target.value as DiceType)}
      >
        {DICE_ENHANCEMENT_OPTIONS.map((type) => (
          <option key={type} value={type}>
            {DICE_LABELS[type]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function App() {
  return (
    <div className="relative min-h-screen w-full">
      <GameCanvas />
      <DiceEnhancementSelect />
      <RollDiceButton />
    </div>
  );
}

export default App;
