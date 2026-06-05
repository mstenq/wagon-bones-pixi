import type { Decimal } from '@/game/decimal';
import type { HandType, ScoreResult } from '@/game/types';
import { roundActions } from '@/game/store/actions/roundActions';
import { getRunHandStats } from '@/game/store/runReads';
import { milesToSave } from '@/game/scoreMath';

/** Sidebar hand display after scoring (mirrors Phaser prepareScoreSidebar). */
export function prepareScoreSidebar(result: ScoreResult, roundScoreBefore: Decimal): void {
  const handType = result.handResult.type as HandType;
  const stats = getRunHandStats(handType);
  const matchingUpgrades = result.handUpgrades?.filter((upgrade) => upgrade.handType === handType) ?? [];
  const handLevel = matchingUpgrades.length > 0 ? matchingUpgrades[0].oldLevel : stats.level;

  roundActions.setSidebarOverlay({
    title: 'SCORING',
    handName: result.handResult.name,
    handLevel,
    milesBaseSave: milesToSave(result.handResult.baseMiles),
    multSave: milesToSave(result.mult),
  });

  result.roundScoreBefore = roundScoreBefore;
}

export function clearScoreHandPreview(): void {
  roundActions.setSidebarOverlay({
    handName: '',
    handLevel: 0,
    milesBaseSave: milesToSave(0),
    multSave: milesToSave(0),
  });
}
