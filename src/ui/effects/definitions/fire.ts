import { BlurFilter, DisplacementFilter, Sprite, type Graphics, type Texture } from "pixi.js";

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
} from "@/ui/effects/effectHelpers";
import { hostParticleScale, isDieMount, tightDieBounds } from "@/ui/effects/dieTuning";
import {
  createFireArtMatrix,
  stepFireArtMatrix,
} from "@/ui/effects/shared/artColor";
import { drawEffectBackdrop } from "@/ui/effects/shared/cardEffect";
import type { BorderBounds } from "@/ui/effects/shared/borderFrame";
import { createDieEdgeLoop } from "@/ui/effects/shared/dieOutline";
import { applyBlurredGlowForMount, setGlowFilterAreaForMount } from "@/ui/effects/shared/glow";
import { createParticlePool, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import { projectPointToSurface } from "@/ui/effects/shared/surfaceProjection";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

type Point = { x: number; y: number };

const TAU = Math.PI * 2;
const FIRE_TUNE = {
  sampleCount: { die: 42, card: 96 },
  ringInsetScale: { die: 0.98, card: 1.005 },
  flame: {
    lanes: 4,
    baseHeight: { die: 5, card: 5 },
    laneHeightStep: 1.5,
    tipJitter: 3.0,
    widthScale: 1.5,
    tongueStride: 1,
    riseSpeedBase: 1.15,
    riseSpeedStep: 0.34,
    waveFreqBase: 0.6,
    waveFreqStep: 0.18,
    noiseThreshold: 0.36,
    cardCornerRadiusScale: 0.36,
  },
  cursor: {
    radiusScale: 0.13,
    heightBoost: 0.65,
    spawnBoost: 2.9,
  },
  stroke: {
    glowBlur: { strength: 12, quality: 4 },
    auraBlur: { strength: 5, quality: 3 },
  },
} as const;

function fract(n: number): number {
  return n - Math.floor(n);
}

function hash(n: number): number {
  return fract(Math.sin(n * 12.9898) * 43758.5453);
}

function createCardLoop(bounds: BorderBounds, samples: number, insetScale: number): Point[] {
  const points: Point[] = [];
  const halfW = bounds.halfW * insetScale;
  const halfH = bounds.halfH * insetScale;
  const r = Math.min(bounds.cornerRadius * FIRE_TUNE.flame.cardCornerRadiusScale, halfW * 0.22, halfH * 0.22);
  const straightW = Math.max(0, halfW * 2 - r * 2);
  const straightH = Math.max(0, halfH * 2 - r * 2);
  const perimeter = straightW * 2 + straightH * 2 + TAU * r;

  for (let i = 0; i < samples; i++) {
    let d = (i / samples) * perimeter;

    if (d < straightW) {
      points.push({ x: -halfW + r + d, y: -halfH });
      continue;
    }
    d -= straightW;

    if (d < Math.PI * r * 0.5) {
      const a = -Math.PI / 2 + d / r;
      points.push({ x: halfW - r + Math.cos(a) * r, y: -halfH + r + Math.sin(a) * r });
      continue;
    }
    d -= Math.PI * r * 0.5;

    if (d < straightH) {
      points.push({ x: halfW, y: -halfH + r + d });
      continue;
    }
    d -= straightH;

    if (d < Math.PI * r * 0.5) {
      const a = d / r;
      points.push({ x: halfW - r + Math.cos(a) * r, y: halfH - r + Math.sin(a) * r });
      continue;
    }
    d -= Math.PI * r * 0.5;

    if (d < straightW) {
      points.push({ x: halfW - r - d, y: halfH });
      continue;
    }
    d -= straightW;

    if (d < Math.PI * r * 0.5) {
      const a = Math.PI / 2 + d / r;
      points.push({ x: -halfW + r + Math.cos(a) * r, y: halfH - r + Math.sin(a) * r });
      continue;
    }
    d -= Math.PI * r * 0.5;

    if (d < straightH) {
      points.push({ x: -halfW, y: halfH - r - d });
      continue;
    }
    d -= straightH;

    const a = Math.PI + d / r;
    points.push({ x: -halfW + r + Math.cos(a) * r, y: -halfH + r + Math.sin(a) * r });
  }
  return points;
}

function createDieLoop(bounds: BorderBounds, samples: number, insetScale: number): Point[] {
  return createDieEdgeLoop(bounds.halfW, bounds.halfH, samples, insetScale);
}

function createOutwardNormals(points: Point[]): Point[] {
  const normals: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length]!;
    const next = points[(i + 1) % points.length]!;
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.max(0.0001, Math.hypot(tx, ty));
    normals.push({ x: ty / len, y: -tx / len });
  }
  return normals;
}

