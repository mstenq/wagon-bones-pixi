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
const GOLD = 0x6ff9f6;
const GOLD_BRIGHT = 0x6ff9f6;
/** Hue cycles per second along halo / edge lights. */
const RAINBOW_SPEED = 0.22;
/** Rainbow saturation for halo / edge strokes: 0 = white, 1 = full RGB. */
const RGB_INTENSITY = 0.5;

function fract01(n: number): number {
  return n - Math.floor(n);
}

/** Full-saturation RGB from hue in [0, 1). */
function rainbowColor(hue: number): number {
  const h = fract01(hue) * 6;
  const i = Math.floor(h);
  const f = h - i;
  const q = 1 - f;
  let r = 0;
  let g = 0;
  let b = 0;
  switch (i % 6) {
    case 0:
      r = 1;
      g = f;
      break;
    case 1:
      r = q;
      g = 1;
      break;
    case 2:
      g = 1;
      b = f;
      break;
    case 3:
      g = q;
      b = 1;
      break;
    case 4:
      r = f;
      b = 1;
      break;
    default:
      r = 1;
      b = q;
      break;
  }
  const mix = (c: number) => c * RGB_INTENSITY + (1 - RGB_INTENSITY);
  return (Math.round(mix(r) * 255) << 16) | (Math.round(mix(g) * 255) << 8) | Math.round(mix(b) * 255);
}

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
    yOffset: { die: -5, card: 25 },
    rxScale: { die: 0.46, card: 0.546 },
    ryScale: { die: 0.11, card: 0.0715 },
    glowBlur: { die: 5, card: 7 },
    orbitSpeed: 0.34,
    idle: {
      driftX: { die: 1.2, card: 5 },
      driftY: { die: 1.2, card: 3 },
      wobbleScale: { die: 0.06, card: 0.02 },
      rotation: { die: 0.08, card: 0.02 },
      speed: 1.05,
    },
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
  huePhase: number,
  lane: number,
  alpha: number,
  width: number,
): void {
  let prev: Point | null = null;
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
      prev = null;
      continue;
    }

    const shimmer = Math.sin(time * 2.7 + idx * 0.42 + lane * 1.9) * (1.2 + lane * 0.5);
    const projected = projectPointToSurface({
      x: p.x + n.x * (lane * 1.8 + shimmer),
      y: p.y + n.y * (lane * 1.8 + shimmer),
    }, frame);
    if (prev) {
      const hue = huePhase + idx / ringPoints.length + lane * 0.07;
      gfx.moveTo(prev.x, prev.y);
      gfx.lineTo(projected.x, projected.y);
      gfx.stroke({ width, color: rainbowColor(hue), alpha, cap: "round", join: "round" });
    }
    prev = projected;
  }
}

function haloEllipsePoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  rotation: number,
): Point {
  const localX = Math.cos(angle) * rx;
  const localY = Math.sin(angle) * ry;
  const cr = Math.cos(rotation);
  const sr = Math.sin(rotation);
  return {
    x: cx + localX * cr - localY * sr,
    y: cy + localX * sr + localY * cr,
  };
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
  huePhase: number,
  alpha: number,
  rotation = 0,
): void {
  const samples = 28;
  for (let i = 0; i < samples; i++) {
    const t0 = i / samples;
    const t1 = (i + 1) / samples;
    const a0 = startAngle + (endAngle - startAngle) * t0;
    const a1 = startAngle + (endAngle - startAngle) * t1;
    const p0 = haloEllipsePoint(cx, cy, rx, ry, a0, rotation);
    const p1 = haloEllipsePoint(cx, cy, rx, ry, a1, rotation);
    const hue = huePhase + ((a0 + a1) * 0.5) / TAU;
    gfx.moveTo(p0.x, p0.y);
    gfx.lineTo(p1.x, p1.y);
    gfx.stroke({ width, color: rainbowColor(hue), alpha, cap: "round", join: "round" });
  }
}

function drawHalo(
  gfx: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  width: number,
  huePhase: number,
  alpha: number,
  rotation = 0,
): void {
  drawHaloArc(gfx, cx, cy, rx, ry, 0, TAU, width, huePhase, alpha, rotation);
}

