import { isDevMode } from '@/game/DevMode';
import { RoundSelectCanvas } from '@/ui/app/RoundSelectCanvas';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';
import { navigateToShop } from '@/ui/shop/shopActions';

export function RoundSelectScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Trail Map" />}>
      <RoundSelectCanvas />
      {isDevMode() ? (
        <div className="pointer-events-auto absolute top-4 right-4 z-10 flex flex-col gap-2">
          <ButtonElement variant="neutral" label="Go to Shop" onClick={navigateToShop} className="min-w-32" />
        </div>
      ) : null}
    </GameSceneLayout>
  );
}
