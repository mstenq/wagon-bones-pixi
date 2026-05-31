import { GameInfo, type GameInfoDisplayMode } from "@/ui/components/GameInfo/GameInfo";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

const DISPLAY_MODES: GameInfoDisplayMode[] = ["portrait", "landscape"];

function parseDisplayMode(raw: string): GameInfoDisplayMode | undefined {
  return DISPLAY_MODES.includes(raw as GameInfoDisplayMode)
    ? (raw as GameInfoDisplayMode)
    : undefined;
}

function GameInfoStory() {
  const [displayMode, setDisplayMode] = useQueryParam<GameInfoDisplayMode>("mode", {
    default: "portrait",
    parse: parseDisplayMode,
  });

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <label className={panelLabelClass}>
        Display mode
        <select
          className={panelSelectClass}
          value={displayMode}
          onChange={(event) => setDisplayMode(event.target.value as GameInfoDisplayMode)}
        >
          {DISPLAY_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      <div className={`w-full ${displayMode === "portrait" ? "max-w-sm" : ""}`}>
        <GameInfo
          displayMode={displayMode}
          roundInfo={{
            title: "Big Blind",
            headerColor: "#9a6a0b",
            bodyColor: "#4d4d1a",
            difficultyColor: "#ffffff",
            targetScore: 450,
            payoutAmount: 4,
          }}
          roundScore={324}
          handInfo={{
            handName: "High Card",
            level: 1,
            chips: 0,
            mult: 0,
          }}
          stats={{
            hands: 3,
            discards: 0,
            anteCurrent: 1,
            anteTotal: 8,
            round: 2,
          }}
          balance={20}
          onRunInfoClick={() => console.log("run-info")}
          onOptionsClick={() => console.log("options")}
        />
      </div>
    </div>
  );
}

const gameInfoStory: StoryDefinition = {
  name: "GameInfo",
  component: <GameInfoStory />,
};

export default gameInfoStory;
