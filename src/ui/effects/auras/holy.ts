import { Sprite } from "pixi.js";

import { getEffectTexture } from "@/assets/effects/textures";
import {
  addGlowLayer,
  addSpriteLayer,
  applyArtFilters,
  artBoundsFromMount,
  auraEffectRadius,
  backdropBounds,
  boundsFromCtx,
  makeRuntime,
  noopDestroy,
  pulse01,
  randomInteriorPoint,
} from "@/ui/effects/auraHelpers";
import { hostParticleScale, isDieMount, tightDieBounds } from "@/ui/effects/dieTuning";
import {
  createHolyArtMatrix,
  stepHolyArtMatrix,
} from "@/ui/effects/shared/artColor";
import { drawAuraBackdrop } from "@/ui/effects/shared/cardAura";
import { perimeterPointEllipse } from "@/ui/effects/shared/borderFrame";
import { createParticlePool, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import { applyBlurredGlowForMount } from "@/ui/effects/shared/glow";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

const GOLD = 0xffe9b0;
const GOLD_BRIGHT = 0xfff8e8;

export const holyAura: AuraDefinition = {
  id: "holy",
  label: "Holy",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const artBounds = artBoundsFromMount(mount);
    const backBounds = backdropBounds(mount);
    const hostKind = mount.hostKind;
    const isDie = isDieMount(mount);
    const radius = auraEffectRadius(mount, bounds);
    const pScale = hostParticleScale(mount);
    const tight = tightDieBounds(mount);

    const backdrop = addGlowLayer(layers.back, 0);
    applyBlurredGlowForMount(backdrop, mount, 16);

    const sheen = addGlowLayer(layers.back, 1);
    applyBlurredGlowForMount(sheen, mount, 10);

    const rays = addGlowLayer(layers.back, 2);

    const sparkleTex = getEffectTexture("sparkle");
    const sparkles: Sprite[] = [];
    const sparkleCount = isDie ? 10 : 14;
    for (let i = 0; i < sparkleCount; i++) {
      const s = addSpriteLayer(layers.front, sparkleTex, i, "add");
      if (s) sparkles.push(s);
    }

    const flare = addSpriteLayer(layers.front, sparkleTex, 20, "screen");
    const particles = createParticlePool(isDie ? 14 : 18);

    const artMatrix = createHolyArtMatrix();
    applyArtFilters(art, [artMatrix]);

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const pulse = pulse01(t, 2);
      stepHolyArtMatrix(artMatrix, pulse);

      drawAuraBackdrop(
        backdrop,
        backBounds,
        hostKind,
        GOLD,
        isDie ? 0.1 + pulse * 0.06 : 0.11 + pulse * 0.06,
        isDie ? 6 : 12,
      );
      drawAuraBackdrop(
        sheen,
        backBounds,
        hostKind,
        GOLD_BRIGHT,
        isDie ? 0.06 + pulse * 0.04 : 0.07 + pulse * 0.04,
        isDie ? 4 : 14,
      );

      rays.clear();
      const rayCount = isDie ? 6 : 8;
      const rayLen = isDie ? radius * 0.75 : Math.min(artBounds.halfW, artBounds.halfH) * 0.7;
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + t * 0.12;
        rays.moveTo(0, 0);
        rays.lineTo(Math.cos(a) * rayLen, Math.sin(a) * rayLen);
      }
      rays.stroke({ width: isDie ? 2 : 2.5, color: GOLD_BRIGHT, alpha: 0.04 + pulse * 0.04 });

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * (isDie ? 7 : 7) * pScale) {
        const p = isDie
          ? perimeterPointEllipse(tight, Math.random())
          : randomInteriorPoint(artBounds, 0.1);
        spawnParticle(particles, {
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 10 * pScale,
          vy: (-16 - Math.random() * 20) * pScale,
          maxLife: 0.55 + Math.random() * 0.45,
          size: 2,
          color: GOLD_BRIGHT,
          alpha: 1,
        });
      }

      const baseScale = isDie ? 0.22 : 0.28;
      let slot = 0;
      const maxDist = isDie ? radius * 1.2 : Math.max(artBounds.halfW, artBounds.halfH) * 1.05;
      for (const p of particles) {
        if (p.life <= 0) continue;
        if (Math.hypot(p.x, p.y) > maxDist) continue;
        const s = sparkles[slot % sparkles.length];
        slot += 1;
        if (!s) continue;
        const lifeT = p.life / p.maxLife;
        s.position.set(p.x, p.y);
        s.alpha = lifeT;
        s.scale.set(baseScale + lifeT * baseScale);
        s.rotation = t * 1.5 + slot;
        s.visible = true;
      }
      for (let i = slot; i < sparkles.length; i++) {
        sparkles[i]!.visible = false;
      }

      if (flare) {
        const flash = burstTimer(t, 2, 3.2, 0.12);
        flare.alpha = flash * (isDie ? 0.7 : 0.75);
        flare.scale.set((isDie ? 1.2 : 1.4) + flash * (isDie ? 0.8 : 1));
        flare.rotation = t * 1.2;
        flare.x = Math.sin(t * 0.5) * artBounds.halfW * 0.2;
        flare.y = Math.cos(t * 0.4) * artBounds.halfH * 0.12;
        flare.visible = flash > 0.02;
      }
    };

    return makeRuntime(
      "holy",
      step,
      noopDestroy(
        () => applyArtFilters(art, null),
        () => {
          backdrop.destroy();
          sheen.destroy();
          rays.destroy();
          sparkles.forEach((s) => s.destroy());
          flare?.destroy();
        },
      ),
    );
  },
};
