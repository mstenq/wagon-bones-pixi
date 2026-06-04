import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import { GHOST_AURA_ISF } from "@/ui/effects/shaders/ghost.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

/** ISF `color` inputs are `[r, g, b, a]` in 0–1 (hex channel ÷ 255). */
const GHOST_TINT_COLOR: [number, number, number, number] = [
  8 / 255,
  199 / 255,
  184 / 255,
  1,
]; // #08c7b8

export const ghostEffect: EffectDefinition = {
  id: "ghost",
  label: "Ghost",
  create(_layers, _mount, art) {
    const aura = createPixiFilterFromIsf(GHOST_AURA_ISF, 2);
    applyArtFilters(art, [aura.filter]);

    let elapsed = 0;
    const timeOffset = Math.random() * 137.0;

    const step = (frame: EffectFrameContext) => {
      elapsed = (elapsed + frame.dt) % 240;
      const t = (elapsed + timeOffset) % 240;
      const burst = burstTimer(t, 1.2, 0.9, 0.1);
      const pulse = (Math.sin(t * 1.35) + 1) * 0.5;

      aura.setValue("invert_amount", 1.0); // default 1.0
      aura.setValue("tint_amount", 0.72); // default 0.72
      aura.setValue("saturation", 0.35); // default 0.35
      aura.setValue("brightness", 1.02 + burst * 0.06); // default 1.02
      aura.setValue("pulse", pulse); // default 0.0
      aura.setValue("tint_color", GHOST_TINT_COLOR); // default #08c7b8
      aura.tick({
        time: t,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("ghost", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
