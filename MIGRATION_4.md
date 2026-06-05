# MIGRATION 4: Bootstrap A Real Migrated Run For Pixi

Read `MIGRATION.md` before starting this step. This step assumes `MIGRATION_1.md`, `MIGRATION_2.md`, and `MIGRATION_3.md` have already been completed.

## Purpose

Create a temporary bootstrap path that initializes the migrated game stores into a playable round for the current Pixi UI.

Do not add a parallel `uiDiceDemoStore`. The UI should consume real migrated run/round state.

## Desired Behavior

When the Pixi app starts:

1. Reset all migrated game stores.
2. Select a default difficulty.
3. Select/apply a default profession.
4. Finalize run setup so the run has dice and correct starting metadata.
5. Begin or start a round session.
6. Put the game in the phase/state needed for the minimal Pixi dice UI to show hand dice and roll them.

This replaces the old Phaser flow temporarily:

```text
Main menu -> profession select -> difficulty select -> round select -> game scene
```

with:

```text
App boot -> default profession/difficulty -> active round -> Pixi dice UI
```

## Candidate Files

Add a bootstrap helper:

- `src/game/pixiBootstrap.ts`

Use it from the React/Pixi app entry area, likely one of:

- `src/ui/app/App.tsx`
- `src/ui/app/GameCanvas.tsx`
- `src/ui/scenes/GameScene.tsx`

Prefer calling bootstrap at module/app initialization time or during render with an idempotent guard. Avoid `useEffect`.

## Existing APIs To Prefer

Use migrated APIs where possible:

- `resetAllGameStores` from `src/game/store/resetAll.ts`
- `setupActions` from `src/game/store/actions/setupActions.ts`
- `gameRound`, `initRoundSession`, or `startRoundSession` from `src/game/facade/round.ts`
- `gameFacade.round` from `src/game/facade/gameFacade.ts`
- `getRunState` from `src/game/store/runStore.ts`
- `getRoundState` from `src/game/store/roundStore.ts`
- `sceneActions` from `src/game/store/sceneStore.ts`

Avoid reaching into internal helpers unless the public actions do not expose what is needed.

## Suggested Bootstrap Shape

The exact profession id should come from migrated `src/data/professions.ts`. Pick a stable, simple profession that exists in the data. If unsure, inspect the data and use the first profession id.

Suggested structure:

```ts
let pixiGameBootstrapped = false;

export function bootstrapPixiGame(): void {
  if (pixiGameBootstrapped) {
    return;
  }
  pixiGameBootstrapped = true;

  resetAllGameStores();
  setupActions.setDifficulty(1);
  setupActions.applyProfession(DEFAULT_PROFESSION_ID);
  setupActions.finalizeRunSetup();
  gameFacade.round.beginRoundSession();
  sceneActions.setActiveScene('Game');
}
```

Adjust names to match actual exports after migration.

If `beginRoundSession()` leaves the round in `SELECT` phase and the current Pixi button expects a roll-ready state, prefer updating the UI in `MIGRATION_5.md` to roll the full active hand through `selectDiceForRoll`. Only patch phase manually if the migrated APIs cannot reach the needed state.

## Idempotency Requirement

The bootstrap must be safe if React renders more than once.

Do this:

- Use a module-level boolean guard.
- Or check existing store state, for example whether `getRunState().dice.length > 0` and `getRoundState()` already exists.

Do not do this:

- Do not reset the run every render.
- Do not use `useEffect` just to make bootstrapping happen after mount.

## Store Subscription For React

If the UI needs React hooks for the migrated vanilla stores, add small hooks near the stores or a UI adapter module.

Example pattern:

```ts
import { useStore } from 'zustand';
import { roundStore, type RoundStoreState } from '@/game/store/roundStore';

export function useRoundStore<T>(selector: (state: RoundStoreState) => T): T {
  return useStore(roundStore, selector);
}
```

If adding hooks:

- Keep them thin.
- Do not duplicate state.
- Do not name them like the old placeholder `useRunStore` if that causes type confusion with the migrated run store. Use clear names such as `useGameRunStore`, `useGameRoundStore`, or colocate in a Pixi UI adapter.

## Implementation Order

1. Inspect migrated professions and choose a default id.
2. Add `src/game/pixiBootstrap.ts`.
3. Ensure the helper imports only migrated game/data APIs, not UI or Phaser.
4. Call `bootstrapPixiGame()` from the Pixi app path before dice UI reads state.
5. Add thin React store selector hooks if needed by `MIGRATION_5.md`.
6. Confirm the bootstrap creates a run with dice and a non-null round state.

## Expected Result

After this step:

- There is an idempotent bootstrap helper.
- The active app can initialize migrated game state without Phaser scenes.
- No temporary demo store has been introduced.
- The UI may still need wiring changes before it renders correctly. That is handled in `MIGRATION_5.md`.

## Acceptance Checklist

- `src/game/pixiBootstrap.ts` exists.
- The bootstrap uses migrated store/facade APIs.
- The bootstrap selects a real profession id from `src/data/professions.ts`.
- The bootstrap sets a default difficulty.
- The bootstrap starts or begins a round.
- The bootstrap is idempotent.
- No `useEffect` is added for bootstrap unless there is a documented, unavoidable reason.
- No `uiDiceDemoStore` or equivalent parallel game state is created.

