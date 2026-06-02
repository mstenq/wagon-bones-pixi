import { BlurFilter, ColorMatrixFilter, Graphics, Sprite } from "pixi.js";

import { getEffectTexture } from "@/assets/effects/textures";
import { addGlowLayer, addSpriteLayer, applyArtFilters, makeRuntime, noopDestroy } from "@/ui/effects/effectHelpers";
import { borderBoundsFromSize, drawRoundedRectFrame } from "@/ui/effects/shared/borderFrame";
import { setGlowFilterAreaForMount } from "@/ui/effects/shared/glow";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

export const stormEffect: EffectDefinition = {
  id: "storm",
  label: "Storm",
  create(layers, mount, art) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const clouds: Sprite[] = [];
    const cloudTex = getEffectTexture("cloudPuff");
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const;
    for (let i = 0; i < 4; i++) {
      const s = addSpriteLayer(layers.back, cloudTex, i);
      if (s) clouds.push(s);
    }
    const bolt = addSpriteLayer(layers.front, getEffectTexture("lightningBolt"), 1);
    const flashGfx = addGlowLayer(layers.front, 0);
    const bright = new ColorMatrixFilter();

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      clouds.forEach((c, i) => {
        const corner = corners[i] ?? [-1, -1];
        const [sx, sy] = corner;
        c.position.set(sx * bounds.halfW * 0.82, sy * bounds.halfH * 0.82);
        c.scale.set(0.45);
        c.alpha = 0.55 + Math.sin(t + i) * 0.1;
        c.rotation = Math.sin(t * 0.3 + i) * 0.1;
      });

      const strike = burstTimer(t, 2, 1.8, 0.06);
      if (bolt) {
        bolt.alpha = strike;
        bolt.rotation = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        bolt.scale.set(0.35, strike * 0.9);
      }
      flashGfx.clear();
      if (strike > 0.3) {
        drawRoundedRectFrame(flashGfx, bounds, 3, 0x88ccff, strike * 0.5);
        applyArtFilters(art, [bright]);
        bright.brightness(1 + strike * 0.6, false);
      } else {
        applyArtFilters(art, null);
      }
    };

    flashGfx.filters = [new BlurFilter({ strength: 6, quality: 3 })];
    setGlowFilterAreaForMount(flashGfx, mount, 6);

    return makeRuntime("storm", step, noopDestroy(() => applyArtFilters(art, null), () => {
      clouds.forEach((c) => c.destroy());
      bolt?.destroy();
      flashGfx.destroy();
    }));
  },
};
