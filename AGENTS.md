use composer-2.5 for subagents, never use composer-2.5-fast for subagents

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

**Read the project skill** `.cursor/skills/isf-effects/SKILL.md` for the full checklist, API (`setValue`, `tick`, padding), tunable `setValue` lines in `step`, ISF→Pixi transforms, limits, and troubleshooting.

Constraints: single-pass **filter** shaders with `inputImage` only; WebGL renderer (`PIXI_RENDERER_PREFERENCE` in `appDefaults.ts`). Do not declare `uInputSize` in the fragment shader.
