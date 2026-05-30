---
name: isf-effects
description: >-
  Add new card/die visual effects from ISF (Interactive Shader Format) shaders
  using createPixiFilterFromIsf. Use when adding ISF filters, wiring glitch/dither
  style effects, or converting shaders from interactiveshaderformat.com / ISF Editor.
---

# ISF filter effects

Card and die visuals use a Pixi **effect** system (`src/ui/effects/`). ISF **filter** shaders (single-pass, with `inputImage`) plug in via `createPixiFilterFromIsf`.

**Examples:** `glitch` (VHS), `retroDither`.

Read this skill before adding or modifying ISF-based effects.

## Architecture (short)

```
ISF source string  →  createPixiFilterFromIsf()  →  Pixi Filter on card/die art
                              ↓
                     EffectDefinition in definitions/
                              ↓
                     registry.ts + EFFECT_IDS in types.ts
                              ↓
                     <Card effect="myEffect" /> / story dropdown
```

- **Pipeline:** `src/ui/effects/isf/` — parser, GLSL transform, Pixi `Filter` builder
- **Shader sources:** `src/ui/effects/shaders/*.isf.ts` (or import `.isf?raw` via Vite)
- **Effect wiring:** `src/ui/effects/definitions/*.ts`
- **Mount/runtime:** `EffectMount.tsx` calls `create()` and `tick()` each frame

Pixi apps use `preference: "webgl"` (`src/ui/pixi/appDefaults.ts`) because ISF filters are WebGL-only today.

## Checklist: add a new ISF effect

### 1. Add the ISF source

Create `src/ui/effects/shaders/myEffect.isf.ts`:

```ts
/** My Effect — credit line */
export const MY_EFFECT_ISF = String.raw`/*{
  "DESCRIPTION": "...",
  "INPUTS": [
    { "NAME": "inputImage", "TYPE": "image" },
    { "NAME": "Intensity", "TYPE": "float", "DEFAULT": 1.0, "MIN": 0, "MAX": 2 }
  ]
}*/

void main() {
  vec2 uv = isf_FragNormCoord;
  vec4 c = IMG_NORM_PIXEL(inputImage, uv);
  gl_FragColor = c;
}
`;
```

Or save a `.fs` file and import:

```ts
import source from "@/ui/effects/shaders/myEffect.fs?raw";
```

**Shader requirements:**

- Must be a **filter** (has `inputImage` input, no `PASSES` with `TARGET`)
- Single-pass only (multi-pass ISF is rejected by `parseIsf`)
- Use standard ISF macros (`IMG_NORM_PIXEL`, `isf_FragNormCoord`, `TIME`, `RENDERSIZE`) — the pipeline rewrites them for Pixi

**Avoid:**

- Declaring `uniform vec4 uInputSize` in the fragment shader (precision clash with filter vertex → link failure)
- Local variable named `vec3 finalColor` (auto-renamed to `isfColor`, but prefer another name like `outRgb`)

### 2. Create the effect definition

Create `src/ui/effects/definitions/myEffect.ts` (`circuit.ts` is the reference):

