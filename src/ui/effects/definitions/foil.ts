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

    const step = (frame: EffectFrameContext) => {
      const hovered = frame.hovered && !frame.dragging;
      const phaseScale = 0.14;
      const ox =
        frame.tiltX * phaseScale +
        (hovered ? (frame.pointerNormX - 0.5) * 0.45 : 0);
      const oy =
        frame.tiltY * phaseScale +
        (hovered ? (frame.pointerNormY - 0.5) * 0.45 : 0);

      foil.setValue("offset", [ox, oy]); // default [0, 0]
      foil.setValue("center", [0.3, 0.4]); // default [0.5, 0.5]
      foil.setValue("intensity", 0.2); // default 0.7
      foil.tick({
        time: frame.time,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("foil", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
