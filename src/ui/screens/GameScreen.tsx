import { GameCanvas } from '@/ui/app/GameCanvas';
import { RollDiceButton } from '@/ui/components/Dice/RollDiceButton';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';

export function GameScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo />}>
      <GameCanvas />
      <RollDiceButton />
    </GameSceneLayout>
  );
}
