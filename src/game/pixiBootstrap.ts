// ─── Pixi app bootstrap: default profession/difficulty + active round (No Phaser) ───

import { getProfessionById } from '../data/professions';
import { gameFacade } from './facade/gameFacade';
import { resetAllGameStores } from './store/resetAll';
import { setupActions } from './store/actions/setupActions';
import { getRunState } from './store/runStore';
import { getRoundState } from './store/roundStore';
import { getSceneState, sceneActions } from './store/sceneStore';

/** First profession in `src/data/professions.ts` — simple starting pouch for minimal Pixi UI. */
const DEFAULT_PROFESSION_ID = 'farmer';

let pixiGameBootstrapped = false;

function isPixiGameReady(): boolean {
  const run = getRunState();
  return run.dice.length > 0 && getRoundState() !== null;
}

/**
 * Idempotent bootstrap for the Pixi app: reset stores, apply defaults, begin a round.
 * Safe across React strict-mode double render and module re-evaluation when stores already hold state.
 */
export function bootstrapPixiGame(): void {
  if (pixiGameBootstrapped) {
    return;
  }

  if (isPixiGameReady()) {
    pixiGameBootstrapped = true;
    if (getSceneState().activeScene !== 'Game') {
      sceneActions.setActiveScene('Game');
    }
    return;
  }

  if (!getProfessionById(DEFAULT_PROFESSION_ID)) {
    throw new Error(`pixiBootstrap: missing profession "${DEFAULT_PROFESSION_ID}"`);
  }

  pixiGameBootstrapped = true;

  resetAllGameStores();
  sceneActions.reset();
  setupActions.setDifficulty(1);
  setupActions.applyProfession(DEFAULT_PROFESSION_ID);
  setupActions.finalizeRunSetup();
  gameFacade.round.beginRoundSession({ restored: false });
  sceneActions.setActiveScene('Game');
}
