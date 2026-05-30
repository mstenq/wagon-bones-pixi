import { Graphics } from "pixi.js";

import { addGlowLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/auraHelpers";
import { borderBoundsFromSize, drawRoundedRectFrame, perimeterPoint } from "@/ui/effects/shared/borderFrame";
import { createParticlePool, drawParticles, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { getHueCycleFilter, setHueCycleUniforms } from "@/ui/effects/filters/hueCycleFilter";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

const RAINBOW = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];

export const polychromeAura: AuraDefinition = {
  id: "polychrome",
  label: "Polychrome",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const border = addGlowLayer(layers.front, 0);
    const prisms = addGlowLayer(layers.front, 1);
    const particles = createParticlePool(20);
    const hue = getHueCycleFilter();
    applyArtFilters(art, [hue]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      setHueCycleUniforms(hue, t * 1.2, 0.55);
      const sweep = ((t * 0.3) % 1);

      border.clear();
      for (let i = 0; i < RAINBOW.length; i++) {
        const seg = 1 / RAINBOW.length;
        const p = perimeterPoint(bounds, sweep + i * seg);
        const p2 = perimeterPoint(bounds, sweep + (i + 1) * seg);
        border.moveTo(p.x, p.y);
        border.lineTo(p2.x, p2.y);
        border.stroke({ width: 4, color: RAINBOW[i], alpha: 0.7 });
      }

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * 8) {
        spawnParticle(particles, {
          x: (Math.random() - 0.5) * bounds.halfW * 2,
          y: (Math.random() - 0.5) * bounds.halfH * 2,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          maxLife: 0.6,
          size: 3,
          color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)] ?? 0xffffff,
          alpha: 0.9,
        });
      }
      drawParticles(prisms, particles);
    };

    return makeRuntime("polychrome", step, noopDestroy(() => applyArtFilters(art, null), () => {
      border.destroy();
      prisms.destroy();
    }));
  },
};
