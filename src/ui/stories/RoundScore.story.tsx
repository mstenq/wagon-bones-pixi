import { useState } from "react";

import { RoundScore } from "@/ui/components/RoundScore/RoundScore";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass } from "@/ui/styles/panelControls";

const SMALL_ADD = 150;
const MEDIUM_ADD = 250_000;
const LARGE_ADD = 2_500_000_000_000;

function RoundScoreStory() {
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={panelButtonClass} onClick={() => setScore(0)}>
          Reset score
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setScore((value) => value + SMALL_ADD)}
        >
          Small score
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setScore((value) => value + MEDIUM_ADD)}
        >
          Medium score
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setScore((value) => value + LARGE_ADD)}
        >
          Large score
        </button>
      </div>

      <RoundScore score={score} />
    </div>
  );
}

const roundScoreStory: StoryDefinition = {
  name: "RoundScore",
  component: <RoundScoreStory />,
};

export default roundScoreStory;
