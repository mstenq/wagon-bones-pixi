import { gameFacade } from '@/game/facade/gameFacade';
import { sceneActions, sceneStore } from '@/game/store/sceneStore';
import { navigateIfJourneyComplete } from '@/ui/runFlow/journeyNavigation';
import { navigateToTrailEvent } from '@/ui/trailEvent/trailEventActions';

export function collectPayoutAndContinue(): void {
  const payoutState = sceneStore.getState().payout;
  if (!payoutState) {
    return;
  }

  const { breakdown, presentation } = payoutState;
  const journeyDone = gameFacade.meta.collectPayout(breakdown.total, presentation.investmentBonus);
  sceneActions.clearPayout();

  if (journeyDone && navigateIfJourneyComplete()) {
    return;
  }

  navigateToTrailEvent();
}
