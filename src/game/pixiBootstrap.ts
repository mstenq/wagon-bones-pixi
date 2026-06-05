// ─── Dev-only Pixi game bootstrap (skips menu flow) ───

import { getProfessionById } from '../data/professions';
import { gameFacade } from './facade/gameFacade';
import { resetAllGameStores } from './store/resetAll';
import { setupActions } from './store/actions/setupActions';
import { getRunState } from './store/runStore';
import { getRoundState } from './store/roundStore';
import { sceneActions } from './store/sceneStore';

const DEFAULT_PROFESSION_ID = 'farmer';

/** Start a minimal in-game session for playground / manual testing — not used by the main app shell. */
export function startDevGame(): void {
  if (!getProfessionById(DEFAULT_PROFESSION_ID)) {
    throw new Error(`startDevGame: missing profession "${DEFAULT_PROFESSION_ID}"`);
  }

  resetAllGameStores();
  sceneActions.reset();
  setupActions.setDifficulty(1);
  setupActions.applyProfession(DEFAULT_PROFESSION_ID);
  setupActions.finalizeRunSetup();
  gameFacade.meta.initRunRng(gameFacade.meta.generateRunSeed());
  gameFacade.meta.assignBosses();
  gameFacade.round.beginRoundSession({ restored: false });
  sceneActions.setActiveScene('Game');
}

export function isDevGameReady(): boolean {
  const run = getRunState();
  return run.dice.length > 0 && getRoundState() !== null;
}
