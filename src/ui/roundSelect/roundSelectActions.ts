// ─── Round select facade actions (No Phaser imports) ───

import { GAMEPLAY } from '@/game/Constants';
import { gameFacade } from '@/game/facade/gameFacade';
import { prepareRoundSelectScene } from '@/game/roundSelectEntry';
import { canAfford } from '@/game/store/economy';
import { getRunState } from '@/game/store/runStore';
import type { RunState } from '@/game/store/types';
import { sceneActions } from '@/game/store/sceneStore';
import { enqueueHandUpgrades, enqueueTagEarned } from '@/game/store/playbackEnqueue';
import {
  selectBossPermitRerollLimit,
  selectCanBossPermitReroll,
  selectSkipPreviewTagForRound,
  selectTagDescriptionContextForRound,
} from '@/game/store/selectors/runSelectors';
import { navigateIfJourneyComplete } from '@/ui/runFlow/journeyNavigation';

export function refreshRoundSelectScene(): void {
  prepareRoundSelectScene();
}

/** Prepare round-select state and switch scenes — call from handlers, not during render. */
export function navigateToRoundSelect(): void {
  prepareRoundSelectScene();
  sceneActions.setActiveScene('RoundSelect');
}

export function playSelectedRound(): void {
  sceneActions.clearRoundSelect();
  gameFacade.round.beginRoundSession({ restored: false });
  sceneActions.setActiveScene('Game');
}

function finishSkipFlow(): void {
  const equipTags = gameFacade.meta.consumeTagsByCategory('immediate_equipment');
  for (const tag of equipTags) {
    gameFacade.meta.processJunkPileTag(tag);
  }

  if (navigateIfJourneyComplete()) {
    return;
  }

  refreshRoundSelectScene();
}

export function skipCurrentRound(): void {
  const run = getRunState();
  const tagDef = selectSkipPreviewTagForRound(run, run.round);
  if (!tagDef) {
    return;
  }

  const skippedRound = run.round;
  const previewMeta = selectTagDescriptionContextForRound(run, skippedRound);

  gameFacade.meta.recordRoundSkipped(tagDef, previewMeta);
  const tagInstance = gameFacade.meta.grantTag(tagDef, previewMeta);
  gameFacade.meta.advanceRound(true);

  gameFacade.meta.processChangeOfGuardTags();

  const immediateResults = gameFacade.meta.processImmediateTags();
  for (const result of immediateResults) {
    if (result.type === 'money') {
      // Playback runner will render toasts later; state is already applied.
    }
  }

  if (!gameFacade.meta.isImmediateTag(tagInstance.def.category)) {
    enqueueTagEarned(tagInstance.def.id, tagInstance.def.category, skippedRound);
  }

  const handUpgrades = immediateResults
    .map((result) => result.handUpgrade)
    .filter((upgrade): upgrade is NonNullable<typeof upgrade> => upgrade != null);
  enqueueHandUpgrades(handUpgrades);

  finishSkipFlow();
}

export function canRerollBossPermitForRun(run: RunState): boolean {
  return (
    selectBossPermitRerollLimit(run) !== 0 &&
    selectCanBossPermitReroll(run) &&
    canAfford(run, GAMEPLAY.BOSS_REROLL_COST)
  );
}

export function rerollBossPermit(): void {
  if (!gameFacade.meta.tryBossPermitReroll()) {
    return;
  }
  refreshRoundSelectScene();
}