function nearestRingPointIndex(points: Point[], target: Point): number {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const dx = p.x - target.x;
    const dy = p.y - target.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = i;
    }
  }
  return best;
}

function ringDistance01(index: number, target: number, count: number): number {
  const raw = Math.abs(index - target);
  return Math.min(raw, count - raw) / count;
}

function drawFlameLane(
  gfx: Graphics,
  ringPoints: Point[],
  ringNormals: Point[],
  frame: EffectFrameContext,
  time: number,
  seed: number,
  lane: number,
  baseHeight: number,
  cursorIndex: number,
  cursorActive: boolean,
  color: number,
  alpha: number,
  inset = 0,
  texture: Texture | null = null,
): void {
  const count = ringPoints.length;
  const step = FIRE_TUNE.flame.tongueStride + lane;
  const lanePhase = seed * 17.0 + lane * 2.7;
  for (let i = lane; i < count; i += step) {
    const p0 = ringPoints[i]!;
    const p1 = ringPoints[(i + step) % count]!;
    const n = ringNormals[i]!;
    const cursorNear = cursorActive
      ? 1 - Math.min(1, ringDistance01(i, cursorIndex, count) / FIRE_TUNE.cursor.radiusScale)
      : 0;
    const noise = hash(Math.floor(time * (10.5 + lane * 1.3)) + i * 31.7 + lane * 101.3 + seed * 23);
    const fineNoise = hash(Math.floor(time * 26.0) + i * 9.13 + seed * 53.0);
    const wave = 0.5 + 0.5 * Math.sin(
      time * (FIRE_TUNE.flame.riseSpeedBase + lane * FIRE_TUNE.flame.riseSpeedStep)
      + i * (FIRE_TUNE.flame.waveFreqBase + lane * FIRE_TUNE.flame.waveFreqStep)
      + lanePhase,
    );
    const lit = wave * 0.72 + noise * 0.38 + cursorNear * 0.25 > FIRE_TUNE.flame.noiseThreshold;
    if (!lit) {
      continue;
    }

    const widthT = FIRE_TUNE.flame.widthScale + noise * 0.28;
    const bx0 = p0.x + (p1.x - p0.x) * (1 - widthT) * 0.5 - n.x * inset;
    const by0 = p0.y + (p1.y - p0.y) * (1 - widthT) * 0.5 - n.y * inset;
    const bx1 = p0.x + (p1.x - p0.x) * (0.5 + widthT * 0.5) - n.x * inset;
    const by1 = p0.y + (p1.y - p0.y) * (0.5 + widthT * 0.5) - n.y * inset;
    const midX = (p0.x + p1.x) * 0.5;
    const midY = (p0.y + p1.y) * 0.5;
    const tangentX = -n.y;
    const tangentY = n.x;
    const height = (
      baseHeight
      + lane * FIRE_TUNE.flame.laneHeightStep
      + noise * FIRE_TUNE.flame.tipJitter
    ) * (1 + cursorNear * FIRE_TUNE.cursor.heightBoost);
    const sway = Math.sin(time * (5.2 + lane * 0.55) + i * 0.49 + lanePhase) * (2.2 + lane + fineNoise * 2);
    const waist = Math.max(1.5, height * (0.3 + fineNoise * 0.18));
    const tipX = midX + n.x * height + tangentX * sway;
    const tipY = midY + n.y * height + tangentY * sway;
    const c1x = bx0 + n.x * waist + tangentX * (sway * 0.22 + fineNoise * 2);
    const c1y = by0 + n.y * waist + tangentY * (sway * 0.22 + fineNoise * 2);
    const c2x = bx1 + n.x * waist - tangentX * (sway * 0.18 + noise * 2);
    const c2y = by1 + n.y * waist - tangentY * (sway * 0.18 + noise * 2);
    const base0 = projectPointToSurface({ x: bx0, y: by0 }, frame);
    const tip = projectPointToSurface({ x: tipX, y: tipY }, frame);
    const base1 = projectPointToSurface({ x: bx1, y: by1 }, frame);
    const control1 = projectPointToSurface({ x: c1x, y: c1y }, frame);
    const control2 = projectPointToSurface({ x: c2x, y: c2y }, frame);
    const baseControl = projectPointToSurface({
      x: midX - n.x * inset * 0.4,
      y: midY - n.y * inset * 0.4,
    }, frame);

    gfx.moveTo(base0.x, base0.y);
    gfx.quadraticCurveTo(control1.x, control1.y, tip.x, tip.y);
    gfx.quadraticCurveTo(control2.x, control2.y, base1.x, base1.y);
    gfx.quadraticCurveTo(baseControl.x, baseControl.y, base0.x, base0.y);
    gfx.closePath();
  }
  if (texture) {
    gfx.fill({ color, alpha, texture, textureSpace: "global" });
    return;
  }
  gfx.fill({ color, alpha });
}

