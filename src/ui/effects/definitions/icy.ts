import { Sprite } from "pixi.js";

import { getEffectTexture } from "@/assets/effects/textures";
import {
  addGlowLayer,
  addSpriteLayer,
  applyArtFilters,
  artBoundsFromMount,
  effectRadius,
  backdropBounds,
  boundsFromCtx,
  makeRuntime,
  noopDestroy,
  pulse01,
} from "@/ui/effects/effectHelpers";
import { hostParticleScale, isDieMount, tightDieBounds } from "@/ui/effects/dieTuning";
import {
  createIcyArtMatrix,
  stepIcyArtMatrix,
} from "@/ui/effects/shared/artColor";
import { drawEffectBackdrop } from "@/ui/effects/shared/cardEffect";
import { perimeterPointEllipse } from "@/ui/effects/shared/borderFrame";
import { applyBlurredGlowForMount } from "@/ui/effects/shared/glow";
import { createParticlePool, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

const ICE = 0xb8e8ff;
const ICE_BRIGHT = 0xe8f8ff;

export const icyEffect: EffectDefinition = {
  id: "icy",
  label: "Icy",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const artBounds = artBoundsFromMount(mount);
    const backBounds = backdropBounds(mount);
    const hostKind = mount.hostKind;
    const isDie = isDieMount(mount);
    const radius = effectRadius(mount, bounds);
    const pScale = hostParticleScale(mount);
    const edgeBounds = isDie ? tightDieBounds(mount) : artBounds;

    const backdrop = addGlowLayer(layers.back, 0);
    applyBlurredGlowForMount(backdrop, mount, 14);

    const frostEdge = isDie ? addGlowLayer(layers.front, 0) : null;
    if (frostEdge) {
      applyBlurredGlowForMount(frostEdge, mount, 6);
    }

    const snowTex = getEffectTexture("snowflake");
    const snowflakes: Sprite[] = [];
    const snowCount = isDie ? 10 : 12;
    for (let i = 0; i < snowCount; i++) {
      const s = addSpriteLayer(layers.front, snowTex, 2 + i, "screen");
      if (s) snowflakes.push(s);
    }

    const particles = createParticlePool(isDie ? 14 : 16);
    const artMatrix = createIcyArtMatrix();
    applyArtFilters(art, [artMatrix]);

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const pulse = pulse01(t, 2.4);
      const crawl = (t * 0.05) % 1;
      stepIcyArtMatrix(artMatrix, pulse);

      drawEffectBackdrop(
        backdrop,
        backBounds,
        hostKind,
        ICE,
        isDie ? 0.09 + pulse * 0.05 : 0.1 + pulse * 0.05,
        isDie ? 6 : 12,
      );

      if (frostEdge) {
        frostEdge.clear();
        const frostSamples = 14;
        for (let i = 0; i < frostSamples; i++) {
          const p = perimeterPointEllipse(edgeBounds, crawl + i / frostSamples);
          const twinkle = burstTimer(t, i, 1.6, 0.07);
          const size = 4 + twinkle * 2;
          frostEdge.moveTo(p.x, p.y - size);
          frostEdge.lineTo(p.x + size * 0.55, p.y);
          frostEdge.lineTo(p.x, p.y + size * 0.4);
          frostEdge.lineTo(p.x - size * 0.55, p.y);
          frostEdge.closePath();
          frostEdge.fill({ color: ICE_BRIGHT, alpha: 0.25 + twinkle * 0.35 });
        }
      }

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * (isDie ? 6 : 6) * pScale) {
        const spread = isDie ? radius * 0.7 : artBounds.halfW * 0.85;
        const origin = isDie
          ? { x: (Math.random() - 0.5) * spread * 2, y: -radius * 0.9 }
          : {
              x: (Math.random() - 0.5) * spread * 2,
              y: -artBounds.halfH + Math.random() * artBounds.halfH * 0.15,
            };
        spawnParticle(particles, {
          x: origin.x,
          y: origin.y,
          vx: (Math.random() - 0.5) * 10 * pScale,
          vy: (12 + Math.random() * 16) * pScale,
          maxLife: 0.75 + Math.random() * 0.55,
          size: 1,
          color: ICE_BRIGHT,
          alpha: 1,
        });
      }

      const snowScale = isDie ? 0.24 : 0.3;
      let slot = 0;
      const maxDist = isDie ? radius * 1.25 : Math.max(artBounds.halfW, artBounds.halfH) * 1.05;
      for (const p of particles) {
        if (p.life <= 0) continue;
        if (Math.hypot(p.x, p.y) > maxDist) continue;
        const s = snowflakes[slot % snowflakes.length];
        slot += 1;
        if (!s) continue;
        const lifeT = p.life / p.maxLife;
        s.position.set(p.x, p.y);
        s.alpha = lifeT * 0.95;
        s.scale.set(snowScale + lifeT * snowScale * 0.5);
        s.rotation = t * 0.35 + slot;
        s.visible = true;
      }
      for (let i = slot; i < snowflakes.length; i++) {
        snowflakes[i]!.visible = false;
      }
    };

    return makeRuntime(
      "icy",
      step,
      noopDestroy(
        () => applyArtFilters(art, null),
        () => {
          backdrop.destroy();
          frostEdge?.destroy();
          snowflakes.forEach((s) => s.destroy());
        },
      ),
    );
  },
};
