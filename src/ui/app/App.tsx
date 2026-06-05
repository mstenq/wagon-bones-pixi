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
  /** Viewport wider than tall — sidebar + portrait GameInfo content layout. */
  const isLandscapeViewport = useMediaQuery("(orientation: landscape)");

  return (
    <UiPrimaryProvider className="box-border flex h-dvh w-full flex-col pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left landscape:flex-row">
      <aside className="w-full bg-background  shrink-0 bg-background  landscape:max-h-none landscape:min-w-0 landscape:w-[clamp(11.5rem,20vw,15rem)] lg:landscape:w-[clamp(16rem,22vw,18rem)] xl:landscape:w-96">
        <GameInfo
          displayMode={isLandscapeViewport ? "portrait" : "landscape"}
          roundInfo={{
            title: "Round 1",
            subtitle: "Can only play straights",
            iconSrc: "",
            difficultyColor: "red",
            targetScore: 100,
            payoutAmount: 10,
          }}
          roundScore={100}
          profession={{ name: "Developer" }}
          modifiers={[
            { id: "placeholder-positive", polarity: "positive" },
            { id: "placeholder-negative", polarity: "negative" },
          ]}
          handInfo={{ handName: "Hand 1", level: 1, chips: 100, mult: 2 }}
          stats={{
            hands: 5,
            rerolls: 5,
            legCurrent: 2,
            legTotal: 8,
            round: 1,
          }}
          balance={69}
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
