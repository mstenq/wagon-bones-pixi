/**
 * Pixi GameScene playback runner — not implemented yet.
 *
 * Game logic already enqueues `PlaybackCommand`s on `runState.playbackQueue`
 * (see `src/game/playback/types.ts`). Phaser drains them via
 * `src_phaser/phaser/playback/PlaybackRunner.ts` + `handlers.ts`.
 *
 * Intended post-score sequence (Phaser reference):
 * 1. `hand-upgrades` (if queued before `score`)
 * 2. `score` — layout scored dice, play score animation (`playScorePlayback`)
 * 3. `onScoreComplete` → `endDay` → `enterDrawPhase(true, carryover)` pouch fly-in
 * 4. `day-end-destructions` / `modifier-feedback` when deferred
 *
 * Until a Pixi runner exists, `DiceActionBar` calls `advanceAfterScore({ onNextDay })`
 * as a dev fallback so hand refill fly-in can be tested. Remove that callback once the
 * runner drains `score` and calls `requestHandRefillFlyIn` itself.
 *
 * When wiring:
 * - Add `bindScenePlaybackRunner` for the Pixi game screen (mirror Phaser's).
 * - After the `score` handler finishes, call `gameFacade.round.endDay()` then
 *   `controller.requestHandRefillFlyIn({ nextHandIds, previousRowIds })`.
 * - Use `useDiceRowHandRefill` + `useReorderableRow.beginHandFlyIn` for the fly-in.
 */

export const PIXI_GAME_SCENE_PLAYBACK_NOT_WIRED = true;
