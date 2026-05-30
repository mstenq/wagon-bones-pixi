import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { POLYCHROME_ISF } from "@/ui/effects/shaders/polychrome.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const polychromeEffect: EffectDefinition = {
  id: "polychrome",
  label: "Polychrome",
  create(_layers, _mount, art) {
    const polychrome = createPixiFilterFromIsf(POLYCHROME_ISF, 0);
    applyArtFilters(art, [polychrome.filter]);

    const step = (frame: EffectFrameContext) => {
      const hovered = frame.hovered && !frame.dragging;
      const phaseScale = hovered ? 0.1 : 0.3;
      const ox =
        frame.tiltX * phaseScale +
        (hovered ? (frame.pointerNormX - 0.5) * 0.45 : 0);
      const oy =
        frame.tiltY * phaseScale +
        (hovered ? (frame.pointerNormY - 0.5) * 0.45 : 0);

      polychrome.setValue("saturation", 0.2); // default 0.6
      polychrome.setValue("offset", [ox, oy]); // default [0, 0]
      polychrome.setValue("spatialScale", 0.7); // default 0.25
      polychrome.tick({
        time: frame.time,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("polychrome", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
