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

## ISF filter effects

Card/die visuals live in `src/ui/effects/`. To add a **new effect from an ISF shader** (e.g. from [ISF Editor](https://editor.isf.video) or [interactiveshaderformat.com](https://interactiveshaderformat.com)):

1. Put ISF source in `src/ui/effects/shaders/` (`.isf.ts` export or `.fs?raw` import)
2. Wire with `createPixiFilterFromIsf` in `src/ui/effects/definitions/` — see `glitch.ts` / `retroDither.ts`
3. Register: add id to `EFFECT_IDS` in `types.ts`, import in `registry.ts`

**Read the project skill** `.cursor/skills/isf-effects/SKILL.md` for the full checklist, API (`setValue`, `setImage`, `tick`, padding), tunable uniform/image setup lines in `step`, ISF→Pixi transforms, limits, and troubleshooting.

Constraints: single-pass **filter** shaders with `inputImage` (plus optional extra `image` inputs supported via `setImage(...)`); WebGL renderer (`PIXI_RENDERER_PREFERENCE` in `appDefaults.ts`). Do not declare `uInputSize` in the fragment shader.

## Perspective-aware effects

Card artwork uses a `PerspectiveMesh` for hover tilt. Edge/front/back `Graphics` effect layers are flat siblings, so any effect that should hug the card face while tilted must project local card points through `projectPointToSurface` from `src/ui/effects/shared/surfaceProjection.ts` using `EffectFrameContext.surfaceCorners`. Use this for border strokes, edge particles, impact points, and other card-surface-aligned graphics.

Effects that read `getEffectTexture(...)` depend on preloaded effect assets. Card rendering should suspend with `use(effectsTexturesReady)` before effect runtimes are created; otherwise texture races can make the same effect render differently across reloads.

Die edge effects should reuse the tuned d20-ish outline in `src/ui/effects/shared/dieOutline.ts` (`DIE_EDGE_POINTS` / `createDieEdgeLoop`) instead of hand-rolling circles, hexes, or duplicate point lists.

### TypeScript

- **No inline type imports.** Never use `import('./module').Type` or `import('../foo').Bar` in type positions — not on fields, parameters, or return types. Add a top-level `import type { Foo } from './module'` (or a value import when the symbol is an enum) and reference `Foo` directly.