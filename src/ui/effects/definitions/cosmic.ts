import { BlurFilter, Graphics } from "pixi.js";

import { addGlowLayer, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import { setGlowFilterAreaForMount } from "@/ui/effects/shared/glow";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const cosmicEffect: EffectDefinition = {
  id: "cosmic",
  label: "Cosmic",
  create(layers, mount) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const nebula = addGlowLayer(layers.back, 0);
    nebula.filters = [new BlurFilter({ strength: 18, quality: 4 })];
    setGlowFilterAreaForMount(nebula, mount, 18);
    const stars = addGlowLayer(layers.back, 1);
    const shooting = addGlowLayer(layers.front, 0);

    const starSeeds = Array.from({ length: 40 }, (_, i) => ({
      x: (Math.sin(i * 12.7) * 0.5 + 0.5) * 2 - 1,
      y: (Math.cos(i * 8.3) * 0.5 + 0.5) * 2 - 1,
      s: 0.5 + (i % 3) * 0.5,
    }));

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;

      nebula.clear();
      nebula.circle(0, 0, Math.min(bounds.halfW, bounds.halfH) * 0.85);
      nebula.fill({ color: 0x442266, alpha: 0.25 });
      nebula.fill({ color: 0x224488, alpha: 0.15 });
      nebula.rotation = t * 0.05;

      stars.clear();
      stars.rotation = t * 0.08;
      for (const st of starSeeds) {
        stars.circle(st.x * bounds.halfW * 0.9, st.y * bounds.halfH * 0.9, st.s);
        stars.fill({ color: 0xffffff, alpha: 0.4 + Math.sin(t + st.x * 10) * 0.2 });
      }

      shooting.clear();
      if (burstTimer(t, 1, 3.5, 0.04) > 0.5) {
        const y = (Math.random() - 0.5) * bounds.halfH * 2;
        shooting.moveTo(-bounds.halfW, y);
        shooting.lineTo(bounds.halfW, y + 20);
        shooting.stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
      }
    };

    return makeRuntime("cosmic", step, noopDestroy(() => {
      nebula.destroy();
      stars.destroy();
      shooting.destroy();
    }));
  },
};
