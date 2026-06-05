# MIGRATION 2: Relocate Tests Without Duplicates

Read `MIGRATION.md` before starting this step. This step assumes `MIGRATION_1.md` has already been completed.

## Purpose

Move the Phaser-era game tests to the migrated `src/game` tree so `bun run test` validates the new source of truth. Avoid running both the old and migrated copies.

## Inputs

Source tests:

- `src_phaser/game/__tests__`

Target tests:

- `src/game/__tests__`

## Key Requirement

Do not leave duplicate active test suites in both `src_phaser/game/__tests__` and `src/game/__tests__`.

If both copies remain active, `bun test` may double-run the same tests and report the wrong count. The requested final result is that `bun run test` passes with the expected 1796 tests, not duplicated legacy tests.

## Implementation Options

Preferred option:

- Move the test tree from `src_phaser/game/__tests__` to `src/game/__tests__`.
- Remove the old `src_phaser/game/__tests__` files after confirming the target copy exists.

Acceptable fallback if you must preserve the old tree temporarily:

- Rename old test files so Bun does not discover them, for example from `*.test.ts` to `*.legacy.ts`.
- This is only a temporary fallback. Prefer removing or moving the legacy test files when safe.

Do not modify test behavior just to make tests pass. Import and runtime failures should be fixed in `MIGRATION_3.md` and `MIGRATION_6.md`.

## Files And Patterns

Move all files under:

- `src_phaser/game/__tests__/**/*.test.ts`
- `src_phaser/game/__tests__/setup.ts`
- `src_phaser/game/__tests__/testHelpers.ts`
- `src_phaser/game/__tests__/testGameState.ts`
- `src_phaser/game/__tests__/testRunPlayer.ts`
- Any other helper files in `src_phaser/game/__tests__`

Preserve the relative directory structure under `src/game/__tests__`.

Examples:

- `src_phaser/game/__tests__/scoring.test.ts` -> `src/game/__tests__/scoring.test.ts`
- `src_phaser/game/__tests__/items/xMult.test.ts` -> `src/game/__tests__/items/xMult.test.ts`
- `src_phaser/game/__tests__/store/runActions.test.ts` -> `src/game/__tests__/store/runActions.test.ts`
- `src_phaser/game/__tests__/facade/round.test.ts` -> `src/game/__tests__/facade/round.test.ts`

## Import Expectations

Most tests use relative imports such as:

```ts
import { rollDie } from '../../DiceSystem';
import { getBaseTargetMilesForLeg } from '../../data/target_miles';
```

After moving tests from `src_phaser/game/__tests__` to `src/game/__tests__`, imports that point within `game` should mostly remain valid.

Imports that point from `game/__tests__` to `data` may need adjustment because the migrated `data` directory is `src/data`, not `src/game/data`. Examples:

- From `src/game/__tests__/scoring.test.ts`, `../../data/dice_enhancements` resolves to `src/data/dice_enhancements`. That should be correct.
- From `src/game/__tests__/items/xMult.test.ts`, `../../../data/trail_guides` resolves to `src/data/trail_guides`. That should be correct.

If a relative import breaks, fix the import to point at the migrated `src/game` or `src/data` location. Prefer relative imports in tests, matching the existing test style.

## Implementation Order

1. Ensure `src/game/__tests__` does not already contain a partial stale copy.
2. Copy or move the entire `src_phaser/game/__tests__` tree to `src/game/__tests__`.
3. Remove or disable the old `src_phaser/game/__tests__/**/*.test.ts` files so Bun does not discover duplicate tests.
4. Keep test helper files with the migrated tests.
5. Do not rewrite assertion logic unless a later verification step proves a real migration mismatch.

## Expected Result

After this step:

- `src/game/__tests__` contains the migrated test suite.
- `src_phaser/game/__tests__` does not contain active `*.test.ts` files.
- The project may still fail tests because imports and runtime dependencies are not fully fixed yet.

## Acceptance Checklist

- `src/game/__tests__/scoring.test.ts` exists.
- `src/game/__tests__/items` exists.
- `src/game/__tests__/store` exists.
- `src/game/__tests__/facade` exists.
- `src_phaser/game/__tests__` no longer contains active `*.test.ts` files.
- No test file imports from `src_phaser`.

