import { Application } from "@pixi/react";
import { use, useCallback, useRef, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { texturesReady } from "@/assets/dice/textures";
import { DICE_TYPES, type DiceType } from "@/data/dice";
import { Die, type DieHandle } from "@/ui/components/Dice/Die";
import { DICE_ENHANCEMENT_OPTIONS, DICE_LABELS } from "@/ui/components/Dice/config";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

const RESTORE_DELAY_MS = 700;

function parseDiceType(raw: string): DiceType | undefined {
  return DICE_TYPES.includes(raw as DiceType) ? (raw as DiceType) : undefined;
}

function parseFaceValue(raw: string): number | undefined {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1 || value > 12) {
    return undefined;
  }
  return value;
}

function DieStory() {
  use(texturesReady);
  use(effectsTexturesReady);

  const dieRef = useRef<DieHandle | null>(null);
  const [dieKey, setDieKey] = useState(0);
  const [dieVisible, setDieVisible] = useState(true);
  const [destroying, setDestroying] = useState(false);

  const [enhancement, setEnhancement] = useQueryParam<DiceType>("enhancement", {
    default: "standard",
    parse: parseDiceType,
  });

  const [value, setValue] = useQueryParam<number>("value", {
    default: 3,
    parse: parseFaceValue,
  });

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
          Enhancement
          <select
            className={panelSelectClass}
            value={enhancement}
            onChange={(event) => setEnhancement(event.target.value as DiceType)}
          >
            {DICE_ENHANCEMENT_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {DICE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className={panelLabelClass}>
          Value
          <select
            className={panelSelectClass}
            value={value}
            onChange={(event) => setValue(Number.parseInt(event.target.value, 10))}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((face) => (
              <option key={face} value={face}>
                {face}
              </option>
            ))}
          </select>
        </label>
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
              diceType={enhancement}
              value={value}
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
