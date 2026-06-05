# Phaser To Pixi Game Migration

This document is the shared overview for migrating the game/domain code from `src_phaser/` into the active Pixi/React app under `src/`.

Each implementation agent should read this file first, then read only the numbered `MIGRATION_N.md` file assigned to them. The numbered files are written to be self-contained, but this overview defines the global constraints and final target.

## Goal

Move the Phaser-era game and data domain code into `src/`, keep Phaser scenes/UI out of the Pixi app, and wire the current Pixi UI directly to the migrated game facade/store.

At the end:

- `src/game` contains the migrated game rules, stores, facades, systems, scoring, persistence helpers, tests, and domain utilities.
- `src/data` contains the migrated data definitions from `src_phaser/data`, plus any narrow Pixi compatibility catalog still needed by dice rendering.
- The app uses the Pixi UI in `src/ui`, not Phaser scenes.
- The minimal Pixi game screen starts from a bootstrapped run with a default profession and difficulty, displays the active hand dice, and can roll through the migrated `gameFacade`.
- `bun run test` passes with all expected tests.
- `bun run format:check` has no formatting errors.
- Do not spend time on `bun run lint` for this migration pass.

## Non-Goals

- Do not port Phaser scene UI into Pixi.
- Do not rebuild shop, pack, trail, payout, profession select, difficulty select, or menu UI yet.
- Do not solve asset loading for migrated item/card art yet, except for the existing Pixi dice display.
- Do not add a parallel demo game store. The Pixi UI should consume the migrated game facade/store with a temporary bootstrap path.

## Global Rules

- Preserve unrelated user changes. The repo may already be dirty.
- Prefer existing migrated game APIs over inventing new abstractions.
- Do not reintroduce Phaser as an active dependency unless a migrated domain file truly cannot be separated from it. The intended target excludes Phaser host files.
- Avoid React `useEffect`. If it is truly unavoidable, add a short comment directly above it explaining why handlers, render-time reset, `use()`, or tick logic cannot cover the case.
- Do not use nested ternaries for non-trivial branching.
- Do not use inline type imports such as `import('./x').Type`; add top-level `import type`.
- Keep edits focused on the assigned step.
- Run formatting for changed `src/**/*.{ts,tsx}` files before handing off when practical.

## Source And Target Map

Primary source:

- `src_phaser/game`
- `src_phaser/data`
- `src_phaser/game/__tests__`

Primary target:

- `src/game`
- `src/data`
- `src/game/__tests__`

Do not migrate these Phaser host files into active `src/game`:

- `src_phaser/game/config.ts`
- `src_phaser/game/main.ts`
- `src_phaser/game/EventBus.ts`

Do not migrate the Phaser UI/scene tree into active `src/`:

- `src_phaser/phaser`
- `src_phaser/App.tsx`
- `src_phaser/PhaserGame.tsx`

## Step Index

1. `MIGRATION_1.md`: Stage the domain copy and required runtime dependencies.
2. `MIGRATION_2.md`: Relocate tests without double-running the legacy copies.
3. `MIGRATION_3.md`: Fix imports, barrels, and Phaser leakage after relocation.
4. `MIGRATION_4.md`: Add a Pixi bootstrap path that starts a real migrated run/round.
5. `MIGRATION_5.md`: Wire the minimal Pixi dice UI to the migrated facade/store.
6. `MIGRATION_6.md`: Verify formatting and tests, then fix failures.

## Expected Minimal Runtime Flow

The final minimal Pixi flow should be:

```text
App starts
  -> bootstrap migrated game stores
  -> choose default difficulty and profession
  -> finalize run setup
  -> begin/start an active round
  -> GameScene renders active hand dice
  -> Roll button calls migrated facade round action
  -> DiceRow animates from current values to migrated round results
```

The temporary bootstrap is allowed because the real selection/menu flow is not part of this pass. The temporary bootstrap should not replace the real game stores.

## Success Criteria

- `src_phaser` is no longer needed by the active app or migrated tests.
- `src/game` and `src/data` are the source of truth for game/domain code.
- The current Pixi screen can show dice and roll them through the migrated game logic.
- `bun run test` passes.
- `bun run format:check` passes.

