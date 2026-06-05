import { useMemo } from 'react';

import { getRunState } from '@/game/store/runStore';
import { selectGameInfoRevision, selectGameInfoViewModel } from '@/game/store/selectors/gameInfoSelectors';
import { useGameRoundStore, useGameRunStore } from '@/game/store/reactHooks';
import { GameInfo } from '@/ui/components/GameInfo/GameInfo';
import { useMediaQuery } from '@/ui/hooks/useMediaQuery';
import { difficultyLevelToCss } from '@/ui/theme/difficultyColors';

export type RunGameInfoProps = {
  titleOverride?: string;
  onRunInfoClick?: () => void;
  onOptionsClick?: () => void;
  className?: string;
};

export function RunGameInfo({ titleOverride, onRunInfoClick, onOptionsClick, className }: RunGameInfoProps) {
  const isLandscapeViewport = useMediaQuery('(orientation: landscape)');
  const runRevision = useGameRunStore(selectGameInfoRevision);
  const roundRevision = useGameRoundStore((round) => {
    if (!round) {
      return 'none';
    }
    return `${round.phase}|${JSON.stringify(round.sidebarOverlay ?? null)}|${round.totalMiles.toString()}`;
  });

  const model = useMemo(
    () => selectGameInfoViewModel(getRunState(), { titleOverride }),
    [runRevision, roundRevision, titleOverride],
  );

  const displayMode = isLandscapeViewport ? 'portrait' : 'landscape';

  return (
    <GameInfo
      displayMode={displayMode}
      roundInfo={{
        title: model.title,
        subtitle: model.subtitle,
        iconSrc: model.iconSrc,
        difficultyColor: difficultyLevelToCss(model.difficultyLevel),
        targetScore: model.targetScore,
        targetScoreLabel: model.targetScoreLabel,
        payoutAmount: model.payoutAmount,
      }}
      roundScore={model.roundScore}
      roundScoreLabel={model.roundScoreLabel}
      profession={{ name: model.professionName }}
      modifiers={model.modifiers}
      handInfo={{
        handName: model.handName,
        level: model.handLevel,
        chips: model.chips,
        mult: model.mult,
      }}
      stats={{
        hands: model.hands,
        rerolls: model.rerolls,
        legCurrent: model.legCurrent,
        legTotal: model.legTotal,
        round: model.round,
      }}
      balance={model.balance}
      onRunInfoClick={onRunInfoClick}
      onOptionsClick={onOptionsClick}
      className={className}
    />
  );
}
