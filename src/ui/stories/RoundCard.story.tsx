import { Application } from "@pixi/react";

import { RoundCard } from "@/ui/components/RoundCard/RoundCard";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { UiPrimaryProvider } from "@/ui/theme/UiPrimaryProvider";

const STORY_BACKGROUND = "#2d3236";
const CARD_Y = 240;

function RoundCardStory() {
  return (
    <UiPrimaryProvider className="flex w-full flex-col items-center">
      <Application
        width={960}
        height={480}
        background={STORY_BACKGROUND}
        antialias
        autoDensity
        preference={PIXI_RENDERER_PREFERENCE}
        eventMode="static"
        eventFeatures={{ move: true, globalMove: true, click: true }}
      >
        <pixiContainer sortableChildren eventMode="passive">
          <RoundCard
            status="complete"
            title="Mile Marker"
            targetScore={1000}
            rewardAmount={0}
            x={160}
            y={CARD_Y}
          />

          <RoundCard
            status="select"
            title="River Ford"
            targetScore={1500}
            rewardAmount={4}
            trailTag="?"
            x={480}
            y={CARD_Y}
            onPlayRound={() => console.log("play round")}
            onSkipRound={() => console.log("skip round")}
          />

          <RoundCard
            status="upcoming"
            title="Showdown"
            targetScore={4000}
            rewardAmount={5}
            x={800}
            y={CARD_Y}
          />
        </pixiContainer>
      </Application>
    </UiPrimaryProvider>
  );
}

const roundCardStory: StoryDefinition = {
  name: "RoundCard",
  component: <RoundCardStory />,
};

export default roundCardStory;
