# MIGRATION 6: Verify Formatting And Tests

Read `MIGRATION.md` before starting this step. This step assumes `MIGRATION_1.md` through `MIGRATION_5.md` have already been completed.

## Purpose

Run the requested verification commands and fix failures until the migration meets the user's acceptance criteria.

Required final commands:

```sh
bun run test
bun run format:check
```

Do not spend time on lint in this pass.

## Expected Final Result

- `bun run test` passes with all expected tests.
- `bun run format:check` reports no formatting errors.
- The minimal Pixi app can boot to a dice screen and roll via the migrated game facade.

## Before Running Full Verification

Check these basics first:

1. `package.json` includes runtime dependencies needed by migrated game code, especially `break_eternity.js`.
2. Active tests live under `src/game/__tests__`.
3. Legacy `src_phaser/game/__tests__/**/*.test.ts` files are not still active.
4. Active `src/game` has no Phaser imports.
5. `src/game/facade/gameFacade.ts` exposes the migrated facade shape.
6. The Pixi UI no longer depends on old placeholder `gameFacade.dice.roll()` or `gameFacade.cards.*`.

Useful searches:

```sh
rg "src_phaser" src/game src/data src/ui
rg "from ['\"]phaser|import .* from ['\"]phaser|Phaser\\." src/game
rg "gameFacade\\.dice\\.roll|gameFacade\\.cards|rollTargets|diceOrder|dieValues" src/ui src/game
```

Some matches in docs/comments may be fine. Active runtime imports or placeholder API usage should be fixed.

## Formatting

Run:

```sh
bun run format:check
```

If it fails, run:

```sh
bun run format
```

Then re-run:

```sh
bun run format:check
```

The format script only targets `src/**/*.{ts,tsx}`. If migration docs need formatting, adjust manually.

## Tests

Start with targeted tests if full test output is too noisy:

```sh
bun test src/game/__tests__/decimal.test.ts
bun test src/game/__tests__/scoring.test.ts
bun test src/game/__tests__/store/runActions.test.ts
bun test src/game/__tests__/facade/round.test.ts
```

Then run full verification:

```sh
bun run test
```

Fix failures by category.

## Common Failure Categories

### Missing package

Symptom:

```text
Cannot find package 'break_eternity.js'
```

Fix:

```sh
bun add break_eternity.js
```

Do not add guessed versions manually. Let Bun choose.

### Duplicate tests

Symptom:

- More tests than expected.
- Same test names appear from both `src_phaser` and `src`.

Fix:

- Ensure legacy `src_phaser/game/__tests__/**/*.test.ts` files are removed or renamed so Bun does not discover them.
- Keep the migrated tests under `src/game/__tests__`.

### Broken relative imports

Symptom:

```text
Cannot find module '../../data/...'
Cannot find module '../...'
```

Fix:

- For tests under `src/game/__tests__`, point data imports to `src/data` using the correct relative path.
- For game modules under `src/game`, point data imports to `src/data`.
- Prefer matching the existing local import style.

### Phaser leakage

Symptom:

```text
Cannot find package 'phaser'
```

Fix:

- Do not add Phaser just to satisfy migrated domain tests.
- Remove mistakenly copied host files from active `src/game`.
- Split any accidental Phaser-only UI dependency out of a domain module.

### Placeholder UI API still referenced

Symptom:

```text
Property 'dice' does not exist...
Property 'cards' does not exist...
Property 'dieValues' does not exist...
```

Fix:

- Update UI to migrated facade/store APIs as described in `MIGRATION_5.md`.
- Remove card row from active scene for now.
- Remove global dice enhancement picker for now.

### Dice texture type mismatch

Symptom:

- TypeScript complains that `DiceEnhancement` is not assignable to `DiceType`.
- Runtime missing texture for `null` enhancement.

Fix:

- Use a helper that maps `null` to `standard`.
- Explicitly handle unsupported enhancement values.
- Keep the Pixi dice catalog in `src/data/dice.ts` until dice assets are refactored.

## Optional Smoke Check

The user's requested checks are tests and formatting, but a quick app smoke check is useful if time allows:

```sh
bun run dev
```

Verify manually:

- The app starts.
- A dice row is visible.
- The Roll button is visible.
- Clicking Roll changes dice values through migrated game state.

Do not block final completion on lint.

## Implementation Order

1. Run `bun run format:check`.
2. If needed, run `bun run format`, then `bun run format:check` again.
3. Run targeted tests to identify import/package problems quickly.
4. Fix missing dependency, duplicate test, import, and Phaser leakage failures.
5. Run `bun run test`.
6. Repeat fixes until full tests pass.
7. Optionally smoke-test `bun run dev`.
8. Report exactly which commands passed.

## Acceptance Checklist

- `bun run format:check` passes.
- `bun run test` passes.
- Test count matches the expected migrated suite, not duplicated legacy tests.
- No active `src/game` imports Phaser.
- No active UI code depends on the removed placeholder game store/facade.
- Any commands that could not be run are clearly reported with the reason.

