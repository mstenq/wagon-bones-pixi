import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { FOIL_ISF } from "@/ui/effects/shaders/foil.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const foilEffect: EffectDefinition = {
  id: "foil",
  label: "Foil",
  create(_layers, _mount, art) {
    const foil = createPixiFilterFromIsf(FOIL_ISF, 2);
    applyArtFilters(art, [foil.filter]);
    const seed = Math.random();
    const timeOffset = seed * 41.7;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.11 + timeOffset) % 120;
      const ox = (frame.pointerNormX - 0.5) * 0.35 + frame.tiltX * 0.12;
      const oy = (frame.pointerNormY - 0.5) * 0.35 + frame.tiltY * 0.12;
      foil.setValue("offset", [ox, oy]); // default [0, 0]
      foil.setValue("center", [0.3, 0.4]); // default [0.5, 0.5]
      foil.setValue("speed", 1.0); // default 1.0
      foil.setValue("intensity", 0.2); // default 0.7
      foil.tick({
        time: localTime,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("foil", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
