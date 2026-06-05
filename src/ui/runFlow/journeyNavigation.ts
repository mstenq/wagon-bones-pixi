import { recordStoryVictory } from '@/game/UserStats';
import { getRunState } from '@/game/store/runStore';
import { selectJourneyComplete, selectStoryVictoryOffered } from '@/game/store/selectors/runSelectors';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';

/**
 * When the run has reached its journey end, record story victory and open round select.
 * Pixi GameOver is not implemented yet; round select is the interim destination.
 * Returns true when navigation was handled.
 */
export function navigateIfJourneyComplete(): boolean {
  const run = getRunState();
  if (!selectJourneyComplete(run)) {
    return false;
  }

  if (selectStoryVictoryOffered(run) && run.professionId) {
    recordStoryVictory(run.professionId, run.difficulty);
  }

  navigateToRoundSelect();
  return true;
}
