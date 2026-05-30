import { BlurFilter, Graphics } from "pixi.js";

import { addGlowLayer, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import { createParticlePool, drawParticles, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const voidEffect: EffectDefinition = {
  id: "void",
  label: "Void",
  create(layers, mount) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const core = addGlowLayer(layers.back, 0);
    core.filters = [new BlurFilter({ strength: 6, quality: 4 })];
    const ring = addGlowLayer(layers.back, 1);
    const particles = createParticlePool(30);

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;

      core.clear();
      core.circle(0, 0, Math.min(bounds.halfW, bounds.halfH) * 0.35);
      core.fill({ color: 0x000000, alpha: 0.85 });
      core.circle(0, 0, Math.min(bounds.halfW, bounds.halfH) * 0.5);
      core.fill({ color: 0x440088, alpha: 0.25 });

      ring.clear();
      ring.rotation = t * 0.6;
      ring.circle(0, 0, Math.min(bounds.halfW, bounds.halfH) * 0.55);
      ring.stroke({ width: 3, color: 0x8866cc, alpha: 0.4 });

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * 14) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(bounds.halfW, bounds.halfH) * (0.6 + Math.random() * 0.4);
        spawnParticle(particles, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 60,
          vy: -Math.sin(angle) * 60,
          maxLife: 0.4 + Math.random() * 0.3,
          size: 1.5,
          color: 0xaa88ff,
          alpha: 0.9,
        });
      }
      drawParticles(ring, particles);
    };

    return makeRuntime("void", step, noopDestroy(() => {
      core.destroy();
      ring.destroy();
    }));
  },
};
