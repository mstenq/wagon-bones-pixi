import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { HOLOGRAM_ISF } from "@/ui/effects/shaders/hologram.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const hologramEffect: EffectDefinition = {
  id: "hologram",
  label: "Hologram",
  create(_layers, _mount, art) {
    const hologram = createPixiFilterFromIsf(HOLOGRAM_ISF, 4);
    applyArtFilters(art, [hologram.filter]);
    const seed = Math.random();
    const timeOffset = seed * 53.2;
    const lineRotation = seed * Math.PI * 2;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.09 + timeOffset) % 120;
      const hovered = frame.hovered && !frame.dragging;

      const tiltScale = hovered ? 0.35 : 0.85;
      const pointerScale = hovered ? 0.85 : 0.5;
      const wobble = hovered ? 0.1 : 0.2;
      const orbit = hovered ? 0.05 : 0.14;

      const lx =
        (frame.pointerNormX - 0.5) * pointerScale +
        frame.tiltX * tiltScale +
        Math.sin(localTime * 0.4) * wobble +
        Math.sin(localTime * 0.17 + frame.phase) * orbit;
      const ly =
        (frame.pointerNormY - 0.5) * pointerScale +
        frame.tiltY * tiltScale +
        Math.cos(localTime * 0.35) * wobble +
        Math.cos(localTime * 0.19 + frame.phase * 1.1) * orbit;

      const viewBiasX = hovered ? 0.12 : 0.24;
      const viewBiasY = hovered ? -0.08 : -0.18;

      hologram.setValue("lightOffset", [lx, ly]); // default [0, 0]
      hologram.setValue("viewOffset", [-lx * 0.55 + viewBiasX, -ly * 0.55 + viewBiasY]); // default [0, 0]
      hologram.setValue("normalDepth", hovered ? 0.28 : 0.32); // default 0.25
      hologram.setValue("colorCompression", 6.0); // default 6.0
      // intensity: overall shimmer strength | ambient: idle TIME/UV sweep (raise for more idle)
      hologram.setValue("intensity", hovered ? 1.00 : 0.9); // default 1.0
      hologram.setValue("emission", 0.12); // default 0.125
      hologram.setValue("ambient", hovered ? 0.7 : 0.6); // default 0.4
      hologram.setValue("lineRotation", lineRotation); // default 0.0, per-card random
      hologram.tick({
        time: localTime,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("hologram", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
