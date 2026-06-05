# MIGRATION 5: Wire Minimal Pixi Dice UI To Migrated Game State

Read `MIGRATION.md` before starting this step. This step assumes `MIGRATION_1.md` through `MIGRATION_4.md` have already been completed.

## Purpose

Update the current Pixi UI so it renders dice from the migrated game stores and rolls through the migrated game facade.

The goal is intentionally small: show dice and click a roll button. Card/item UI can be removed from the active scene for now.

## Current UI Files To Update

Likely files:

- `src/ui/app/App.tsx`
- `src/ui/scenes/GameScene.tsx`
- `src/ui/components/DiceRow/DiceRow.tsx`
- `src/ui/components/Dice/RollDiceButton.tsx`
- `src/ui/components/Dice/config.ts`
- `src/ui/layout/gameLayout.ts`
- `src/assets/dice/textures.ts`

Likely file to stop rendering for now:

- `src/ui/components/CardContainer/CardContainer.tsx`

You do not need to delete `CardContainer`. Remove it from the active `GameScene` render path until item/card data and assets are properly wired.

## Remove Placeholder Assumptions

The old placeholder UI assumed:

- numeric die ids from `0` to `DICE_COUNT - 1`
- global `diceType`
- `dieValues: number[]`
- `diceOrder: number[]`
- `rollTargets: number[]`
- `gameFacade.dice.roll()`
- `gameFacade.dice.completeRoll(results)`

The migrated game model uses:

- string die ids
- per-die `Die.enhancement`
- round `handDiceIds`
- round `dieValuesByDieId`
- round `rolledDice`
- `gameFacade.round.selectDiceForRoll(ids)` or `gameFacade.round.rollLockedDice(ids)`
- `gameFacade.round.rerollUnlockedDice(ids)` for later reroll flows

Update the UI to the migrated model. Do not recreate the old placeholder store.

## Dice Type Mapping

Pixi dice textures expect a `DiceType` like:

- `standard`
- `wooden`
- `stone`
- `steel`
- `gold`
- `bone`
- `diamond`
- `lucky`
- `loaded`

Migrated game dice use `DiceEnhancement`, where standard dice have `enhancement: null`.

Add a small helper near dice UI config, for example in `src/ui/components/Dice/config.ts`:

```ts
import type { DiceEnhancement } from '@/game/types';
import type { DiceType } from '@/data/dice';

export function diceTypeFromEnhancement(enhancement: DiceEnhancement): DiceType {
  if (enhancement === null) {
    return 'standard';
  }
  return enhancement;
}
```

If TypeScript complains because `DiceEnhancement` contains values not available as Pixi textures, handle unsupported values explicitly with a readable `if`/`switch`. Do not use nested ternaries.

## Active Dice Selection

For the first minimal flow, roll all active hand dice.

Use the current round state:

- `round.handDiceIds` for display order/default order
- `round.dieValuesByDieId[id]` for current face value
- `round.rolledDice` after a roll to get rolled face values

Use store selectors from the migrated stores, either via hooks added in `MIGRATION_4.md` or directly with `useStore`.

Handle `round === null` gracefully by rendering nothing or a simple loading/null container. The bootstrap should make the round non-null quickly.

## Dice Ordering

The old UI allowed reordering with numeric ids. The migrated ids are strings.

Preferred minimal approach:

- Keep a local visual order of string die ids inside `DiceRow`, initialized from `round.handDiceIds`.
- When `round.handDiceIds` changes, reset local visual order during render by comparing to a saved previous value. Do not use `useEffect`.
- Reordering is visual-only for now unless a migrated game action exists for changing hand order.

If the reorder hook requires numeric ids, update its types to support `string | number` item ids, or add a simple mapping inside `DiceRow`:

- `slot index -> die id`
- Reorder indices locally
- Render dice by die id

Do not change game rules just to support UI drag ordering.

## Roll Button Behavior

Update `RollDiceButton` to:

1. Read the active round.
2. Disable when there is no round or when a local roll animation is already active.
3. On click, call the migrated facade to roll the active hand dice.

For first pass:

```ts
gameFacade.round.selectDiceForRoll(round.handDiceIds);
```

or:

```ts
gameFacade.round.rollLockedDice(round.handDiceIds);
```

Use whichever migrated API works and matches the round phase.

If the round starts in `SELECT`, `selectDiceForRoll(round.handDiceIds)` should be the natural action. If the bootstrap starts in another phase, inspect `roundActions` and adjust bootstrap or button behavior rather than adding a fake roll path.

## Roll Animation

The old dice row generated random `rollTargets` before the game logic completed. That should change.

Suggested flow:

1. On button click, call migrated roll action.
2. The migrated store updates `round.rolledDice` and `round.dieValuesByDieId`.
3. `DiceRow` detects that rolled values changed.
4. `DiceRow` uses local animation refs/state to spin dice toward those migrated values.
5. The final displayed face is read from migrated round state.

It is acceptable for the first pass to skip elaborate rolling state and simply show updated values after click. If keeping the existing spin animation is easy, keep it local to UI only.

Do not call a fake `completeRoll(results)` action. The migrated game action owns the roll results.

## Remove Card Row From Active Scene

Update `src/ui/scenes/GameScene.tsx` so it only renders the dice row for now.

Remove or comment out the active render of:

```tsx
<CardContainer layout={layout.cards} />
```

Also remove the import if unused.

This avoids compile/runtime coupling to the old placeholder item catalog while migrated `src/data/items.ts` becomes the real game item data.

## App Controls

The old `App.tsx` includes an enhancement select for the global placeholder `diceType`. Remove it from the active UI for now.

Reason:

- Migrated dice have per-die enhancements.
- The bootstrap profession/setup creates the actual dice.
- A global enhancement picker is not part of the real game model.

Keep `GameInfo` placeholder props if they do not block the dice flow. Wiring real sidebar/game info is out of scope.

## Implementation Order

1. Ensure `bootstrapPixiGame()` is called before `GameCanvas` or `GameScene` reads migrated state.
2. Remove the global enhancement selector from `App.tsx`.
3. Remove `CardContainer` from active `GameScene`.
4. Update dice config/type mapping for migrated `DiceEnhancement`.
5. Update `RollDiceButton` to roll through `gameFacade.round`.
6. Update `DiceRow` to render migrated hand dice and values.
7. Keep drag/reorder if straightforward; otherwise disable drag temporarily and document it in a comment.
8. Confirm the UI imports no old placeholder game/store APIs.

## Expected Result

After this step:

- The Pixi scene shows active hand dice from the migrated round.
- Clicking Roll calls migrated game logic.
- Dice values come from migrated game state.
- The card row is not active.
- There is no `uiDiceDemoStore`.

## Acceptance Checklist

- `src/ui/scenes/GameScene.tsx` does not render `CardContainer`.
- `src/ui/app/App.tsx` calls or triggers the Pixi game bootstrap.
- `src/ui/app/App.tsx` no longer renders the global placeholder enhancement picker.
- `RollDiceButton` calls `gameFacade.round.*`, not `gameFacade.dice.roll()`.
- `DiceRow` reads migrated round/run state, not old placeholder `dieValues`, `diceOrder`, or `rollTargets`.
- Dice with `enhancement: null` display with the `standard` texture.
- No UI file imports `useRunStore` from the old placeholder path/signature.

