import { useCallback, useState, type CSSProperties } from "react";

import { GameInfo, type GameInfoDisplayMode } from "@/ui/components/GameInfo/GameInfo";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import {
  panelButtonClass,
  panelLabelClass,
  panelSelectClass,
} from "@/ui/styles/panelControls";

const DISPLAY_MODES: GameInfoDisplayMode[] = ["portrait", "landscape"];

/** Fonts loaded in index.html (Google Fonts link). */
const STORY_FONTS = [
  "Abril Fatface",
  "Alegreya Sans SC",
  "Angkor",
  "Arbutus",
  "Bree Serif",
  "Girassol",
  "Goblin One",
  "Gravitas One",
  "IM Fell English",
  "Rye",
  "Sancreek",
  "Smokum",
  "Special Elite",
  "Tilt Warp",
  "Ultra",
] as const;

type StoryFont = (typeof STORY_FONTS)[number];

const DEFAULT_FONT_BODY: StoryFont = "Special Elite";
const DEFAULT_FONT_SCORE: StoryFont = "Bree Serif";

function parseDisplayMode(raw: string): GameInfoDisplayMode | undefined {
  return DISPLAY_MODES.includes(raw as GameInfoDisplayMode)
    ? (raw as GameInfoDisplayMode)
    : undefined;
}

function isStoryFont(value: string): value is StoryFont {
  return (STORY_FONTS as readonly string[]).includes(value);
}

function fontFamilyCss(name: StoryFont): string {
  const fallback = name.includes("Sans") ? "sans-serif" : "serif";
  return `"${name}", ${fallback}`;
}

function pickRandomFont(): StoryFont {
  const index = Math.floor(Math.random() * STORY_FONTS.length);
  return STORY_FONTS[index] ?? DEFAULT_FONT_BODY;
}

function storyFontVars(body: StoryFont, score: StoryFont): CSSProperties {
  return {
    ["--font-body" as string]: fontFamilyCss(body),
    ["--font-score" as string]: fontFamilyCss(score),
  };
}

function GameInfoStory() {
  const [displayMode, setDisplayMode] = useQueryParam<GameInfoDisplayMode>("mode", {
    default: "portrait",
    parse: parseDisplayMode,
  });
  const [fontBody, setFontBody] = useState<StoryFont>(DEFAULT_FONT_BODY);
  const [fontScore, setFontScore] = useState<StoryFont>(DEFAULT_FONT_SCORE);

  const randomizeFonts = useCallback(() => {
    setFontBody(pickRandomFont());
    setFontScore(pickRandomFont());
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full max-w-sm flex-wrap items-end justify-center gap-4">
        <label className={panelLabelClass}>
          font-body
          <select
            className={panelSelectClass}
            value={fontBody}
            onChange={(event) => {
              const next = event.target.value;
              if (isStoryFont(next)) {
                setFontBody(next);
              }
            }}
          >
            {STORY_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <label className={panelLabelClass}>
          font-score
          <select
            className={panelSelectClass}
            value={fontScore}
            onChange={(event) => {
              const next = event.target.value;
              if (isStoryFont(next)) {
                setFontScore(next);
              }
            }}
          >
            {STORY_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={panelButtonClass} onClick={randomizeFonts}>
          Random
        </button>
      </div>

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

      <div
        className={`w-full ${displayMode === "portrait" ? "max-w-sm" : ""}`}
        style={storyFontVars(fontBody, fontScore)}
      >
        <GameInfo
          displayMode={displayMode}
          roundInfo={{
            title: "Big Blind",
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
