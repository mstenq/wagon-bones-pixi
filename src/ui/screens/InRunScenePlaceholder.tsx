import type { ActiveSceneKey } from '@/game/store/types';
import { RunGameInfo } from '@/ui/components/GameInfo/RunGameInfo';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';
import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { GameSceneLayout } from '@/ui/layout/GameSceneLayout';
import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';

export type InRunScenePlaceholderProps = {
  scene: ActiveSceneKey;
};

const SCENE_LABELS: Partial<Record<ActiveSceneKey, string>> = {
  Shop: 'Shop',
  BoosterPack: 'Booster Pack',
  TrailEvent: 'Trail Event',
  Payout: 'Payout',
};

export function InRunScenePlaceholder({ scene }: InRunScenePlaceholderProps) {
  const label = SCENE_LABELS[scene] ?? scene;

  return (
    <GameSceneLayout sidebar={<RunGameInfo />}>
      <div className="flex min-h-full items-center justify-center p-6">
        <NeoSurface faceClassName="flex max-w-md flex-col gap-4 p-6 text-center">
          <h1 className="font-header m-0 text-2xl text-black">{label}</h1>
          <p className="font-body m-0 text-ui-panel-muted">This scene is not built in the Pixi UI yet.</p>
          <ButtonElement
            variant="neutral"
            label="Back to Round Select"
            onClick={navigateToRoundSelect}
          />
        </NeoSurface>
      </div>
    </GameSceneLayout>
  );
}
