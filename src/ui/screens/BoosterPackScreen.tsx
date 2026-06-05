import { getPackDefById } from '@/game/BoosterPackSystem';
import { useGameSceneStore } from '@/game/store/reactHooks';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';
import { skipBoosterPack } from '@/ui/shop/boosterPackActions';

export function BoosterPackScreen() {
  const pack = useGameSceneStore((state) => state.boosterPack);
  const packDef = pack ? getPackDefById(pack.packDefId) : null;

  return (
    <GameSceneLayout sidebar={<RunGameInfo titleOverride="Booster Pack" />}>
      <div className="flex min-h-full items-center justify-center p-6">
        <NeoSurface faceClassName="flex max-w-md flex-col gap-4 p-6 text-center">
          <h1 className="font-header m-0 text-2xl text-black">{packDef?.name ?? 'Booster Pack'}</h1>
          <p className="font-body m-0 text-ui-panel-muted">
            Full pack-opening UI is not built yet. Skip to return to the shop and keep testing other flows.
          </p>
          {pack ? (
            <p className="font-body m-0 text-sm text-black">
              Picks remaining: {pack.picksRemaining} / {pack.effectivePickCount}
            </p>
          ) : null}
          <ButtonElement variant="primary" label="Skip Pack" onClick={skipBoosterPack} />
        </NeoSurface>
      </div>
    </GameSceneLayout>
  );
}
