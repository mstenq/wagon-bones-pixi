# Notes

## Pixi playback runner (not implemented yet)

Game logic enqueues UI animation work on `runState.playbackQueue` (`PlaybackCommand` in `src/game/playback/types.ts`). Queue helpers live in `src/game/playback/queue.ts` (`enqueuePlayback`, `takePlayback`, `clearPlayback`).

**Phaser reference implementation**

- `src_phaser/phaser/playback/PlaybackRunner.ts` — subscribes to queue length, drains FIFO, `isAutoDrainCommand` filter
- `src_phaser/phaser/playback/handlers.ts` — per-`kind` handlers
- `src_phaser/phaser/playback/bindScenePlaybackRunner.ts` — scene wiring
- `src_phaser/phaser/scenes/GameScene.ts` — `onScoreComplete` → 600ms delay → `onContinue()` → `endDay()` → `enterDrawPhase(true, carryover)`

**Pixi stub**

- `src/ui/playback/gameSceneRunner.ts` — intended integration notes; `PIXI_GAME_SCENE_PLAYBACK_NOT_WIRED = true`
- No Pixi runner yet. `DiceActionBar` bypasses the queue via `advanceAfterScore()` (see below).

---

### Intended post-score sequence (mirror Phaser)

1. `submitScore(..., { deferConsumableGrants: true })` — enqueues `hand-upgrades` (if any) then `score` on `playbackQueue`; sets phase `DAY_END`; **does not** clear `selectedForScoreIds`.
2. Runner drains `hand-upgrades` → `score` (score layout gate + `playScoreAnimation` equivalent).
3. On score playback complete → `endDay({ deferEquipmentDestructionAnimation: true })`.
4. If `outcome === 'next-day'` → **`DiceRowController.requestHandRefillFlyIn`** (pouch fly-in for replacements).
5. Drain deferred `day-end-destructions` / `modifier-feedback` when applicable (Phaser waits on these before `enterDrawPhase`).
6. Win/loss → scene change (`Payout` / `RoundSelect`); no hand refill.

---

### DiceRow integration (already built)

Provider wraps `GameScreen`: `DiceRowControllerProvider` in `src/ui/screens/GameScreen.tsx`.

**Imperative API** (`src/ui/components/DiceRow/DiceRowController.tsx`):

| Method | Purpose |
|--------|---------|
| `requestHandRefillFlyIn({ nextHandIds, previousRowIds, onComplete? })` | Trigger post-`endDay` hand transition |
| `getRollRowSnapshot()` | Last roll-phase row order (updated each tick while phase is `ROLL`) |
| `isAnimating` | Gates action bar while roll / sort / fly-in runs |

Handlers are bound inside `DiceRow.tsx` via `bindHandlers` → `useDiceRowHandRefill`, roll animation, sort/reroll.

**Hand refill implementation**

- `useDiceRowHandRefill` — partitions carryover vs new ids (`partitionHandRefill` in `diceRowOrder.ts`), calls `useReorderableRow.beginHandFlyIn`
- `useReorderableRow.beginHandFlyIn` — requires `targetLayout` for full hand width; carryover dice reposition to left slots (~250ms), then new dice fly from pouch (`pouchLaunch` from `GameScenePixiLayout`)
- `setDeferHandReset(true)` during fly-in so `useDiceRowPhaseState` does not snap `visualOrder` to `handDiceIds` before animation finishes

**`previousRowIds`**

- Use the roll-row order at score time (visual order / rolled row), **not** `handDiceIds` from a prior day.
- Capture before `submitScore` or use `getRollRowSnapshot()` as fallback.
- Compared to `nextHandIds` from `getRoundState().handDiceIds` after `endDay` to decide which ids fly from pouch.

---

### Critical gotchas

1. **Do not clear `selectedForScoreIds` before `endDay`.**  
   `endDay()` reads `round.selectedForScoreIds` to know carryover vs refill. Clearing early (as `DiceActionBar` once did) makes every rolled die carry over and draws zero replacements. Phaser keeps selection until `onContinue` → `endDay`. `endDay` clears selection in its own `patchRound`.

2. **Do not drive hand refill from phase heuristics alone.**  
   `selectDisplayOrder` / `useDiceRowPhaseState` can hide scored dice during `DAY_END` and sync stale `visualOrder`, but the full transition (carryover slide + pouch fly-in) must be triggered explicitly via `requestHandRefillFlyIn`. See comments in `diceRowOrder.ts`.

3. **Layout width must match target hand size during fly-in.**  
   Fly-in slot targets use `layoutForDiceCount(baseLayout, nextHand.length)`. Using the narrowed carryover-only layout causes new dice to target off-screen positions until a later sort.

4. **`submitScore` already enqueues playback.**  
   Pixi runner must drain those commands; do not double-apply score logic. Sidebar prep: `prepareScoreSidebar` in `src/game/scoring/prepareScoreSidebar.ts` (currently called from `DiceActionBar` before the dev shortcut).

5. **`deferConsumableGrants: true` on score** — consumable grants wait for playback; runner should apply them when implementing score handler.

6. **Score layout gate** — Phaser uses `scoreLayoutGate` (promise resolved after score layout tweens) before `playScoreAnimation`. Pixi will need an equivalent if score layout is split from die anim events.

---

### Dev fallback (remove when runner is wired)

Today `DiceActionBar.handleScore` calls:

```ts
advanceAfterScore({
  onNextDay: (nextHandIds) => {
    controller.requestHandRefillFlyIn({ nextHandIds, previousRowIds });
  },
});
```

`advanceAfterScore` (`src/ui/components/Dice/advanceAfterScore.ts`) skips queue drain, waits 600ms, calls `endDay`, then invokes `onNextDay`. **Replace this path** so the runner owns timing: drain `hand-upgrades` + `score`, then `endDay`, then `requestHandRefillFlyIn`, then remove `onNextDay` from `DiceActionBar`.

---

### Other queue commands (need Pixi handlers)

Beyond score/day-end: `dice-added`, `round-start-destructions`, `round-start-equipment-created`, `equipment-created`, `equipment-created-count`, `equipment-destroyed`, `consumable-playback`, `score-events`, `tag-earned`, `modifier-feedback`, `toast`. See `handlers.ts` for Phaser behavior. Equipment/consumable bars and tag stack exist in Pixi layout but are not wired to a runner.

---

### Key files (Pixi)

| Area | Path |
|------|------|
| Runner stub | `src/ui/playback/gameSceneRunner.ts` |
| Queue types | `src/game/playback/types.ts` |
| Score shortcut | `src/ui/components/Dice/advanceAfterScore.ts` |
| Score UI entry | `src/ui/components/Dice/DiceActionBar.tsx` |
| Row controller | `src/ui/components/DiceRow/DiceRowController.tsx` |
| Row orchestration | `src/ui/components/DiceRow/DiceRow.tsx` |
| Hand refill hook | `src/ui/components/DiceRow/useDiceRowHandRefill.ts` |
| Display order policy | `src/ui/components/DiceRow/diceRowOrder.ts` |
| Fly-in / drag row | `src/ui/interaction/useReorderableRow.ts` |
| Pouch launch point | `src/ui/layout/GameScenePixiLayout.tsx` → `GameScene` → `DiceRow` |
