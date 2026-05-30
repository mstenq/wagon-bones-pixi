import { Application } from "@pixi/react";
import { use, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getDiceTexture, texturesReady } from "@/assets/dice/textures";
import { Die } from "@/ui/components/Dice/Die";
import { AURA_OPTIONS } from "@/ui/effects/auraOptions";
import type { AuraId } from "@/ui/effects/types";
import type { StoryDefinition } from "@/ui/types/storyTypes";

function DieStory() {
  use(texturesReady);
  use(effectsTexturesReady);

  const [aura, setAura] = useState<AuraId>("none");

  return (
    <div className="story-canvas">
      <div className="story-controls">
        <label className="story-control-label">
          Aura
          <select
            className="story-control-select"
            value={aura}
            onChange={(event) => setAura(event.target.value as AuraId)}
          >
            {AURA_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Application
        width={480}
        height={360}
        background="#171824"
        antialias
        autoDensity
        eventMode="static"
        eventFeatures={{ move: true, globalMove: true, click: true }}
      >
        <pixiContainer x={240} y={190} sortableChildren>
          <Die texture={getDiceTexture("standard")} value={3} aura={aura} />
        </pixiContainer>
      </Application>
    </div>
  );
}

const dieStory: StoryDefinition = {
  name: "Die",
  component: <DieStory />,
};

export default dieStory;
