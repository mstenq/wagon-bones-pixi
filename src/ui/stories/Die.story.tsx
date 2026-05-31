import { Application } from "@pixi/react";
import { use, useCallback, useRef, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getDiceTexture, texturesReady } from "@/assets/dice/textures";
import { Die, type DieHandle } from "@/ui/components/Dice/Die";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

const RESTORE_DELAY_MS = 700;

function DieStory() {
  use(texturesReady);
  use(effectsTexturesReady);

  const dieRef = useRef<DieHandle | null>(null);
  const [dieKey, setDieKey] = useState(0);
  const [dieVisible, setDieVisible] = useState(true);
  const [destroying, setDestroying] = useState(false);

  const [effect, setEffect] = useQueryParam<EffectId>("effect", {
    default: "none",
    parse: (raw) =>
      EFFECT_OPTIONS.some((option) => option.id === raw) ? (raw as EffectId) : undefined,
  });

  const handleDestroy = useCallback(() => {
    const die = dieRef.current;
    if (!die || die.isDestroying()) {
      return;
    }

    setDestroying(true);
    die.destroy(() => {
      console.log("animation completed");
      setDieVisible(false);
      window.setTimeout(() => {
        setDieKey((key) => key + 1);
        setDieVisible(true);
        setDestroying(false);
      }, RESTORE_DELAY_MS);
    });
  }, []);

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
        <label className={panelLabelClass}>
          Destroy
          <button
            type="button"
            className={panelButtonClass}
            disabled={!dieVisible || destroying}
            onClick={handleDestroy}
          >
            Destroy
          </button>
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
        {dieVisible ? (
          <pixiContainer x={240} y={190} sortableChildren>
            <Die
              key={dieKey}
              ref={dieRef}
              texture={getDiceTexture("standard")}
              value={3}
              effect={effect}
            />
          </pixiContainer>
        ) : null}
      </Application>
    </div>
  );
}

const dieStory: StoryDefinition = {
  name: "Die",
  component: <DieStory />,
};

export default dieStory;
