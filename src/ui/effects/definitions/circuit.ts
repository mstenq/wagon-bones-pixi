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
    const seed = Math.random();
    const timeOffset = seed * 71.9;
    const breathSpeed = 0.35 + seed * 0.28;
    const pulseSpeed = 0.02 + seed * 0.08;
    const pulseIntensity = 0.06 + seed * 0.18;
    const ledHue = 0.48 + seed * 0.18;
    const glowAmount = 0.34 + seed * 0.32;

    const step = (frame: EffectFrameContext) => {
      const localTime = (frame.time + frame.phase * 0.13 + timeOffset) % 120;
      circuit.setValue("breathSpeed", breathSpeed); // default 0.25
      circuit.setValue("breathDepth", 0.35); // default 0.35
      circuit.setValue("ledDensity", 0.6); // default 0.6
      circuit.setValue("ledFlickerSpeed", 1.5); // default 1.5
      circuit.setValue("ledBrightness", 1.6); // default 1.6
      circuit.setValue("ledSize", 0.0035); // default 0.0035
      circuit.setValue("pulseSpeed", pulseSpeed); // default 0.4
      circuit.setValue("pulseIntensity", pulseIntensity); // default 0.45
      circuit.setValue("scanlineAmount", 0.08); // default 0.08
      circuit.setValue("glowAmount", glowAmount); // default 0.55
      circuit.setValue("colorTintR", 0.65); // default 0.65
      circuit.setValue("colorTintG", 0.95); // default 0.95
      circuit.setValue("colorTintB", 1.1); // default 1.1
      circuit.setValue("ledHue", ledHue); // default 0.55
      circuit.setValue("vignette", 0.25); // default 0.25
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
