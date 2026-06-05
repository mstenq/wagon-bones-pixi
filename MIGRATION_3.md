# MIGRATION 3: Fix Imports, Barrels, And Phaser Leakage

Read `MIGRATION.md` before starting this step. This step assumes `MIGRATION_1.md` and `MIGRATION_2.md` have already been completed.

## Purpose

Make the migrated `src/game`, `src/data`, and `src/game/__tests__` source tree internally consistent after relocation.

This step is mostly import repair and public export cleanup. Do not build new UI behavior here.

## Main Problems To Solve

After copying from `src_phaser`, some imports may still point to paths that only made sense in the old tree. You need to:

- Fix relative imports from game modules to data modules.
- Fix relative imports from tests to migrated game/data modules.
- Remove or split any remaining Phaser imports from active `src/game`.
- Ensure public barrels expose the migrated game API.
- Keep the narrow Pixi dice compatibility catalog available.

## Import Rules

Use these target locations:

- Game modules live under `src/game`.
- Data modules live under `src/data`.
- Tests live under `src/game/__tests__`.
- UI lives under `src/ui`.

Within migrated game modules, either relative imports or `@/` imports are acceptable if they match surrounding style. Be consistent within a file.

Existing Phaser-era relative imports often still work after relocation:

- From `src/game/store/actions/setupActions.ts`, `../../../data/professions` should resolve to `src/data/professions`.
- From `src/game/DiceSystem.ts`, `../data/hands` should resolve to `src/data/hands`.

Do not blindly convert every import to `@/`. Fix only imports that are wrong or unclear.

## Required Phaser Leakage Check

Search active `src/game` for Phaser references:

```sh
rg "from ['\"]phaser|import .* from ['\"]phaser|Phaser\\." src/game
```

Expected result:

- No matches in active `src/game`.

If there are matches:

- If the file is a host file copied by mistake (`config.ts`, `main.ts`, `EventBus.ts`), remove it from active `src/game`.
- If a domain helper has an accidental type or UI dependency on Phaser, split or replace that dependency with a plain TypeScript type.
- Do not solve this by adding Phaser to the active app.

## Public Barrels To Check

Review and fix these files:

- `src/game/index.ts`
- `src/game/facade/index.ts`
- `src/game/facade/gameFacade.ts`
- `src/game/store/index.ts`
- `src/game/store/actions/index.ts`
- `src/game/store/selectors/index.ts`

Expected migrated facade shape:

```ts
export const gameFacade = {
  round: gameRound,
  run: gameRun,
  consumable: gameConsumable,
  boss: gameBoss,
  diceSelection: gameDiceSelection,
  equipment: gameEquipment,
  dice: gameDice,
  shop: gameShop,
  pack: gamePack,
  trail: gameTrail,
  meta: gameMeta,
};
```

Do not preserve the old placeholder facade shape as the primary export:

```ts
gameFacade.dice.roll()
gameFacade.cards.selectCard()
```

The Pixi UI will be updated in `MIGRATION_5.md` to use the migrated facade/store instead.

## Data Compatibility To Check

`src/data/items.ts` should be the migrated large data file from `src_phaser/data/items.ts`.

The old placeholder exports below should not be expected from `src/data/items.ts` after migration:

- `CARD_COUNT`
- `ITEM_TYPES`
- `ItemType`
- `itemTypeForCard`

Later UI work removes the card row from the minimal scene. If some non-rendered assets still import those old item symbols and cause type/test failures, prefer moving the old demo-only item catalog into a UI-only module instead of polluting migrated `src/data/items.ts`.

`src/data/dice.ts` is the exception: keep its narrow compatibility exports for the Pixi dice renderer until a deeper dice UI refactor replaces them.

## Type Import Rule

Do not use inline type imports:

```ts
// Avoid
type X = import('./module').Thing;
```

Use top-level type imports:

```ts
import type { Thing } from './module';
```

## Implementation Order

1. Search for `src_phaser` references inside `src/game`, `src/data`, and `src/ui`; remove or fix them.
2. Search for Phaser imports inside `src/game`; remove host files or split accidental dependencies.
3. Review the public barrels listed above and make them export the migrated API.
4. Run targeted TypeScript-aware checks by running a small `bun test` subset if practical, for example:

   ```sh
   bun test src/game/__tests__/decimal.test.ts
   bun test src/game/__tests__/scoring.test.ts
   ```

5. Fix import failures found by those targeted test runs.
6. Do not spend time on full UI wiring. That is `MIGRATION_5.md`.

## Expected Result

After this step:

- Migrated game/data/test files import from `src/game` and `src/data`, not `src_phaser`.
- Active `src/game` has no Phaser imports.
- `gameFacade` exposes the migrated facade shape.
- Targeted pure game tests should be able to start running, though not every test must pass until final verification.

## Acceptance Checklist

- `rg "src_phaser" src/game src/data src/ui` has no active migrated-code references unless intentionally documenting source paths in comments.
- `rg "from ['\"]phaser|Phaser\\." src/game` has no matches.
- `src/game/facade/index.ts` exports the migrated facade modules.
- `src/game/store/index.ts` exports the migrated run, round, and scene stores.
- `src/data/items.ts` is not the old 5-item stub.
- `src/data/dice.ts` still exports `DICE_COUNT`, `DICE_TYPES`, `DiceType`, `DICE_ENHANCEMENT_OPTIONS`, and `DICE_LABELS`.

