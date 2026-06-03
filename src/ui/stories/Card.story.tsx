import { Application } from "@pixi/react";
import { use, useCallback, useRef, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import type { CardDisplayMode } from "@/ui/components/Card/config";
import { Card, type CardHandle } from "@/ui/components/Card/Card";
import { itemShakeAnim, itemTextAnim } from "@/ui/animation/itemAnimations";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import type { EffectId } from "@/ui/effects/types";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";
import { UI_BACKGROUND_COLOR } from "../uiConstants";

const RESTORE_DELAY_MS = 700;

function CardStory() {
  use(itemTexturesReady);
  use(effectsTexturesReady);

  const cardRef = useRef<CardHandle | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const [busy, setBusy] = useState(false);

  const [displayMode, setDisplayMode] = useQueryParam<CardDisplayMode>("mode", {
    default: "shop",
    parse: (raw) => (raw === "shop" || raw === "pack" || raw === "owned" ? raw : undefined),
  });
  const [effect, setEffect] = useQueryParam<EffectId>("effect", {
    default: "none",
    parse: (raw) =>
      EFFECT_OPTIONS.some((option) => option.id === raw) ? (raw as EffectId) : undefined,
  });

  const finishAnim = useCallback((started: boolean) => {
    if (!started) {
      return;
    }
    setBusy(true);
  }, []);

  const runAnim = useCallback((config: Parameters<CardHandle["animate"]>[0]) => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    finishAnim(card.animate(config, () => {
      setBusy(cardRef.current?.isPlayingAnimation() ?? false);
    }));
  }, [finishAnim]);

  const handleAppear = useCallback(() => {
    runAnim({ type: "appear" });
  }, [runAnim]);

  const handleDestroy = useCallback(() => {
    const card = cardRef.current;
    if (!card || !cardVisible || card.isPlayingAnimation()) {
      return;
    }

    finishAnim(card.animate({ type: "destroy" }, () => {
      console.log("destroy completed");
      setCardVisible(false);
      window.setTimeout(() => {
        setCardKey((key) => key + 1);
        setCardVisible(true);
        setBusy(false);
      }, RESTORE_DELAY_MS);
    }));
  }, [cardVisible, finishAnim]);

  const animDisabled = !cardVisible || busy;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <label className={panelLabelClass}>
          Display mode
          <select
            className={panelSelectClass}
            value={displayMode}
            onChange={(event) => setDisplayMode(event.target.value as CardDisplayMode)}
          >
            <option value="shop">shop</option>
            <option value="pack">pack</option>
            <option value="owned">owned</option>
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
        {cardVisible ? (
          <pixiContainer x={240} y={190} sortableChildren>
            <Card
              key={cardKey}
              ref={cardRef}
              texture={getCardTexture(1)}
              displayMode={displayMode}
              effect={effect}
              price={5}
              sellPrice={4}
              onBuy={() => console.log("BUY")}
              onSelect={() => console.log("SELECT")}
              onSell={() => console.log("SELL")}
            />
          </pixiContainer>
        ) : null}
      </Application>
    </div>
  );
}

const cardStory: StoryDefinition = {
  name: "Card",
  component: <CardStory />,
};

export default cardStory;
