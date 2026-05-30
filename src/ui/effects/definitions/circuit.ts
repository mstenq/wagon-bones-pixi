import { createPixiFilterFromIsf } from "@/ui/effects/isf";
import { applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { CIRCUIT_ISF } from "@/ui/effects/shaders/circuit.isf";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const circuitEffect: EffectDefinition = {
  id: "circuit",
  label: "Circuit",
  create(_layers, _mount, art) {
    const circuit = createPixiFilterFromIsf(CIRCUIT_ISF, 2);
    applyArtFilters(art, [circuit.filter]);
    const instanceSeed = Math.random() * 10000;
    const timeOffset = Math.random() * 120;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.13 + timeOffset) % 240;
      circuit.setValue("line_width", 0.008); // default 0.01
      circuit.setValue("segment_count", 8); // default 8
      circuit.setValue("segment_length", 0.07); // default 0.06
      circuit.setValue("tail_lag", 0.35); // default 0.4
      circuit.setValue("line_colour", [0.15, 0.95, 0.35, 1.0]); // default [0.15, 0.95, 0.35, 1]
      circuit.setValue("head_size_multiplier", 3.0); // default 5.0
      circuit.setValue("head_colour", [0.6, 1.0, 0.7, 1.0]); // default [0.6, 1, 0.7, 1]
      circuit.setValue("line_count", 12); // default 10
      circuit.setValue("line_lifetime", 8.0); // default 5.0
      circuit.setValue("animation_speed", 0.5); // default 0.5
      circuit.setValue("start_direction_degrees", 0.0); // default 0.0
      circuit.setValue("random_start_direction", true); // default true
      circuit.setValue("instance_seed", instanceSeed); // default 0.0
      circuit.tick({
        time: localTime,
        dt: frame.dt,
        width: frame.width,
        height: frame.height,
      });
    };

    return makeRuntime("circuit", step, noopDestroy(() => applyArtFilters(art, null)));
  },
};
