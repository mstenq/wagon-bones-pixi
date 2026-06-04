import { RoundTitle } from "@/ui/components/RoundInfo/RoundTitle";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { UiPrimaryProvider } from "@/ui/theme/UiPrimaryProvider";

function RoundTitleStory() {
  return (
    <UiPrimaryProvider className="flex w-full max-w-md flex-col gap-4">
      <RoundTitle title="Big Blind" />
      <RoundTitle title="The Eye" />
      <RoundTitle title="Boss" />
    </UiPrimaryProvider>
  );
}

const roundTitleStory: StoryDefinition = {
  name: "RoundTitle",
  component: <RoundTitleStory />,
};

export default roundTitleStory;
