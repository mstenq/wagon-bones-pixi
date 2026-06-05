import { isDevMode } from '@/game/DevMode';
import { ShopCanvas } from '@/ui/app/ShopCanvas';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';

export function ShopScreen() {
  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Shop" />}>
      <ShopCanvas />
      {isDevMode() ? (
        <div className="pointer-events-auto absolute top-4 right-4 z-10">
          <ButtonElement variant="neutral" label="Round Select" onClick={navigateToRoundSelect} className="min-w-32" />
        </div>
      ) : null}
    </GameSceneLayout>
  );
}
