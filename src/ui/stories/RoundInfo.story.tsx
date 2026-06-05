import { RoundInfo, type RoundInfoProps } from '@/ui/components/RoundInfo/RoundInfo';
import { RoundTitle } from '@/ui/components/RoundInfo/RoundTitle';
import type { StoryDefinition } from '@/ui/types/storyTypes';
import { UiPrimaryProvider } from '@/ui/theme/UiPrimaryProvider';

function RoundInfoCard({ title, ...roundInfo }: { title: string } & RoundInfoProps) {
  return (
    <div className="flex w-72 min-w-0 flex-col">
      <RoundTitle title={title} />
      <RoundInfo {...roundInfo} />
    </div>
  );
}

function RoundInfoStory() {
  return (
    <UiPrimaryProvider className="flex flex-wrap items-start justify-center gap-8">
      <RoundInfoCard title="Big Blind" difficultyColor="#ffffff" targetScore={1200} payoutAmount={4} />

      <RoundInfoCard
        title="The Eye"
        subtitle="No repeat hand types this round"
        difficultyColor="#ffffff"
        targetScore={1340000}
        payoutAmount={5}
      />
    </UiPrimaryProvider>
  );
}

const roundInfoStory: StoryDefinition = {
  name: 'RoundInfo',
  component: <RoundInfoStory />,
};

export default roundInfoStory;
