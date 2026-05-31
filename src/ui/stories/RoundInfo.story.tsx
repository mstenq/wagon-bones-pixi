import { RoundInfo } from "@/ui/components/RoundInfo/RoundInfo";
import type { StoryDefinition } from "@/ui/types/storyTypes";

function RoundInfoStory() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <RoundInfo
        title="Big Blind"
        headerColor="#9a6a0b"
        bodyColor="#4d4d1a"
        difficultyColor="#ffffff"
        targetScore={1200}
        payoutAmount={4}
      />

      <RoundInfo
        title="The Eye"
        subtitle="No repeat hand types this round"
        headerColor="#5b8fd4"
        bodyColor="#2a4570"
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
