import { Application } from "@pixi/react";
import { use } from "react";

import { effectsTexturesReady } from "@/assets/effects/textures";
import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import type { CardDisplayMode } from "@/ui/components/Card/config";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import { Card } from "@/ui/components/Card/Card";
import { EFFECT_OPTIONS } from "@/ui/effects/effectOptions";
import type { EffectId } from "@/ui/effects/types";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

function CardStory() {
  use(itemTexturesReady);
  use(effectsTexturesReady);

  const [displayMode, setDisplayMode] = useQueryParam<CardDisplayMode>("mode", {
    default: "shop",
    parse: (raw) => (raw === "shop" || raw === "pack" || raw === "owned" ? raw : undefined),
  });
  const [effect, setEffect] = useQueryParam<EffectId>("effect", {
    default: "none",
    parse: (raw) =>
      EFFECT_OPTIONS.some((option) => option.id === raw) ? (raw as EffectId) : undefined,
  });

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
          <Card
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
      </Application>
    </div>
  );
}

const cardStory: StoryDefinition = {
  name: "Card",
  component: <CardStory />,
};

export default cardStory;
