import { useState } from "react";

import { CardboardContainer } from "@/ui/components/CardboardContainer/CardboardContainer";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass } from "@/ui/styles/panelControls";

const MIN_SIZE = 120;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 700;

const rangeClass =
  "h-2 w-56 cursor-pointer accent-white/90";

function CardboardContainerStory() {
  const [width, setWidth] = useState(420);
  const [height, setHeight] = useState(280);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap justify-center gap-8">
        <label className={panelLabelClass}>
          Width ({width}px)
          <input
            className={rangeClass}
            type="range"
            min={MIN_SIZE}
            max={MAX_WIDTH}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <label className={panelLabelClass}>
          Height ({height}px)
          <input
            className={rangeClass}
            type="range"
            min={MIN_SIZE}
            max={MAX_HEIGHT}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="flex w-full max-w-5xl justify-center rounded-xl bg-ui-panel p-8">
        <CardboardContainer
          className="flex items-center justify-center p-6 font-score text-2xl text-cardboard-button-text"
          style={{ width, height }}
        >
          Resize to check tiling
        </CardboardContainer>
      </div>
    </div>
  );
}

const cardBoardContainerStory: StoryDefinition = {
  name: "CardboardContainer",
  component: <CardboardContainerStory />,
};

export default cardBoardContainerStory;
