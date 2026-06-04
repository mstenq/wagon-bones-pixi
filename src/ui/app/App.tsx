import { GameCanvas } from "@/ui/app/GameCanvas";
import { RollDiceButton } from "@/ui/components/Dice/RollDiceButton";
import {
  DICE_ENHANCEMENT_OPTIONS,
  DICE_LABELS,
  type DiceType,
} from "@/ui/components/Dice/config";
import { GameInfo } from "@/ui/components/GameInfo/GameInfo";
import { gameFacade } from "@/game/facade";
import { useRunStore } from "@/game/store/runStore";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";
import { useMediaQuery } from "@/ui/hooks/useMediaQuery";
import { UiPrimaryProvider } from "@/ui/theme/UiPrimaryProvider";

function DiceEnhancementSelect() {
  const diceType = useRunStore((state) => state.diceType);
  const setDiceType = useRunStore((state) => state.setDiceType);

  return (
    <label className={`${panelLabelClass} absolute top-4 left-4 z-10`}>
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
  const isXlUp = useMediaQuery("(min-width: 80rem)");

  return (
    <UiPrimaryProvider className="flex h-screen w-full flex-col xl:flex-row">
      <aside className="w-full shrink-0 overflow-y-auto bg-background xl:w-96">
        <GameInfo
          displayMode={isXlUp ? "portrait" : "landscape"}
          roundInfo={{
            title: "Round 1",
            subtitle: "",
            iconSrc: "https://via.placeholder.com/150",
            difficultyColor: "red",
            targetScore: 100,
            payoutAmount: 10,
          }}
          roundScore={100}
          handInfo={{ handName: "Hand 1", level: 1, chips: 100, mult: 2 }}
          stats={{
            hands: 10,
            rerolls: 5,
            anteCurrent: 10,
            anteTotal: 100,
            round: 1,
          }}
          balance={1000}
        />
      </aside>
      <main className="relative min-h-0 min-w-0 flex-1">
        <GameCanvas />
        <DiceEnhancementSelect />
        <RollDiceButton />
      </main>
    </UiPrimaryProvider>
  );
}

export default App;
