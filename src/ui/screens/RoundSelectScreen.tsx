import { RoundSelectCanvas } from '@/ui/app/RoundSelectCanvas';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';

export function RoundSelectScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Trail Map" />}>
      <RoundSelectCanvas />
    </GameSceneLayout>
  );
}
