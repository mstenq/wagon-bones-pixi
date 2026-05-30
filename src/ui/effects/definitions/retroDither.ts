import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { RETRO_DITHER_ISF } from "@/ui/effects/shaders/retroDither.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

//https://editor.isf.video/shaders/6a10c8518b20ce001a4eee10

const algorithms = {
  "Bayer 2x2": 0,
  "Bayer 4x4": 1,
  "Bayer 8x8": 2,
  "Floyd-Steinberg": 3,
  "Atkinson": 4,
  "Blue Noise": 5,
  "Random Noise": 6,
  "Ordered Dot": 7,
} as const;


export const retroDitherEffect: EffectDefinition = {
  id: "retroDither",
  label: "Retro Dither",
  create(_layers, mount, art) {
    const dither = createPixiFilterFromIsf(RETRO_DITHER_ISF, 2);
    applyArtFilters(art, [dither.filter]);

    const step = (frame: EffectFrameContext) => {
      dither.setValue('Scale', 1);
      dither.setValue('Color1', [0.121, 0.894, 0.909, 1.0]);
      dither.setValue('Color2', [0.647, 0.353, 0.0, 1.0]);
      dither.setValue('Algorithm', algorithms.Atkinson);
      dither.tick({
        time: frame.time,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("retroDither", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
