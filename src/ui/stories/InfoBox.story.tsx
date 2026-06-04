import {
  InfoBox,
  InfoBoxAnteValue,
  InfoBoxRockValue,
} from "@/ui/components/InfoBox/InfoBox";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { UiPrimaryProvider } from "@/ui/theme/UiPrimaryProvider";

function InfoBoxStory() {
  return (
    <UiPrimaryProvider className="flex flex-col items-center gap-8 bg-background p-6">
      <div className="flex w-full max-w-xl gap-3">
        <InfoBox label="Hands">
          <InfoBoxRockValue value={4} />
        </InfoBox>
        <InfoBox label="Discards">
          <InfoBoxRockValue value={2} />
        </InfoBox>
      </div>

      <div className="flex w-full max-w-xl gap-3">
        <InfoBox label="Ante">
          <InfoBoxAnteValue current={1} total={8} />
        </InfoBox>
        <InfoBox label="Round">
          <InfoBoxRockValue value={1} />
        </InfoBox>
      </div>
    </UiPrimaryProvider>
  );
}

const infoBoxStory: StoryDefinition = {
  name: "InfoBox",
  component: <InfoBoxStory />,
};

export default infoBoxStory;
