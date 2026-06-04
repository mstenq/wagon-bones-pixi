import { RoundInfo } from "@/ui/components/RoundInfo/RoundInfo";
import type { StoryDefinition } from "@/ui/types/storyTypes";

function RoundInfoStory() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <RoundInfo
        title="Big Blind"
        difficultyColor="#ffffff"
        targetScore={1200}
        payoutAmount={4}
      />

      <RoundInfo
        title="The Eye"
        subtitle="No repeat hand types this round"
        difficultyColor="#ffffff"
        targetScore={1340000}
        payoutAmount={5}
      />
    </div>
  );
}

const roundInfoStory: StoryDefinition = {
  name: "RoundInfo",
  component: <RoundInfoStory />,
};

export default roundInfoStory;
