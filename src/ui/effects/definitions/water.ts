import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { WATER_ISF } from "@/ui/effects/shaders/water.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const waterEffect: EffectDefinition = {
  id: "water",
  label: "Water",
  create(_layers, _mount, art) {
    const water = createPixiFilterFromIsf(WATER_ISF, 3);
    applyArtFilters(art, [water.filter]);
    const seed = Math.random();
    const timeOffset = seed * 97.3;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.17 + timeOffset) % 120;
      water.setValue("bubbleAmount", 0.45); // default 0.45
      water.setValue("bubbleSize", 0.008); // default 0.022
      water.setValue("smallBubbleMix", 0.32); // default 0.78
      water.setValue("riseSpeed", 0.08); // default 0.08
      water.setValue("driftAmount", 0.02); // default 0.02
      water.setValue("turbulence", 0.2); // default 0.2
      water.setValue("ringThickness", 0.15); // default 0.15
      water.setValue("bubbleSoftness", 0.016); // default 0.012
      water.setValue("bubbleBrightness", 1.35); // default 1.25
      water.setValue("bubbleOpacity", 0.92); // default 0.8
      water.setValue("depthFade", 0.45); // default 0.45
      water.setValue("waterRipple", 0.006); // default 0.006
      water.setValue("waterTintAmount", 0.18); // default 0.18
      water.setValue("contrast", 1.05); // default 1.05
      water.setValue("darkness", 0.08); // default 0.08
      water.setValue("waterTint", [0.48, 0.92, 0.72, 1]); // default [0.48, 0.62, 0.72, 1.0]
      water.setValue("bubbleColor", [0.86, 0.95, 1, 1]); // default [0.86, 0.95, 1.0, 1.0]
      water.tick({
        time: localTime,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("water", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
