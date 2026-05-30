import { Application } from "@pixi/react";
import { use, useState } from "react";

import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import type { CardDisplayMode } from "@/ui/components/Card/config";
import { Card } from "@/ui/components/Card/Card";
import type { StoryDefinition } from "@/ui/types/storyTypes";

function CardStory() {
  use(itemTexturesReady);

  const [displayMode, setDisplayMode] = useState<CardDisplayMode>("shop");

  return (
    <div className="story-canvas">
      <div className="story-controls">
        <label className="story-control-label">
          Display mode
          <select
            className="story-control-select"
            value={displayMode}
            onChange={(event) => setDisplayMode(event.target.value as CardDisplayMode)}
          >
            <option value="shop">shop</option>
            <option value="pack">pack</option>
            <option value="owned">owned</option>
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
          <Card
            texture={getCardTexture(1)}
            displayMode={displayMode}
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
