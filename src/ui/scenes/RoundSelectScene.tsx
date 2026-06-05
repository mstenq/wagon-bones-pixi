import { useMemo } from 'react';

import { GAMEPLAY } from '@/game/Constants';
import { buildLegRoundCardModels, selectRoundSelectRevision } from '@/game/roundSelectModel';
import { useGameRunStore } from '@/game/store/reactHooks';
import { runStore } from '@/game/store/runStore';
import { selectBossPermitRerollLimit } from '@/game/store/selectors/runSelectors';
import { RoundCard } from '@/ui/components/RoundCard/RoundCard';
import { computeRoundSelectLayout } from '@/ui/layout/roundSelectLayout';
import {
  canRerollBossPermitForRun,
  playSelectedRound,
  rerollBossPermit,
  skipCurrentRound,
} from '@/ui/roundSelect/roundSelectActions';

export type RoundSelectSceneProps = {
  contentW: number;
  contentH: number;
};

export function RoundSelectScene({ contentW, contentH }: RoundSelectSceneProps) {
  const roundSelectRevision = useGameRunStore(selectRoundSelectRevision);
  const cardModels = useMemo(
    () => buildLegRoundCardModels(runStore.getState()),
    [roundSelectRevision],
  );
  const bossRerollAvailable = useGameRunStore((run) => selectBossPermitRerollLimit(run) !== 0);
  const rerollBossEnabled = useGameRunStore((run) => canRerollBossPermitForRun(run));

  const layout = useMemo(() => computeRoundSelectLayout(contentW, contentH), [contentH, contentW]);

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {cardModels.map((model) => {
        const placement = layout.cards.find((card) => card.round === model.round);
        if (!placement) {
          return null;
        }

        const isActive = model.showActions;
        const showBossReroll = model.showBossReroll && bossRerollAvailable;

        return (
          <RoundCard
            key={model.round}
            status={model.status}
            title={model.title}
            targetScore={model.targetScore}
            targetScoreLabel={model.targetScoreLabel}
            rewardAmount={model.rewardAmount}
            trailTag={isActive ? model.trailTag : undefined}
            x={placement.x}
            y={placement.y}
            onPlayRound={isActive ? playSelectedRound : undefined}
            onSkipRound={isActive && model.trailTag ? skipCurrentRound : undefined}
            onRerollBoss={showBossReroll ? rerollBossPermit : undefined}
            rerollBossEnabled={rerollBossEnabled}
            rerollBossLabel={`Reroll $${GAMEPLAY.BOSS_REROLL_COST}`}
          />
        );
      })}
    </pixiContainer>
  );
}
