import { useState } from "react";

import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass } from "@/ui/styles/panelControls";

function randomIncrement(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function ScoreBoxStory() {
  const [points, setPoints] = useState(86);
  const [mult, setMult] = useState(6);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => {
            setPoints(0);
            setMult(0);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => {
            setPoints((current) => current + randomIncrement());
            setMult((current) => current + randomIncrement());
          }}
        >
          Increment
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <ScoreBox variant="points" value={points} />
        <span
          className="font-score text-2xl leading-none font-bold text-red-500 select-none"
          aria-hidden
        >
          x
        </span>
        <ScoreBox variant="mult" value={mult} />
      </div>
    </div>
  );
}

const scoreBoxStory: StoryDefinition = {
  name: "ScoreBox",
  component: <ScoreBoxStory />,
};

export default scoreBoxStory;