```ts
import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { MY_EFFECT_ISF } from "@/ui/effects/shaders/myEffect.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const myEffect: EffectDefinition = {
  id: "myEffect",
  label: "My Effect",
  create(_layers, _mount, art) {
    const isf = createPixiFilterFromIsf(MY_EFFECT_ISF, 4); // padding: sample offset margin
    applyArtFilters(art, [isf.filter]);

    const step = (frame: EffectFrameContext) => {
      // One setValue per tunable ISF INPUT (everything except inputImage).
      // Start each line at the ISF DEFAULT; add `// default <value>` so tweaks are easy to reset.
      isf.setValue("Intensity", 1.0); // default 1.0
      isf.tick({
        time: frame.time,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("myEffect", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
```

**Tunable inputs (required for new ISF effects):** In `step`, before `tick()`, add a `setValue` line for **every** non-`image` entry in the shader’s `INPUTS` JSON — `float`, `bool`, `color`, `point2D`, etc. Use the ISF `DEFAULT` as the initial value and a trailing comment `// default <value>` (see `circuit.ts` for a full example). When `INPUTS` change, update these lines to match.

- **`padding`** (2nd arg): increase if the shader samples outside UV bounds (blur, displacement, dither neighbors). Start with `2`–`4`. Preserve source alpha on filters (`gl_FragColor = vec4(color * src.a, src.a)`) and `clamp` sample UVs to avoid black letterboxing — see `circuit.isf.ts`.
- **`setValue(name, value)`**: names must match ISF `INPUTS` exactly. Supports `number`, `boolean`, `[r,g,b,a]`, `[x,y]`. Wrong names log `[isf] No uniform named "..."` in the console.
- **`tick()`**: required each frame for `TIME`, `RENDERSIZE`, `TIMEDELTA`, etc.
- **Per-instance desync:** avoid lockstep clones by offsetting time in `tick` with stable per-instance values (e.g. `frame.phase` + seed).
- Wire the definition in **`registry.ts`** only (a duplicate filename like `circut.ts` will not load).
- Pure ISF effects often ignore `_layers`; particle/glow effects (e.g. `holy`) use `layers.back` / `layers.front` instead.

### 3. Register the effect

**`src/ui/effects/types.ts`** — add id to `EFFECT_IDS`:

```ts
export const EFFECT_IDS = [
  "none",
  // ...
  "myEffect",
] as const;
```

**`src/ui/effects/registry.ts`** — import and append:

```ts
import { myEffect } from "@/ui/effects/definitions/myEffect";

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // ...
  myEffect,
];
```

`EFFECT_OPTIONS` (story dropdown) updates automatically from `EFFECT_DEFINITIONS`.

### 4. Preview

Card story: `src/ui/stories/Card.story.tsx` — pick the new effect in the **Effect** dropdown.

Or inline:

```tsx
<Card texture={tex} effect="myEffect" />
```

## ISF → Pixi transforms (automatic)

| ISF | Pixi filter |
|-----|-------------|
| `inputImage` | `uTexture` (auto) |
| `isf_FragNormCoord` | `vTextureCoord` |
| `IMG_NORM_PIXEL(inputImage, uv)` | `texture(uTexture, uv)` |
| `IMG_PIXEL(inputImage, px)` | `texture(uTexture, px / RENDERSIZE)` |
| `RENDERSIZE` | `uniform vec2 RENDERSIZE` (updated in `tick`) |
| `TIME`, `TIMEDELTA`, `DATE`, `FRAMEINDEX` | built-in uniforms |
| `gl_FragColor` | `finalColor` |
| `bool` inputs | `uniform int` (0/1) |

## Combining ISF with layers

ISF-only (shader on art):

```ts
applyArtFilters(art, [isf.filter]);
```

Hybrid (shader + particles/glow):

```ts
const glow = addGlowLayer(layers.front, 0);
applyArtFilters(art, [isf.filter]);
// step: update isf.tick + draw on glow/back layers
```

See `holy.ts` for a non-ISF reference; `circuit.ts` for ISF + tuning block; `glitch.ts` / `retroDither.ts` for ISF-only.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Card invisible, no error | WebGPU renderer | Ensure `preference: "webgl"` on `Application` |
| `Could not initialize shader` / `uInputSize` precision | `uInputSize` in fragment | Remove; use `RENDERSIZE` uniform instead |
| Effect static (TIME stuck at 0) | Missing `tick()` | Call `isf.tick(...)` every frame in `step` |
| `parseIsf` throws multi-pass | `PASSES` with `TARGET` | Use single-pass filter shader only |
| Clipped edges | Insufficient padding | Increase `createPixiFilterFromIsf(source, padding)` |
| Particle/LED patterns collapse into one lane or corner | Fragment precision + hash using large constants | Use precision-safe hash (keep intermediates low via `fract(p * 0.1xx)` style), avoid large-magnitude random math in fragment shader |
| Long-running sessions show reduced variation or quantized motion | `TIME` grows large and loses precision in fragment math | Feed wrapped local time in definition (`const localTime = (time + offset) % 60..240`) |
| Every card/die animates identically | Shared global time + identical uniforms | Add per-instance seed jitter and time offset in the effect definition |

## Not supported yet

- Multi-pass ISF (`PASSES` with render targets)
- Generator shaders (no `inputImage`)
- Transition shaders (`startImage` / `endImage` / `progress`)
- Extra image inputs beyond `inputImage`
- WebGPU-native ISF (no `gpuProgram` yet)

## Key files

| Path | Role |
|------|------|
| `src/ui/effects/isf/createPixiFilterFromIsf.ts` | Builds Pixi `Filter` + uniform API |
| `src/ui/effects/isf/parseIsf.ts` | Metadata + validation |
| `src/ui/effects/isf/transformIsfBody.ts` | ISF GLSL → Pixi GLSL |
| `src/ui/effects/shaders/` | ISF source strings |
| `src/ui/effects/definitions/` | `EffectDefinition` modules |
| `src/ui/effects/EffectMount.tsx` | Per-frame `step` loop |
