import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { SQUIGGLE_PEN_ISF } from "@/ui/effects/shaders/squigglePen.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const squigglePenEffect: EffectDefinition = {
  id: "squigglePen",
  label: "Squiggle Pen",
  create(_layers, _mount, art) {
    const squigglePen = createPixiFilterFromIsf(SQUIGGLE_PEN_ISF, 6);
    applyArtFilters(art, [squigglePen.filter]);
    const timeOffset = Math.random() * 120;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.17 + timeOffset) % 240;
      squigglePen.setValue("weight", 0.07); // default 0.07
      squigglePen.setValue("line_thickness", .3); // default 1.0
      squigglePen.setValue("paperColor", [0.96, 0.92, 0.84, 1.0]); // default [0.96, 0.92, 0.84, 1]
      squigglePen.setValue("color", [0.0, 0.0, 0.0, 1.0]); // default [0, 0, 0, 1]
      squigglePen.setValue("opacity", 1.0); // default 1.0
      squigglePen.setValue("scale", [10.0, 10.0]); // default [10, 10]
      squigglePen.setValue("strength", 0.3); // default 0.5
      squigglePen.setValue("fps", 6.0); // default 6.0
      squigglePen.tick({
        time: localTime,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("squigglePen", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
