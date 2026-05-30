import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { VHS_GLITCH_ISF } from "@/ui/effects/shaders/vhsGlitch.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const glitchEffect: EffectDefinition = {
  id: "glitch",
  label: "Glitch",
  create(_layers, _mount, art) {
    const vhs = createPixiFilterFromIsf(VHS_GLITCH_ISF);
    const seed = Math.random();
    const timeOffset = seed * 53.7;
    const grainLevel = 0.55 + seed * 0.7;
    const analogDistort = 0.85 + seed * 1.1;
    const yScanlineAmount = -0.04 + seed * 0.08;
    const bleedAmount = 0.55 + seed * 0.95;
    const bleedDistort = 0.2 + seed * 0.45;
    const bleedRange = 0.8 + seed * 0.45;

    vhs.setValue("grainLevel", grainLevel);
    vhs.setValue("analogDistort", analogDistort);
    vhs.setValue("yScanlineAmount", yScanlineAmount);
    vhs.setValue("bleedAmount", bleedAmount);
    vhs.setValue("bleedDistort", bleedDistort);
    vhs.setValue("bleedRange", bleedRange);
    applyArtFilters(art, [vhs.filter]);

    const step = (frame: EffectFrameContext) => {
      vhs.tick({
        time: frame.time + frame.phase * 0.11 + timeOffset,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("glitch", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
