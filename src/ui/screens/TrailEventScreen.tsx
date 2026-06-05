import { TrailEventCanvas } from '@/ui/app/TrailEventCanvas';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';

export function TrailEventScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Trail" />}>
      <TrailEventCanvas />
    </GameSceneLayout>
  );
}
