import { Application } from "@pixi/react";
import { use, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getDiceTexture, texturesReady } from "@/assets/dice/textures";
import { Die } from "@/ui/components/Dice/Die";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

function DieStory() {
  use(texturesReady);
  use(effectsTexturesReady);

  const [effect, setEffect] = useState<EffectId>("none");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <label className={panelLabelClass}>
          Effect
          <select
            className={panelSelectClass}
            value={effect}
            onChange={(event) => setEffect(event.target.value as EffectId)}
          >
            {EFFECT_OPTIONS.map((option) => (
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
        preference={PIXI_RENDERER_PREFERENCE}
        eventMode="static"
        eventFeatures={{ move: true, globalMove: true, click: true }}
      >
        <pixiContainer x={240} y={190} sortableChildren>
          <Die texture={getDiceTexture("standard")} value={3} effect={effect} />
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
