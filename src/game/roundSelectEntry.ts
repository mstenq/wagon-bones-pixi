// ─── Round select scene entry (No Phaser / React imports) ───

import { gameFacade } from './facade/gameFacade';
import { getRunState } from './store/runStore';
import { sceneActions } from './store/sceneStore';

export function prepareRoundSelectScene(): void {
  gameFacade.meta.ensureRoundSkipPreviewTags();
  sceneActions.syncRoundSelectFromRun(getRunState().roundSkipPreviewTags);
}
