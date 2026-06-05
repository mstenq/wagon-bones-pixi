import { gameFacade } from '@/game/facade/gameFacade';
import { sceneActions, sceneStore } from '@/game/store/sceneStore';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';

export function collectPayoutAndContinue(): void {
  const payoutState = sceneStore.getState().payout;
  if (!payoutState) {
    return;
  }

  const { breakdown, presentation } = payoutState;
  const journeyDone = gameFacade.meta.collectPayout(breakdown.total, presentation.investmentBonus);
  sceneActions.clearPayout();

  if (journeyDone) {
    // TODO: navigate to GameOver when Pixi UI supports it (mirror roundSelectActions.finishSkipFlow).
    return;
  }

  navigateToRoundSelect();
}
