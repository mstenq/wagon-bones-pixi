import { GameCanvas } from "@/ui/app/GameCanvas";
import { RollDiceButton } from "@/ui/components/Dice/RollDiceButton";
import { DICE_LABELS, type DiceType } from "@/ui/components/Dice/config";
import { DiceProvider, useDice } from "@/ui/store/DiceContext";

const DICE_ENHANCEMENT_OPTIONS: DiceType[] = [
  "bone",
  "diamond",
  "gold",
  "loaded",
  "lucky",
  "standard",
  "steel",
  "stone",
  "wooden",
];

function DiceEnhancementSelect() {
  const { diceType, setDiceType } = useDice();

  return (
    <label className="game-dice-enhancement-label">
      Enhancement
      <select
        className="game-dice-enhancement-select"
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
    <DiceProvider>
      <div className="game-shell">
        <GameCanvas />
        <DiceEnhancementSelect />
        <RollDiceButton />
      </div>
    </DiceProvider>
  );
}

export default App;
