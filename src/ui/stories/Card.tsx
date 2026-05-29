import { Application } from "@pixi/react";
import { use } from "react";

import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import { Card } from "@/ui/components/Card/Card";
import type { StoryDefinition } from "@/ui/playground/storyTypes";

import "@/ui/pixi/extend";

function CardStory() {
  use(itemTexturesReady);

  return (
    <div className="story-canvas">
      <Application width={420} height={300} background="#171824" antialias autoDensity>
        <pixiContainer x={210} y={150}>
          <Card texture={getCardTexture(0)} hovered />
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
