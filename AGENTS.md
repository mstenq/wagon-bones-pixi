use composer-2.5 for subagents, never use composer-2.5-fast for subagents

## Tailwind colors

Do not use arbitrary hex/rgb in class names (`bg-[#...]`). Add `--color-*` tokens in `src/ui/css/index.css` `@theme` and use named utilities. Dynamic per-instance colors from props may use inline `style`.

## React: avoid `useEffect`

Prefer **not** to use `useEffect`. Handle behavior through:

- **Event handlers** — user actions, callbacks, imperative handles
- **Prop-driven reset** — adjust state during render when a prop changes (compare to a stored previous value, then reset)
- **`use()`** — promises, context, and other suspendable reads
- **Animation / Pixi loops** — `useTick`, refs, and per-frame updates for visual state

If `useEffect` is unavoidable (e.g. subscribing to an external system with no event/callback API), add a **comment directly above it** explaining why other approaches do not work.

## React: Zustand selectors (avoid infinite loops)

`useGameRunStore` / `useGameSceneStore` / `useGameRoundStore` wrap Zustand → React 19 `useSyncExternalStore`. The snapshot from `getSnapshot` must be **referentially stable** when underlying data has not changed.

**Do not** pass a selector that allocates every call:

- `useGameRunStore(selectFooInputs)` when `selectFooInputs` returns `{ balance, ... }` or `.map()` / `.filter()` / `.join()` into a new array
- Inline selectors like `useGameRunStore((s) => ({ a: s.a }))`
- `useGameRunStore((s) => s.items.map(...))`

Each render returns a new object/array → React thinks the store changed → re-render → loop. Console: *"The result of getSnapshot should be cached to avoid an infinite loop"*.

**Do** subscribe to a **stable primitive** (string/number/boolean or stable store slice reference):

```ts
// Revision token — add `selectFooRevision` next to derived selectors in selectors/
const revision = useGameRunStore(selectFooRevision);
const inputs = useMemo(() => selectFooInputs(runStore.getState()), [revision]);
```

Or use `useRunStoreRevision(revisionSelector, readSelector)` from `src/game/store/reactHooks.ts` when you only need a one-off read during render.

**When adding derived view-model selectors:**

1. Add a `select*Revision` string (or number) that encodes every input the derived value depends on.
2. Keep `select*Inputs` / `select*ViewModel` as pure functions for `getState()` / `useMemo` — not as the direct `useGame*Store` argument unless they return a primitive or an existing stable reference from state (e.g. `state.shop`).

**Safe direct subscriptions:** primitives (`state.balance`), stable references already in the store (`state.shop`, `state.equipment`), and memoized revision strings.

## Card/die aura effects

Auras live in `src/ui/effects/`. Shipped ids: `none`, `holy`, `fire`, `arcane`, `ghost` (`EFFECT_IDS` in `types.ts`, wired in `registry.ts`). Reference implementations: `definitions/holy.ts`, `fire.ts`, `arcane.ts`, `ghost.ts` — Pixi `Graphics`, sprites, `ColorMatrixFilter`, custom GLSL in `filters/` (e.g. `ghostAuraFilter.ts`), and built-in filters via `applyArtFilters` on card/die art.

To add an aura: create `definitions/myEffect.ts` (`EffectDefinition`), register in `registry.ts`, add the id to `EFFECT_IDS`. Use shared helpers under `shared/` (`glow`, `particles`, `surfaceProjection`, `dieOutline`, etc.). Preload textures in `src/loaders/effects/images.ts` when needed; hosts must `use(effectsTexturesReady)` before mounting effects.

## Perspective-aware effects

Card artwork uses a `PerspectiveMesh` for hover tilt. Edge/front/back `Graphics` effect layers are flat siblings, so any effect that should hug the card face while tilted must project local card points through `projectPointToSurface` from `src/ui/effects/shared/surfaceProjection.ts` using `EffectFrameContext.surfaceCorners`. Use this for border strokes, edge particles, impact points, and other card-surface-aligned graphics.

Effects that read `getEffectTexture(...)` depend on preloaded effect assets. Card rendering should suspend with `use(effectsTexturesReady)` before effect runtimes are created; otherwise texture races can make the same effect render differently across reloads.

Die edge effects should reuse the tuned d20-ish outline in `src/ui/effects/shared/dieOutline.ts` (`DIE_EDGE_POINTS` / `createDieEdgeLoop`) instead of hand-rolling circles, hexes, or duplicate point lists.

### TypeScript

- **No inline type imports.** Never use `import('./module').Type` or `import('../foo').Bar` in type positions — not on fields, parameters, or return types. Add a top-level `import type { Foo } from './module'` (or a value import when the symbol is an enum) and reference `Foo` directly.