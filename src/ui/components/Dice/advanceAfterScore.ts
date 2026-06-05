import { gameFacade } from '@/game/facade';
import { sceneActions } from '@/game/store/sceneStore';
import { clearScoreHandPreview } from '@/game/scoring/prepareScoreSidebar';
import { getRoundState } from '@/game/store/roundStore';

const POST_SCORE_ADVANCE_MS = 600;

export type AdvanceAfterScoreOptions = {
  /**
   * Dev fallback for post-score hand refill fly-in.
   *
   * Called after `endDay` when the round continues to the next day. `DiceActionBar`
   * passes this today so pouch fly-in can be tested without the Pixi playback runner.
   *
   * **Remove this callback path once the playback runner is wired:** after the `score`
   * playback command finishes, the runner should call `endDay` (if not already done)
   * and then `DiceRowController.requestHandRefillFlyIn({ nextHandIds, previousRowIds })`
   * using the roll-row snapshot captured before scoring.
   *
   * @see src/ui/playback/gameSceneRunner.ts
   */
  onNextDay?: (nextHandIds: readonly string[]) => void;
};

/**
 * Temporary day-end advance — bypasses `playbackQueue` score animation.
 *
 * Phaser: `playScorePlayback` → `onScoreComplete` → `onContinue` → `endDay` →
 * `enterDrawPhase(true, carryover)` (pouch fly-in). Pixi should drain queued
 * `hand-upgrades` / `score` first, then call `DiceRowController.requestHandRefillFlyIn`.
 *
 * @see src/ui/playback/gameSceneRunner.ts
 */
export function advanceAfterScore(options: AdvanceAfterScoreOptions = {}): void {
  window.setTimeout(() => {
    clearScoreHandPreview();

    const { outcome } = gameFacade.round.endDay({ deferEquipmentDestructionAnimation: true });

    gameFacade.round.clearHandPreviewOverlay();

    if (outcome === 'won') {
      gameFacade.run.preparePayoutPresentation();
      sceneActions.setActiveScene('Payout');
      return;
    }

    if (outcome === 'lost') {
      sceneActions.setActiveScene('RoundSelect');
      return;
    }

    const nextHandIds = getRoundState()?.handDiceIds ?? [];
    // Fallback until playback runner owns this transition — see AdvanceAfterScoreOptions.
    options.onNextDay?.(nextHandIds);
  }, POST_SCORE_ADVANCE_MS);
}
