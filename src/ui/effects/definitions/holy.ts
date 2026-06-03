import { BlurFilter, Sprite, type Graphics } from "pixi.js";

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
  randomInteriorPoint,
} from "@/ui/effects/effectHelpers";
import { hostParticleScale, isDieMount, tightDieBounds } from "@/ui/effects/dieTuning";
import {
  createHolyArtMatrix,
  stepHolyArtMatrix,
} from "@/ui/effects/shared/artColor";
import { drawEffectBackdrop } from "@/ui/effects/shared/cardEffect";
import { borderBoundsFromSize, perimeterPointEllipse, type BorderBounds } from "@/ui/effects/shared/borderFrame";
import { createDieEdgeLoop } from "@/ui/effects/shared/dieOutline";
import { createParticlePool, spawnParticle, stepParticles } from "@/ui/effects/shared/particles";
import { burstTimer } from "@/ui/effects/shared/pseudoRandom";
import { applyBlurredGlowForMount, setGlowFilterAreaForMount } from "@/ui/effects/shared/glow";
import { projectPointToSurface } from "@/ui/effects/shared/surfaceProjection";
import type { EffectDefinition, EffectFrameContext } from "@/ui/effects/types";

type Point = { x: number; y: number };

const TAU = Math.PI * 2;
const GOLD = 0xffe9b0;
const GOLD_BRIGHT = 0xfff8e8;

const HOLY_TUNE = {
  sampleCount: { die: 72, card: 100 },
  ringInsetScale: { die: 1.02, card: 1.01 },
  edgeLight: {
    lanes: 12,
    speedBase: 0.32,
    speedStep: 0.2,
    waveFreqBase: 8.5,
    waveFreqStep: 1.7,
    thresholdBase: 0.5,
    thresholdStep: 0.08,
  },
  halo: {
    yOffset: { die: 0, card: 25 },
    rxScale: { die: 0.46, card: 0.546 },
    ryScale: { die: 0.11, card: 0.0715 },
    glowBlur: { die: 5, card: 7 },
    orbitSpeed: 0.34,
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
  const exponent = 5.5;
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    points.push({
      x: halfW * Math.sign(c) * Math.pow(Math.abs(c), 2 / exponent),
      y: halfH * Math.sign(s) * Math.pow(Math.abs(s), 2 / exponent),
    });
  }
  return points;
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

function drawEdgeLightLane(
  gfx: Graphics,
  ringPoints: Point[],
  ringNormals: Point[],
  frame: EffectFrameContext,
  time: number,
  lane: number,
  alpha: number,
  width: number,
): void {
  let started = false;
  for (let i = 0; i <= ringPoints.length; i++) {
    const idx = i % ringPoints.length;
    const p = ringPoints[idx]!;
    const n = ringNormals[idx]!;
    const wave = 0.5 + 0.5 * Math.sin(
      time * (HOLY_TUNE.edgeLight.speedBase + lane * HOLY_TUNE.edgeLight.speedStep) * TAU
      + idx * (HOLY_TUNE.edgeLight.waveFreqBase + lane * HOLY_TUNE.edgeLight.waveFreqStep) / ringPoints.length
      + lane * 1.7,
    );
    const flicker = hash(Math.floor(time * (8 + lane * 2)) + idx * 19.31 + lane * 71.7);
    const lit = wave * 0.7 + flicker * 0.3 > HOLY_TUNE.edgeLight.thresholdBase + lane * HOLY_TUNE.edgeLight.thresholdStep;
    if (!lit) {
      started = false;
      continue;
    }

    const shimmer = Math.sin(time * 2.7 + idx * 0.42 + lane * 1.9) * (1.2 + lane * 0.5);
    const projected = projectPointToSurface({
      x: p.x + n.x * (lane * 1.8 + shimmer),
      y: p.y + n.y * (lane * 1.8 + shimmer),
    }, frame);
    if (!started) {
      gfx.moveTo(projected.x, projected.y);
      started = true;
    } else {
      gfx.lineTo(projected.x, projected.y);
    }
  }
  gfx.stroke({ width, color: lane === 0 ? GOLD_BRIGHT : GOLD, alpha, cap: "round", join: "round" });
}

function drawHaloArc(
  gfx: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  width: number,
  color: number,
  alpha: number,
): void {
  const samples = 28;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = startAngle + (endAngle - startAngle) * t;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0) {
      gfx.moveTo(x, y);
    } else {
      gfx.lineTo(x, y);
    }
  }
  gfx.stroke({ width, color, alpha, cap: "round", join: "round" });
}