function drawEdgeBand(
  gfx: Graphics,
  ringPoints: Point[],
  ringNormals: Point[],
  frame: EffectFrameContext,
  time: number,
  seed: number,
  color: number,
  alpha: number,
  width: number,
  cursorIndex: number,
  cursorActive: boolean,
): void {
  for (let i = 0; i <= ringPoints.length; i++) {
    const idx = i % ringPoints.length;
    const p = ringPoints[idx]!;
    const n = ringNormals[idx]!;
    const cursorNear = cursorActive
      ? 1 - Math.min(1, ringDistance01(idx, cursorIndex, ringPoints.length) / FIRE_TUNE.cursor.radiusScale)
      : 0;
    const shimmer = Math.sin(time * 8.0 + idx * 0.8 + seed * 4.0) * (0.55 + cursorNear * 1.2);
    const projected = projectPointToSurface({
      x: p.x + n.x * shimmer,
      y: p.y + n.y * shimmer,
    }, frame);
    if (i === 0) {
      gfx.moveTo(projected.x, projected.y);
    } else {
      gfx.lineTo(projected.x, projected.y);
    }
  }
  gfx.stroke({ width, color, alpha, cap: "round", join: "round" });
}

export const fireEffect: EffectDefinition = {
  id: "fire",
  label: "Fire",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const artBounds = artBoundsFromMount(mount);
    const backBounds = backdropBounds(mount);
    const isDie = isDieMount(mount);
    const hostKind = mount.hostKind;
    const edgeBounds = isDie ? tightDieBounds(mount) : artBounds;
    const radius = effectRadius(mount, bounds);
    const pScale = hostParticleScale(mount);
    const sampleCount = isDie ? FIRE_TUNE.sampleCount.die : FIRE_TUNE.sampleCount.card;
    const ringPoints = isDie
      ? createDieLoop(edgeBounds, sampleCount, FIRE_TUNE.ringInsetScale.die)
      : createCardLoop(edgeBounds, sampleCount, FIRE_TUNE.ringInsetScale.card);
    const ringNormals = createOutwardNormals(ringPoints);

    const backdrop = addGlowLayer(layers.back, 0);
    applyBlurredGlowForMount(backdrop, mount, 12);

    const flameGlow = addGlowLayer(layers.front, 0);
    flameGlow.filters = [new BlurFilter(FIRE_TUNE.stroke.glowBlur)];
    setGlowFilterAreaForMount(flameGlow, mount, 12);
    const flameAura = addGlowLayer(layers.front, 1);
    flameAura.filters = [new BlurFilter(FIRE_TUNE.stroke.auraBlur)];
    setGlowFilterAreaForMount(flameAura, mount, 8);
    const flameBody = addGlowLayer(layers.front, 2);
    const flameCore = addGlowLayer(layers.front, 3);

    const emberTex = getEffectTexture("ember");
    const flameNoiseTex = getEffectTexture("arcaneNoiseA");
    const embers: Sprite[] = [];
    const emberCount = isDie ? 14 : 24;
    for (let i = 0; i < emberCount; i++) {
      const s = addSpriteLayer(layers.front, emberTex, 4 + i, "add");
      if (s) embers.push(s);
    }

    const particles = createParticlePool(isDie ? 18 : 32);
    const artMatrix = createFireArtMatrix();
    const dispTex = getEffectTexture("displacementHeat");
    let dispFilter: DisplacementFilter | null = null;
    let dispSprite: Sprite | null = null;
    let elapsed = 0;
    let particleBudget = 0;
    let particleIndex = 0;

    if (dispTex && !isDie) {
      dispSprite = new Sprite({ texture: dispTex, anchor: 0.5, eventMode: "none" });
      dispSprite.alpha = 0;
      dispFilter = new DisplacementFilter({ sprite: dispSprite, scale: 6 });
      applyArtFilters(art, [artMatrix, dispFilter]);
    } else {
      applyArtFilters(art, [artMatrix]);
    }

    const step = (frame: EffectFrameContext) => {
      elapsed = (elapsed + frame.dt) % 240;
      const phaseSeed = hash(frame.phase * 17.31 + (isDie ? 3.7 : 0.0));
      const timeOffset = phaseSeed * 137.0;
      const t = (elapsed + timeOffset) % 240;
      const burst = burstTimer(t, 1, 0.85, 0.14);
      stepFireArtMatrix(artMatrix, burst);
      const pointer = {
        x: (frame.pointerNormX - 0.5) * frame.width,
        y: (frame.pointerNormY - 0.5) * frame.height,
      };
      const cursorActive = frame.hovered && !frame.dragging;
      const cursorIndex = nearestRingPointIndex(ringPoints, pointer);
      const baseHeight = (isDie ? FIRE_TUNE.flame.baseHeight.die : FIRE_TUNE.flame.baseHeight.card)
        * (0.92 + burst * 0.28);

      drawEffectBackdrop(
        backdrop,
        backBounds,
        hostKind,
        0xff4400,
        isDie ? 0.08 + burst * 0.06 : 0.1 + burst * 0.06,
        isDie ? 6 : 10,
      );

      flameGlow.clear();
      flameAura.clear();
      flameBody.clear();
      flameCore.clear();
      drawEdgeBand(
        flameGlow,
        ringPoints,
        ringNormals,
        frame,
        t,
        frame.phase,
        0xff2a00,
        0.16 + burst * 0.08,
        isDie ? 7 : 13,
        cursorIndex,
        cursorActive,
      );
      drawEdgeBand(
        flameAura,
        ringPoints,
        ringNormals,
        frame,
        t + 0.2,
        frame.phase + 0.4,
        0xff5a00,
        0.36 + burst * 0.12,
        isDie ? 4 : 7,
        cursorIndex,
        cursorActive,
      );
      drawEdgeBand(
        flameCore,
        ringPoints,
        ringNormals,
        frame,
        t + 0.35,
        frame.phase + 0.8,
        0xffe06a,
        0.42 + burst * 0.16,
        isDie ? 1.3 : 2.2,
        cursorIndex,
        cursorActive,
      );
      for (let lane = FIRE_TUNE.flame.lanes - 1; lane >= 0; lane--) {
        drawFlameLane(
          flameGlow,
          ringPoints,
          ringNormals,
          frame,
          t,
          frame.phase,
          lane,
          baseHeight * 1.35,
          cursorIndex,
          cursorActive,
          0xff3300,
          0.15 + burst * 0.08,
          1.5,
          flameNoiseTex,
        );
        drawFlameLane(
          flameAura,
          ringPoints,
          ringNormals,
          frame,
          t + 0.17,
          frame.phase + 0.33,
          lane,
          baseHeight * 1.05,
          cursorIndex,
          cursorActive,
          0xff5a00,
          0.32 + burst * 0.12,
          0,
          flameNoiseTex,
        );
        drawFlameLane(
          flameBody,
          ringPoints,
          ringNormals,
          frame,
          t + 0.31,
          frame.phase + 0.71,
          lane,
          baseHeight * 0.78,
          cursorIndex,
          cursorActive,
          0xff8a18,
          0.46 + burst * 0.16,
          -1,
          flameNoiseTex,
        );
      }
      drawFlameLane(
        flameCore,
        ringPoints,
        ringNormals,
        frame,
        t + 0.53,
        frame.phase + 1.1,
        0,
        baseHeight * 0.42,
        cursorIndex,
        cursorActive,
        0xffe06a,
        0.55 + burst * 0.18,
        -2,
        null,
      );

      if (dispSprite && dispFilter) {
        dispSprite.rotation = t * 0.4;
        const heatBoost = cursorActive ? 1.35 : 1;
        dispFilter.scale.x = (6 + Math.sin(t * 3) * 2 + burst * 3) * heatBoost;
        dispFilter.scale.y = dispFilter.scale.x;
      }

      stepParticles(particles, frame.dt);
      const spawnRate = (isDie ? 9 : 17) * pScale * (cursorActive ? FIRE_TUNE.cursor.spawnBoost : 1);
      particleBudget += frame.dt * spawnRate;
      while (particleBudget >= 1) {
        particleBudget -= 1;
        const particleSeed = hash(frame.phase * 41.0 + particleIndex * 13.37 + phaseSeed * 97.0);
        const particleSeedB = hash(frame.phase * 59.0 + particleIndex * 19.17 + phaseSeed * 31.0);
        const particleSeedC = hash(frame.phase * 71.0 + particleIndex * 23.91 + phaseSeed * 53.0);
        particleIndex += 1;
        const spawnIndex = cursorActive && particleSeed < 0.55
          ? (cursorIndex + Math.floor((particleSeedB - 0.5) * ringPoints.length * 0.18) + ringPoints.length) % ringPoints.length
          : Math.floor(particleSeed * ringPoints.length);
        const p = ringPoints[spawnIndex]!;
        const n = ringNormals[spawnIndex]!;
        const overCard = !isDie && particleSeedC < 0.42;
        const inward = overCard ? 1 : -1;
        const inwardSpeed = overCard ? 10 + particleSeed * 22 : 0;
        const outwardSpeed = overCard ? 0 : 12 + particleSeedB * 12;
        spawnParticle(particles, {
          x: p.x - n.x * (overCard ? 5 + particleSeedB * 10 : -2 - particleSeedC * 4),
          y: p.y - n.y * (overCard ? 5 + particleSeedB * 10 : -2 - particleSeedC * 4),
          vx: (n.x * (outwardSpeed - inward * inwardSpeed) + (particleSeedC - 0.5) * 13) * pScale,
          vy: (n.y * (outwardSpeed - inward * inwardSpeed) - 18 - particleSeed * 24) * pScale,
          maxLife: overCard ? 0.5 + particleSeedB * 0.42 : 0.38 + particleSeedB * 0.32,
          size: overCard ? 2.4 : 2,
          color: overCard && particleSeed < 0.35 ? 0xffd56a : 0xff6600,
          alpha: overCard ? 0.9 : 1,
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
        const projected = projectPointToSurface(p, frame);
        s.position.set(projected.x, projected.y);
        s.alpha = lifeT;
        s.scale.set(emberScale * lifeT * (0.75 + p.size * 0.28));
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
          flameGlow.destroy();
          flameAura.destroy();
          flameBody.destroy();
          flameCore.destroy();
          embers.forEach((s) => s.destroy());
          dispSprite?.destroy();
        },
      ),
    );
  },
};
