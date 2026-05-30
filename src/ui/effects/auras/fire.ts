import { DisplacementFilter, Sprite } from "pixi.js";

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
  randomInteriorPoint,
} from "@/ui/effects/auraHelpers";
import { hostParticleScale, isDieMount, tightDieBounds } from "@/ui/effects/dieTuning";
import {
  createFireArtMatrix,
  stepFireArtMatrix,
} from "@/ui/effects/shared/artColor";
import { drawAuraBackdrop } from "@/ui/effects/shared/cardAura";
import {
  perimeterPoint,
  perimeterPointEllipse,
} from "@/ui/effects/shared/borderFrame";
import { applyBlurredGlowForMount } from "@/ui/effects/shared/glow";
import { createParticlePool, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import type { AuraDefinition, AuraFrameContext } from "@/ui/effects/types";

export const fireAura: AuraDefinition = {
  id: "fire",
  label: "Fire",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const artBounds = artBoundsFromMount(mount);
    const backBounds = backdropBounds(mount);
    const isDie = isDieMount(mount);
    const hostKind = mount.hostKind;
    const edgeBounds = isDie ? tightDieBounds(mount) : artBounds;
    const radius = auraEffectRadius(mount, bounds);
    const pScale = hostParticleScale(mount);

    const backdrop = addGlowLayer(layers.back, 0);
    applyBlurredGlowForMount(backdrop, mount, 12);

    const flames = isDie ? addGlowLayer(layers.front, 0) : null;
    if (flames) {
      applyBlurredGlowForMount(flames, mount, 8);
    }

    const emberTex = getEffectTexture("ember");
    const embers: Sprite[] = [];
    const emberCount = isDie ? 12 : 14;
    for (let i = 0; i < emberCount; i++) {
      const s = addSpriteLayer(layers.front, emberTex, 2 + i, "add");
      if (s) embers.push(s);
    }

    const particles = createParticlePool(isDie ? 16 : 20);
    const artMatrix = createFireArtMatrix();
    const dispTex = getEffectTexture("displacementHeat");
    let dispFilter: DisplacementFilter | null = null;
    let dispSprite: Sprite | null = null;

    if (dispTex && !isDie) {
      dispSprite = new Sprite({ texture: dispTex, anchor: 0.5, eventMode: "none" });
      dispSprite.alpha = 0;
      dispFilter = new DisplacementFilter({ sprite: dispSprite, scale: 6 });
      applyArtFilters(art, [artMatrix, dispFilter]);
    } else {
      applyArtFilters(art, [artMatrix]);
    }

    const step = (frame: AuraFrameContext) => {
      const t = frame.time;
      const burst = burstTimer(t, 1, 0.85, 0.14);
      stepFireArtMatrix(artMatrix, burst);

      drawAuraBackdrop(
        backdrop,
        backBounds,
        hostKind,
        0xff4400,
        isDie ? 0.08 + burst * 0.06 : 0.1 + burst * 0.06,
        isDie ? 6 : 10,
      );

      if (flames) {
        flames.clear();
        const segments = 12;
        const flameH = 6 + burst * 4;
        for (let i = 0; i < segments; i++) {
          const t0 = i / segments;
          const t1 = (i + 0.5) / segments;
          const p0 = perimeterPointEllipse(edgeBounds, t0 + t * 0.04);
          const p1 = perimeterPointEllipse(edgeBounds, t1 + t * 0.04);
          flames.moveTo(p0.x, p0.y);
          flames.lineTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - flameH);
          flames.lineTo(p1.x, p1.y);
        }
        flames.fill({ color: 0xff5500, alpha: 0.38 + burst * 0.2 });
      }

      if (dispSprite && dispFilter) {
        dispSprite.rotation = t * 0.4;
        dispFilter.scale.x = 6 + Math.sin(t * 3) * 2;
        dispFilter.scale.y = dispFilter.scale.x;
      }

      stepParticles(particles, frame.dt);
      if (Math.random() < frame.dt * (isDie ? 8 : 9) * pScale) {
        const p = isDie
          ? perimeterPointEllipse(edgeBounds, Math.random())
          : randomInteriorPoint(artBounds, 0.08);
        spawnParticle(particles, {
          x: p.x,
          y: isDie ? p.y : artBounds.halfH * 0.35 + Math.random() * artBounds.halfH * 0.35,
          vx: (Math.random() - 0.5) * 12 * pScale,
          vy: (-18 - Math.random() * 22) * pScale,
          maxLife: 0.4 + Math.random() * 0.35,
          size: 2,
          color: 0xff6600,
          alpha: 1,
        });
      }

      let slot = 0;
      const emberScale = isDie ? 0.45 : 0.5;
      const clipBounds = isDie ? radius * 1.25 : Math.max(artBounds.halfW, artBounds.halfH) * 1.05;
      for (const p of particles) {
        if (p.life <= 0) continue;
        if (Math.hypot(p.x, p.y) > clipBounds) continue;
        const s = embers[slot % embers.length];
        slot += 1;
        if (!s) continue;
        const lifeT = p.life / p.maxLife;
        s.position.set(p.x, p.y);
        s.alpha = lifeT;
        s.scale.set(emberScale * lifeT);
        s.visible = true;
      }
      for (let i = slot; i < embers.length; i++) {
        embers[i]!.visible = false;
      }
    };

    return makeRuntime(
      "fire",
      step,
      noopDestroy(
        () => applyArtFilters(art, null),
        () => {
          backdrop.destroy();
          flames?.destroy();
          embers.forEach((s) => s.destroy());
          dispSprite?.destroy();
        },
      ),
    );
  },
};
