# MIGRATION 1: Stage Domain Copy And Dependencies

Read `MIGRATION.md` before starting this step.

## Purpose

Replace the placeholder `src/game` and `src/data` implementation with the Phaser-era domain source, while keeping Phaser host/UI files out of the active Pixi app.

This step should make the target files exist in the right places. Later steps will fix imports, tests, bootstrapping, and UI wiring.

## Inputs

Source directories:

- `src_phaser/game`
- `src_phaser/data`

Target directories:

- `src/game`
- `src/data`

Current placeholder directories to replace:

- `src/game`
- `src/data`

## Files To Exclude

Do not copy these files into active `src/game`:

- `src_phaser/game/config.ts`
- `src_phaser/game/main.ts`
- `src_phaser/game/EventBus.ts`

Do not copy these trees/files into active `src/`:

- `src_phaser/phaser`
- `src_phaser/App.tsx`
- `src_phaser/PhaserGame.tsx`

These are Phaser host/UI concerns and are not part of the Pixi migration.

## Important Compatibility Note

The current Pixi dice rendering expects a `DiceType` style catalog with `standard`, `wooden`, `stone`, `steel`, `gold`, `bone`, `diamond`, `lucky`, and `loaded`.

The Phaser data source does not have a direct `src_phaser/data/dice.ts` equivalent. It stores dice metadata across game types and data files such as:

- `src_phaser/game/types.ts`
- `src_phaser/data/dice_enhancements.ts`
- `src_phaser/data/dice_auras.ts`

For this step, preserve or recreate a narrow `src/data/dice.ts` compatibility file after replacing `src/data`. Later steps will wire it to the migrated types.

Minimum exports expected by existing Pixi dice code:

```ts
export const DICE_COUNT = 8;
export const DICE_TYPES = [
  'standard',
  'wooden',
  'stone',
  'steel',
  'gold',
  'bone',
  'diamond',
  'lucky',
  'loaded',
] as const;
export type DiceType = (typeof DICE_TYPES)[number];
export const DICE_ENHANCEMENT_OPTIONS = [
  'bone',
  'diamond',
  'gold',
  'loaded',
  'lucky',
  'standard',
  'steel',
  'stone',
  'wooden',
] as const satisfies readonly DiceType[];
export const DICE_LABELS: Record<DiceType, string> = {
  standard: 'Standard',
  wooden: 'Wooden',
  stone: 'Stone',
  steel: 'Steel',
  gold: 'Gold',
  bone: 'Bone',
  diamond: 'Diamond',
  lucky: 'Lucky',
  loaded: 'Loaded',
};
```

It is acceptable to improve this later by deriving it from migrated game constants/types, but do not block the domain copy on that refactor.

## Dependency Check

The migrated score math uses `break_eternity.js`. If `package.json` does not include it, add it with Bun:

```sh
bun add break_eternity.js
```

Do not add `phaser` for this migration step. If a copied domain file imports Phaser, that file probably should have been excluded or split in a later step.

## Implementation Order

1. Save or note the current placeholder `src/data/dice.ts` compatibility exports.
2. Replace the current `src/game` tree with the contents of `src_phaser/game`, excluding the Phaser host files listed above.
3. Replace the current `src/data` tree with the contents of `src_phaser/data`.
4. Recreate `src/data/dice.ts` with the compatibility exports above if it was removed.
5. Add `break_eternity.js` if missing.
6. Do not relocate tests yet. That is handled in `MIGRATION_2.md`.
7. Do not attempt to fully fix imports yet. That is handled in `MIGRATION_3.md`.

## Expected Result

After this step:

- `src/game` contains the migrated Phaser-era domain modules except host files.
- `src/data` contains the migrated data modules plus a `dice.ts` compatibility catalog.
- `src/game/config.ts`, `src/game/main.ts`, and `src/game/EventBus.ts` should not exist unless another step explicitly creates non-Phaser replacements.
- `package.json` includes `break_eternity.js` if the migrated code needs it.

The project may not compile or pass tests yet. That is expected until later migration steps complete.

## Acceptance Checklist

- `src/game/DiceSystem.ts` exists.
- `src/game/store/runStore.ts` is the migrated full run store, not the old placeholder dice demo store.
- `src/game/facade/gameFacade.ts` exists.
- `src/data/items.ts` is the migrated large item data file, not the old 5-item stub.
- `src/data/dice.ts` exists and exports the compatibility dice catalog.
- No active `src/game` file imports from `phaser` after this copy step.

