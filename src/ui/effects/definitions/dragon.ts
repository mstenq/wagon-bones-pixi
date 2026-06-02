import { BlurFilter, Graphics } from "pixi.js";

import { addGlowLayer, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize } from "@/ui/effects/shared/borderFrame";
import { setGlowFilterAreaForMount } from "@/ui/effects/shared/glow";
import { createParticlePool, drawParticles, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { orbitPosition } from "@/ui/effects/shared/orbit";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const dragonEffect: EffectDefinition = {
  id: "dragon",
  label: "Dragon",
  create(layers, mount) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const body = addGlowLayer(layers.front, 0);
    body.filters = [new BlurFilter({ strength: 2, quality: 3 })];
    setGlowFilterAreaForMount(body, mount, 8);
    const eyes = addGlowLayer(layers.front, 1);
    const trail = addGlowLayer(layers.front, 2);
    const particles = createParticlePool(16);

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const orbit = orbitPosition(t * 0.4, bounds.halfW * 1.1, bounds.halfH * 0.9, 0.35, 0);

      body.clear();
      body.position.set(orbit.x, orbit.y);
      body.rotation = t * 0.3;
      body.poly([
        -30, 0,
        -10, -25,
        20, -15,
        35, 0,
        20, 15,
        -10, 25,
      ]);
      body.fill({ color: 0xcc4400, alpha: 0.35 });
      body.stroke({ width: 2, color: 0xffaa00, alpha: 0.5 });

      const eyeFlash = burstTimer(t, 4, 2.2, 0.1);
      eyes.clear();
      eyes.circle(orbit.x + 12, orbit.y - 8, 3);
      eyes.circle(orbit.x + 18, orbit.y - 5, 2);
      eyes.fill({ color: 0xff2200, alpha: 0.6 + eyeFlash * 0.4 });

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * 8) {
        spawnParticle(particles, {
          x: orbit.x,
          y: orbit.y,
          vx: -15 + Math.random() * 10,
          vy: (Math.random() - 0.5) * 20,
          maxLife: 0.5,
          size: 3,
          color: 0xff8800,
          alpha: 0.8,
        });
      }
      drawParticles(trail, particles);
    };

    return makeRuntime("dragon", step, noopDestroy(() => {
      body.destroy();
      eyes.destroy();
      trail.destroy();
    }));
  },
};