function haloPoint(cx: number, cy: number, rx: number, ry: number, angle: number, rotation = 0): Point {
  const localX = Math.cos(angle) * rx;
  const localY = Math.sin(angle) * ry;
  const cr = Math.cos(rotation);
  const sr = Math.sin(rotation);
  return {
    x: cx + localX * cr - localY * sr,
    y: cy + localX * sr + localY * cr,
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
      const rainbowPhase = t * RAINBOW_SPEED + frame.phase * 0.04;
      for (let lane = 0; lane < HOLY_TUNE.edgeLight.lanes; lane++) {
        drawEdgeLightLane(
          edgeGlow,
          ringPoints,
          ringNormals,
          frame,
          t + frame.phase * 0.07,
          rainbowPhase,
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
          rainbowPhase + 0.18,
          lane,
          (0.22 + pulse * 0.08) * hoverBoost,
          isDie ? 1.2 : 1.8,
        );
      }

      const showHalo = !frame.hideHalo;
      const haloIdle = HOLY_TUNE.halo.idle;
      const haloIdleT = t * haloIdle.speed + frame.phase;
      const haloDriftX = Math.sin(haloIdleT * 0.84) * (isDie ? haloIdle.driftX.die : haloIdle.driftX.card);
      const haloDriftY = Math.cos(haloIdleT) * (isDie ? haloIdle.driftY.die : haloIdle.driftY.card);
      const haloWobble = 1 + Math.sin(haloIdleT * 1.17 + 0.6) * (isDie ? haloIdle.wobbleScale.die : haloIdle.wobbleScale.card);
      const haloCounterWobble = 1 - Math.sin(haloIdleT * 1.17 + 0.6) * (isDie ? haloIdle.wobbleScale.die : haloIdle.wobbleScale.card) * 0.55;
      const haloRotation = Math.sin(haloIdleT * 0.72) * (isDie ? haloIdle.rotation.die : haloIdle.rotation.card);
      const haloX = haloCx + haloDriftX;
      const haloY = haloCy + haloDriftY;
      const haloAnimatedRx = haloRx * haloWobble;
      const haloAnimatedRy = haloRy * haloCounterWobble;
      const orbitAngle = t * HOLY_TUNE.halo.orbitSpeed * TAU + frame.phase;
      if (showHalo) {
        const haloAlpha = (0.42 + pulse * 0.12) * hoverBoost * activeBoost;
        const haloHue = rainbowPhase + orbitAngle / TAU;
        drawHalo(haloGlow, haloX, haloY, haloAnimatedRx, haloAnimatedRy, isDie ? 8 : 10, haloHue, 0.12 * hoverBoost, haloRotation);
        drawHalo(
          haloGlow,
          haloX,
          haloY,
          haloAnimatedRx * 0.96,
          haloAnimatedRy * 0.86,
          isDie ? 4 : 5,
          haloHue + 0.12,
          0.16 * hoverBoost,
          haloRotation,
        );
        drawHaloArc(
          haloCore,
          haloX,
          haloY,
          haloAnimatedRx,
          haloAnimatedRy,
          Math.PI,
          TAU,
          isDie ? 1.2 : 1.5,
          haloHue + 0.25,
          haloAlpha * 0.42,
          haloRotation,
        );
        drawHaloArc(
          haloCore,
          haloX,
          haloY,
          haloAnimatedRx,
          haloAnimatedRy,
          0,
          Math.PI,
          isDie ? 1.6 : 2.1,
          haloHue,
          haloAlpha,
          haloRotation,
        );

        const light = haloPoint(haloX, haloY, haloAnimatedRx, haloAnimatedRy, orbitAngle, haloRotation);
        const trail = haloPoint(haloX, haloY, haloAnimatedRx, haloAnimatedRy, orbitAngle - 0.36, haloRotation);
        const lightColor = rainbowColor(haloHue + 0.5);
        haloLight.moveTo(trail.x, trail.y);
        haloLight.lineTo(light.x, light.y);
        haloLight.stroke({ width: isDie ? 4 : 6, color: lightColor, alpha: 0.36 * hoverBoost, cap: "round" });
        haloLight.circle(light.x, light.y, isDie ? 3.2 : 4.6);
        haloLight.fill({ color: lightColor, alpha: 0.72 * hoverBoost * activeBoost });
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
        const flarePoint = haloPoint(haloX, haloY, haloAnimatedRx, haloAnimatedRy, orbitAngle, haloRotation);
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
