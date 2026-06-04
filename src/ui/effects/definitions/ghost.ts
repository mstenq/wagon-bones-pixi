import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { createGhostAuraFilter } from "@/ui/effects/filters/ghostAuraFilter";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const ghostEffect: EffectDefinition = {
  id: "ghost",
  label: "Ghost",
  create(_layers, _mount, art) {
    const aura = createGhostAuraFilter();
    applyArtFilters(art, [aura.filter]);

    let elapsed = 0;
    const timeOffset = Math.random() * 137.0;

    const step = (frame: EffectFrameContext) => {
      elapsed = (elapsed + frame.dt) % 240;
      const t = (elapsed + timeOffset) % 240;
      const burst = burstTimer(t, 1.2, 0.9, 0.1);
      const pulse = (Math.sin(t * 1.35) + 1) * 0.5;

      aura.setUniforms({
        invertAmount: 1.0,
        tintAmount: 0.72,
        saturation: 0.35,
        brightness: 1.02 + burst * 0.06,
        pulse,
      });
    };

    return makeRuntime("ghost", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
