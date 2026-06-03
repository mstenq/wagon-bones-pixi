import { Application } from "@pixi/react";
import { use, useCallback, useRef, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { texturesReady } from "@/assets/dice/textures";
import { DICE_TYPES, type DiceType } from "@/data/dice";
import { Die, type DieHandle } from "@/ui/components/Dice/Die";
import {
  DICE_ENHANCEMENT_OPTIONS,
  DICE_LABELS,
  DIE_MODE_LABELS,
  DIE_MODES,
  type DieMode,
} from "@/ui/components/Dice/config";
import { itemShakeAnim, itemTextAnim } from "@/ui/animation/itemAnimations";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";
import { UI_BACKGROUND_COLOR } from "../uiConstants";

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
  const [busy, setBusy] = useState(false);

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

  const [mode, setMode] = useQueryParam<DieMode>("mode", {
    default: "base",
    parse: (raw) => (DIE_MODES.includes(raw as DieMode) ? (raw as DieMode) : undefined),
  });

  const finishAnim = useCallback((started: boolean) => {
    if (!started) {
      return;
    }
    setBusy(true);
  }, []);

  const runAnim = useCallback((config: Parameters<DieHandle["animate"]>[0]) => {
    const die = dieRef.current;
    if (!die) {
      return;
    }
    finishAnim(die.animate(config, () => {
      setBusy(dieRef.current?.isPlayingAnimation() ?? false);
    }));
  }, [finishAnim]);

  const handleAppear = useCallback(() => {
    runAnim({ type: "appear" });
  }, [runAnim]);

  const handleDestroy = useCallback(() => {
    const die = dieRef.current;
    if (!die || !dieVisible || die.isPlayingAnimation()) {
      return;
    }

    finishAnim(die.animate({ type: "destroy" }, () => {
      console.log("destroy completed");
      setDieVisible(false);
      window.setTimeout(() => {
        setDieKey((key) => key + 1);
        setDieVisible(true);
        setBusy(false);
      }, RESTORE_DELAY_MS);
    }));
  }, [dieVisible, finishAnim]);

  const animDisabled = !dieVisible || busy;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <label className={panelLabelClass}>
          Mode
          <select
            className={panelSelectClass}
            value={mode}
            onChange={(event) => setMode(event.target.value as DieMode)}
          >
            {DIE_MODES.map((option) => (
              <option key={option} value={option}>
                {DIE_MODE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
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
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <span className={panelLabelClass}>Animations</span>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={handleAppear}
        >
          Appear
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={handleDestroy}
        >
          Destroy
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemShakeAnim({ amount: 5 }))}
        >
          Shake
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemTextAnim.mult(4))}
        >
          + mult
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemTextAnim.mile(20))}
        >
          + miles
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemTextAnim.retrigger())}
        >
          Retrigger
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemTextAnim.money(5))}
        >
          + money
        </button>
        <button
          type="button"
          className={panelButtonClass}
          disabled={animDisabled}
          onClick={() => runAnim(itemTextAnim.moneyTrigger(5))}
        >
          + money trigger
        </button>
      </div>

      <Application
        width={480}
        height={360}
        background={UI_BACKGROUND_COLOR}
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
              mode={mode}
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