function drawHalo(
  gfx: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  width: number,
  color: number,
  alpha: number,
): void {
  drawHaloArc(gfx, cx, cy, rx, ry, 0, TAU, width, color, alpha);
}

function haloPoint(cx: number, cy: number, rx: number, ry: number, angle: number): Point {
  return {
    x: cx + Math.cos(angle) * rx,
    y: cy + Math.sin(angle) * ry,
  };
}

export const holyEffect: EffectDefinition = {
  id: "holy",
  label: "Holy",
  create(layers, mount, art) {
    const bounds = boundsFromCtx(mount);
    const artBounds = artBoundsFromMount(mount);
    const backBounds = backdropBounds(mount);
    const hostKind = mount.hostKind;
    const isDie = isDieMount(mount);
    const radius = effectRadius(mount, bounds);
    const pScale = hostParticleScale(mount);
    const tight = tightDieBounds(mount);
    const ringBounds = isDie ? tight : borderBoundsFromSize(mount.width, mount.height);
    const sampleCount = isDie ? HOLY_TUNE.sampleCount.die : HOLY_TUNE.sampleCount.card;
    const ringPoints = isDie
      ? createDieEdgeLoop(ringBounds.halfW, ringBounds.halfH, sampleCount, HOLY_TUNE.ringInsetScale.die)
      : createCardLoop(ringBounds, sampleCount, HOLY_TUNE.ringInsetScale.card);
    const ringNormals = createOutwardNormals(ringPoints);
    const haloCx = 0;
    const haloCy = isDie
      ? -radius - HOLY_TUNE.halo.yOffset.die
      : -artBounds.halfH - HOLY_TUNE.halo.yOffset.card;
    const haloRx = (isDie ? radius : artBounds.halfW) * (isDie ? HOLY_TUNE.halo.rxScale.die : HOLY_TUNE.halo.rxScale.card);
    const haloRy = (isDie ? radius : artBounds.halfH) * (isDie ? HOLY_TUNE.halo.ryScale.die : HOLY_TUNE.halo.ryScale.card);

    const backdrop = addGlowLayer(layers.back, 0);
    applyBlurredGlowForMount(backdrop, mount, 16);

    const sheen = addGlowLayer(layers.back, 1);
    applyBlurredGlowForMount(sheen, mount, 10);

    const haloGlow = addGlowLayer(layers.front, 0);
    haloGlow.filters = [new BlurFilter({ strength: isDie ? HOLY_TUNE.halo.glowBlur.die : HOLY_TUNE.halo.glowBlur.card, quality: 4 })];
    setGlowFilterAreaForMount(haloGlow, mount, isDie ? 28 : 36);
    const haloCore = addGlowLayer(layers.front, 1);
    const haloLight = addGlowLayer(layers.front, 2);
    haloLight.filters = [new BlurFilter({ strength: isDie ? 2.5 : 3.5, quality: 4 })];
    setGlowFilterAreaForMount(haloLight, mount, isDie ? 28 : 36);
    const edgeGlow = addGlowLayer(layers.front, 3);
    edgeGlow.filters = [new BlurFilter({ strength: isDie ? 3 : 5, quality: 3 })];
    setGlowFilterAreaForMount(edgeGlow, mount, 12);
    const edgeCore = addGlowLayer(layers.front, 4);

    const sparkleTex = getEffectTexture("sparkle");
    const sparkles: Sprite[] = [];
    const sparkleCount = isDie ? 10 : 14;
    for (let i = 0; i < sparkleCount; i++) {
      const s = addSpriteLayer(layers.front, sparkleTex, 10 + i, "add");
      if (s) sparkles.push(s);
    }

    const flare = addSpriteLayer(layers.front, sparkleTex, 30, "screen");
    const particles = createParticlePool(isDie ? 14 : 18);

    const artMatrix = createHolyArtMatrix();
    applyArtFilters(art, [artMatrix]);

    const step = (frame: EffectFrameContext) => {
      const t = frame.time;
      const pulse = pulse01(t, 2);
      stepHolyArtMatrix(artMatrix, pulse);

      drawEffectBackdrop(
        backdrop,
        backBounds,
        hostKind,
        GOLD,
        isDie ? 0.1 + pulse * 0.06 : 0.11 + pulse * 0.06,
        isDie ? 6 : 12,
      );
      drawEffectBackdrop(
        sheen,
        backBounds,
        hostKind,
        GOLD_BRIGHT,
        isDie ? 0.06 + pulse * 0.04 : 0.07 + pulse * 0.04,
        isDie ? 4 : 14,
      );

      haloGlow.clear();
      haloCore.clear();
      haloLight.clear();
      edgeGlow.clear();
      edgeCore.clear();

      const hoverBoost = frame.hovered ? 1.25 : 1;
      const activeBoost = frame.activated ? 1.2 : 1;
      for (let lane = 0; lane < HOLY_TUNE.edgeLight.lanes; lane++) {
        drawEdgeLightLane(
          edgeGlow,
          ringPoints,
          ringNormals,
          frame,
          t + frame.phase * 0.07,
          lane,
          (0.1 + pulse * 0.04) * hoverBoost,
          isDie ? 4 + lane : 7 + lane * 1.5,
        );
        drawEdgeLightLane(
          edgeCore,
          ringPoints,
          ringNormals,
          frame,
          t + frame.phase * 0.07 + 0.33,
          lane,
          (0.22 + pulse * 0.08) * hoverBoost,
          isDie ? 1.2 : 1.8,
        );
      }

      const showHalo = !frame.hideHalo;
      const haloDrift = Math.sin(t * 0.9 + frame.phase) * (isDie ? 1.2 : 2);
      const orbitAngle = t * HOLY_TUNE.halo.orbitSpeed * TAU + frame.phase;
      if (showHalo) {
        const haloAlpha = (0.42 + pulse * 0.12) * hoverBoost * activeBoost;
        drawHalo(haloGlow, haloCx, haloCy + haloDrift, haloRx, haloRy, isDie ? 8 : 10, GOLD, 0.12 * hoverBoost);
        drawHalo(haloGlow, haloCx, haloCy + haloDrift, haloRx * 0.96, haloRy * 0.86, isDie ? 4 : 5, GOLD_BRIGHT, 0.16 * hoverBoost);
        drawHaloArc(haloCore, haloCx, haloCy + haloDrift, haloRx, haloRy, Math.PI, TAU, isDie ? 1.2 : 1.5, GOLD, haloAlpha * 0.42);
        drawHaloArc(haloCore, haloCx, haloCy + haloDrift, haloRx, haloRy, 0, Math.PI, isDie ? 1.6 : 2.1, GOLD_BRIGHT, haloAlpha);

        const light = haloPoint(haloCx, haloCy + haloDrift, haloRx, haloRy, orbitAngle);
        const trail = haloPoint(haloCx, haloCy + haloDrift, haloRx, haloRy, orbitAngle - 0.36);
        haloLight.moveTo(trail.x, trail.y);
        haloLight.lineTo(light.x, light.y);
        haloLight.stroke({ width: isDie ? 4 : 6, color: GOLD_BRIGHT, alpha: 0.36 * hoverBoost, cap: "round" });
        haloLight.circle(light.x, light.y, isDie ? 3.2 : 4.6);
        haloLight.fill({ color: GOLD_BRIGHT, alpha: 0.72 * hoverBoost * activeBoost });
      }

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
        const projected = projectPointToSurface(p, frame);
        s.position.set(projected.x, projected.y);
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
        const flarePoint = haloPoint(haloCx, haloCy + Math.sin(t * 0.9 + frame.phase) * (isDie ? 1.2 : 2), haloRx, haloRy, t * HOLY_TUNE.halo.orbitSpeed * TAU + frame.phase);
        flare.alpha = (0.34 + flash * 0.36) * (frame.hovered ? 1.15 : 1);
        flare.scale.set((isDie ? 0.45 : 0.58) + flash * (isDie ? 0.16 : 0.22));
        flare.rotation = t * 1.2;
        flare.x = flarePoint.x;
        flare.y = flarePoint.y;
        flare.visible = showHalo;
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
          haloGlow.destroy();
          haloCore.destroy();
          haloLight.destroy();
          edgeGlow.destroy();
          edgeCore.destroy();
          sparkles.forEach((s) => s.destroy());
          flare?.destroy();
        },
      ),
    );
  },
};
