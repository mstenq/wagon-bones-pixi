import { GameCanvas } from '@/ui/app/GameCanvas';
import { DiceActionBar } from '@/ui/components/Dice/DiceActionBar';
import { DiceRowControllerProvider } from '@/ui/components/DiceRow/DiceRowController';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';

export function GameScreen() {
  return (
    <DiceRowControllerProvider>
      <GameSceneLayout sidebar={<RunGameInfo />}>
        <GameCanvas />
        <DiceActionBar />
      </GameSceneLayout>
    </DiceRowControllerProvider>
  );
}
