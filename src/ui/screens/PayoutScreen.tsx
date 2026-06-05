import { PayoutCanvas } from '@/ui/app/PayoutCanvas';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';

export function PayoutScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Payout" />}>
      <PayoutCanvas />
    </GameSceneLayout>
  );
}
