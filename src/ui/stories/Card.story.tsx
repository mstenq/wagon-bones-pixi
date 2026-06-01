import { Application } from "@pixi/react";
import { use, useCallback, useRef, useState } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import type { CardDisplayMode } from "@/ui/components/Card/config";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import { Card, type CardHandle } from "@/ui/components/Card/Card";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

const RESTORE_DELAY_MS = 700;

function CardStory() {
  use(itemTexturesReady);
  use(effectsTexturesReady);

  const cardRef = useRef<CardHandle | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const [destroying, setDestroying] = useState(false);

  const [displayMode, setDisplayMode] = useQueryParam<CardDisplayMode>("mode", {
    default: "shop",
    parse: (raw) => (raw === "shop" || raw === "pack" || raw === "owned" ? raw : undefined),
  });
  const [effect, setEffect] = useQueryParam<EffectId>("effect", {
    default: "none",
    parse: (raw) =>
      EFFECT_OPTIONS.some((option) => option.id === raw) ? (raw as EffectId) : undefined,
  });

  const handleDestroy = useCallback(() => {
    const card = cardRef.current;
    if (!card || card.isDestroying()) {
      return;
    }

    setDestroying(true);
    card.destroy(() => {
      console.log("animation completed");
      setCardVisible(false);
      window.setTimeout(() => {
        setCardKey((key) => key + 1);
        setCardVisible(true);
        setDestroying(false);
      }, RESTORE_DELAY_MS);
    });
  }, []);

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
        <label className={panelLabelClass}>
          Destroy
          <button
            type="button"
            className={panelButtonClass}
            disabled={!cardVisible || destroying}
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
        {cardVisible ? (
          <pixiContainer x={240} y={190} sortableChildren>
            <Card
              key={cardKey}
              ref={cardRef}
              texture={getCardTexture(4)}
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
