import { ColorMatrixFilter, Graphics, NoiseFilter } from "pixi.js";

import { addGlowLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize, drawRoundedRectFrame } from "@/ui/effects/shared/borderFrame";
import { createParticlePool, drawParticles, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const negativeAura: AuraDefinition = {
  id: "negative",
  label: "Negative",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const border = addGlowLayer(layers.front, 0);
    const voidGfx = addGlowLayer(layers.back, 0);
    const particles = createParticlePool(24);
    const negative = new ColorMatrixFilter();
    negative.negative(false);
    const noise = new NoiseFilter({ noise: 0.15, seed: 42 });
    applyArtFilters(art, [negative, noise]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const flicker = burstTimer(t, 0, 0.35, 0.08);
      negative.alpha = 0.85 + flicker * 0.15;
      noise.noise = 0.1 + flicker * 0.25;

      voidGfx.clear();
      drawRoundedRectFrame(voidGfx, bounds, 4, 0x440066, 0.6);

      border.clear();
      drawRoundedRectFrame(border, bounds, 2, 0x220033, 0.8);

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * 12) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(bounds.halfW, bounds.halfH) * (0.8 + Math.random() * 0.3);
        spawnParticle(particles, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 40,
          vy: -Math.sin(angle) * 40,
          maxLife: 0.5 + Math.random() * 0.4,
          size: 2,
          color: 0x6622aa,
          alpha: 0.9,
        });
      }
      drawParticles(border, particles);
    };

    return makeRuntime("negative", step, noopDestroy(() => applyArtFilters(art, null), () => voidGfx.destroy()));
  },
};
