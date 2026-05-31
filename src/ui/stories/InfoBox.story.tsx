import {
  InfoBox,
  InfoBoxAnteValue,
  InfoBoxRockValue,
} from "@/ui/components/InfoBox/InfoBox";
import type { StoryDefinition } from "@/ui/types/storyTypes";

function InfoBoxStory() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex w-full max-w-xl gap-3">
        <InfoBox label="Hands">
          <InfoBoxRockValue tone="blue" value={4} />
        </InfoBox>
        <InfoBox label="Discards">
          <InfoBoxRockValue tone="red" value={2} />
        </InfoBox>
      </div>

      <div className="flex w-full max-w-xl gap-3">
        <InfoBox label="Ante">
          <InfoBoxAnteValue current={1} total={8} />
        </InfoBox>
        <InfoBox label="Round">
          <InfoBoxRockValue tone="amber" value={1} />
        </InfoBox>
      </div>
    </div>
  );
}

const infoBoxStory: StoryDefinition = {
  name: "InfoBox",
  component: <InfoBoxStory />,
};

export default infoBoxStory;
