import { BlurFilter } from 'pixi.js';

import { addGlowLayer, makeRuntime, noopDestroy, pulse01 } from '@/ui/effects/effectHelpers';
import { borderBoundsFromSize } from '@/ui/effects/shared/borderFrame';
import { createDieEdgeLoop } from '@/ui/effects/shared/dieOutline';
import { setGlowFilterAreaForMount } from '@/ui/effects/shared/glow';
import { projectPointToSurface } from '@/ui/effects/shared/surfaceProjection';
import type { EffectDefinition, EffectFrameContext } from '@/ui/effects/types';

type Point = { x: number; y: number };
type Strike = {
  life: number;
  maxLife: number;
  path: Point[];
  impact: Point;
};

const TAU = Math.PI * 2;
const ARCANE_CORE = 0xe8f8ff;
const ARCANE_OUTER = 0x8fd6ff;
const ARCANE_TUNE = {
  ringInsetScale: 1.02,
  sampleCount: { die: 96, card: 132 },
  laneCount: 3,
  baseAmplitude: 2.1,
  hoverBoost: 1.12,
  activeBoost: 1.2,
  pulse: {
    base: 0.72,
    layer1PeriodBase: 1.15,
    layer1PeriodSeedScale: 0.2,
    layer1Weight: 0.34,
    layer2PeriodBase: 2.9,
    layer2PeriodSeedScale: 0.35,
    layer2Phase: 1.4,
    layer2Weight: 0.1,
  },
  lane: {
    phaseStep: 0.9,
    phaseSeedScale: 4.0,
    speedBase: 6.4,
    speedStep: 1.5,
    freqBase: 0.42,
    freqStep: 0.08,
    thresholdBase: 0.46,
    thresholdStep: 0.08,
    microDriftBase: 0.52,
    microDriftStep: 0.11,
    gateCadenceBase: 9.5,
    gateCadenceStep: 1.5,
  },
  stochastic: {
    phaseKick: 7.5,
    phaseDamping: 2.1,
    gateKick: 3.2,
    gateDamping: 1.8,
    initialGateNudgeMax: 20,
  },
  shape: {
    driftIndexScale: 0.07,
    driftPhaseScale: 1.7,
    driftSeedScale: 4.0,
    driftPhaseNudgeScale: 0.22,
    driftAmplitude: 1.6,
    tangentWiggleScale: 0.53,
    tangentIndexScale: 0.33,
    tangentSeedScale: 3.0,
    tangentDriftScale: 0.6,
    normalOffsetBase: 1.2,
    normalOffsetJitterScale: 2.4,
    tangentOffset: 1.7,
  },
  gate: {
    waveFrequencyBase: 8.1,
    waveFrequencyStep: 0.7,
    waveIndexScale: 0.55,
    wavePhaseNudgeScale: 0.35,
    waveWeight: 0.65,
    noiseWeight: 0.35,
    breakNoiseThreshold: 0.08,
  },
  stroke: {
    auraBlur: { strength: 10, quality: 3 },
    strandsBlur: { strength: 3, quality: 2 },
    aura: { width: 11, alpha: 0.18 },
    strands: { width: 4, alpha: 0.42 },
    core: { width: 1.8, alpha: 0.95 },
  },
  hoverStrike: {
    spawnPerSecond: 1.35,
    maxConcurrent: 3,
    lifeMin: 0.07,
    lifeMax: 0.14,
    segments: 7,
    jitterBase: 2.2,
    jitterSeedScale: 2.8,
    auraBlur: { strength: 6, quality: 2 },
    auraWidth: 6,
    auraAlpha: 0.45,
    coreWidth: 1.8,
    coreAlpha: 0.95,
    impactRadius: 8,
    impactAlpha: 0.28,
  },
} as const;

function fract(n: number): number {
  return n - Math.floor(n);
}

function hash(n: number): number {
  return fract(Math.sin(n * 12.9898) * 43758.5453);
}

function createCardLoop(halfW: number, halfH: number, samples: number): Point[] {
  const points: Point[] = [];
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

function createNormals(points: Point[]): Point[] {
  const normals: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length]!;
    const next = points[(i + 1) % points.length]!;
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.max(0.0001, Math.hypot(tx, ty));
    normals.push({ x: -ty / len, y: tx / len });
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

function directionalRingPointIndex(points: Point[], target: Point): number {
  const dist2 = target.x * target.x + target.y * target.y;
  if (dist2 < 28 * 28) {
    return -1;
  }
  const angle = Math.atan2(target.y, target.x);
  const normalized = (angle + Math.PI) / TAU;
  const idx = Math.round(normalized * points.length) % points.length;
  return (idx + points.length) % points.length;
}

function createStrikePath(start: Point, end: Point, seed: number): Point[] {
  const points: Point[] = [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(0.0001, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const segments = ARCANE_TUNE.hoverStrike.segments;
  const jitter = ARCANE_TUNE.hoverStrike.jitterBase + seed * ARCANE_TUNE.hoverStrike.jitterSeedScale;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const taper = Math.sin(Math.PI * t);
    const lateral = (hash(seed * 191 + i * 71.3) - 0.5) * jitter * taper;
    points.push({
      x: start.x + dx * t + nx * lateral,
      y: start.y + dy * t + ny * lateral,
    });
  }
  return points;
}

export const arcaneEffect: EffectDefinition = {
  id: 'arcane',
  label: 'Arcane',
  create(layers, mount) {
    const bounds = borderBoundsFromSize(mount.width, mount.height);
    const baseHalfW = bounds.halfW * ARCANE_TUNE.ringInsetScale;
    const baseHalfH = bounds.halfH * ARCANE_TUNE.ringInsetScale;
    const sampleCount = mount.hostKind === 'die' ? ARCANE_TUNE.sampleCount.die : ARCANE_TUNE.sampleCount.card;
    const ringPoints =
      mount.hostKind === 'die'
        ? createDieEdgeLoop(baseHalfW, baseHalfH, sampleCount)
        : createCardLoop(baseHalfW, baseHalfH, sampleCount);
    const ringNormals = createNormals(ringPoints);

    const aura = addGlowLayer(layers.front, 0);
    aura.filters = [new BlurFilter(ARCANE_TUNE.stroke.auraBlur)];
    setGlowFilterAreaForMount(aura, mount, 10);
    const strands = addGlowLayer(layers.front, 1);
    strands.filters = [new BlurFilter(ARCANE_TUNE.stroke.strandsBlur)];
    setGlowFilterAreaForMount(strands, mount, 4);
    const core = addGlowLayer(layers.front, 2);
    const strikeAura = addGlowLayer(layers.front, 4);
    strikeAura.filters = [new BlurFilter(ARCANE_TUNE.hoverStrike.auraBlur)];
    setGlowFilterAreaForMount(strikeAura, mount, 8);
    const strikeCore = addGlowLayer(layers.front, 5);

    const seed = Math.random();
    const timeOffset = seed * 91.7;
    const lanePhaseNudge = Array.from({ length: ARCANE_TUNE.laneCount }, () => (Math.random() - 0.5) * TAU);
    const lanePhaseVelocity = Array.from({ length: ARCANE_TUNE.laneCount }, () => 0);
    const laneGateNudge = Array.from(
      { length: ARCANE_TUNE.laneCount },
      () => Math.random() * ARCANE_TUNE.stochastic.initialGateNudgeMax,
    );
    const laneGateVelocity = Array.from({ length: ARCANE_TUNE.laneCount }, () => 0);
    const strikes: Strike[] = [];

    const step = (frame: EffectFrameContext) => {
      const t = frame.time + frame.phase * 0.13 + timeOffset;
      const pulse =
        ARCANE_TUNE.pulse.base +
        pulse01(t, ARCANE_TUNE.pulse.layer1PeriodBase + seed * ARCANE_TUNE.pulse.layer1PeriodSeedScale) *
          ARCANE_TUNE.pulse.layer1Weight +
        pulse01(
          t,
          ARCANE_TUNE.pulse.layer2PeriodBase + seed * ARCANE_TUNE.pulse.layer2PeriodSeedScale,
          ARCANE_TUNE.pulse.layer2Phase,
        ) *
          ARCANE_TUNE.pulse.layer2Weight;
      const hoverBoost = frame.hovered ? ARCANE_TUNE.hoverBoost : 1.0;
      const activeBoost = frame.activated ? ARCANE_TUNE.activeBoost : 1.0;
      const amp = ARCANE_TUNE.baseAmplitude * pulse * hoverBoost * activeBoost;

      aura.clear();
      strands.clear();
      core.clear();
      strikeAura.clear();
      strikeCore.clear();

      const pointer = {
        x: (frame.pointerNormX - 0.5) * frame.width,
        y: (frame.pointerNormY - 0.5) * frame.height,
      };
      const canStrike = frame.hovered && !frame.dragging;
      if (
        canStrike &&
        strikes.length < ARCANE_TUNE.hoverStrike.maxConcurrent &&
        Math.random() < frame.dt * ARCANE_TUNE.hoverStrike.spawnPerSecond
      ) {
        const seedJitter = hash(t * 3.11 + strikes.length * 17.9 + seed * 10);
        const directionalIdx = directionalRingPointIndex(ringPoints, pointer);
        const anchorIndex = directionalIdx >= 0 ? directionalIdx : nearestRingPointIndex(ringPoints, pointer);
        const anchor = ringPoints[anchorIndex]!;
        const normal = ringNormals[anchorIndex]!;
        const start: Point = {
          x: anchor.x + normal.x * (3 + seedJitter * 4),
          y: anchor.y + normal.y * (3 + seedJitter * 4),
        };
        const life =
          ARCANE_TUNE.hoverStrike.lifeMin +
          seedJitter * (ARCANE_TUNE.hoverStrike.lifeMax - ARCANE_TUNE.hoverStrike.lifeMin);
        strikes.push({
          life,
          maxLife: life,
          path: createStrikePath(start, pointer, seedJitter + t * 0.1),
          impact: pointer,
        });
      }

      for (let lane = 0; lane < ARCANE_TUNE.laneCount; lane++) {
        const phaseVelocity =
          (lanePhaseVelocity[lane] ?? 0) + (Math.random() - 0.5) * frame.dt * ARCANE_TUNE.stochastic.phaseKick;
        const dampedPhaseVelocity = phaseVelocity * Math.max(0, 1 - frame.dt * ARCANE_TUNE.stochastic.phaseDamping);
        lanePhaseVelocity[lane] = dampedPhaseVelocity;
        lanePhaseNudge[lane] = (lanePhaseNudge[lane] ?? 0) + dampedPhaseVelocity * frame.dt;
        const phaseNudge = lanePhaseNudge[lane] ?? 0;

        const gateVelocity =
          (laneGateVelocity[lane] ?? 0) + (Math.random() - 0.5) * frame.dt * ARCANE_TUNE.stochastic.gateKick;
        const dampedGateVelocity = gateVelocity * Math.max(0, 1 - frame.dt * ARCANE_TUNE.stochastic.gateDamping);
        laneGateVelocity[lane] = dampedGateVelocity;
        laneGateNudge[lane] = (laneGateNudge[lane] ?? 0) + dampedGateVelocity * frame.dt;
        const gateNudge = laneGateNudge[lane] ?? 0;

        const lanePhase = lane * ARCANE_TUNE.lane.phaseStep + seed * ARCANE_TUNE.lane.phaseSeedScale;
        const laneSpeed = ARCANE_TUNE.lane.speedBase + lane * ARCANE_TUNE.lane.speedStep;
        const laneFreq = ARCANE_TUNE.lane.freqBase + lane * ARCANE_TUNE.lane.freqStep;
        const laneThreshold = ARCANE_TUNE.lane.thresholdBase + lane * ARCANE_TUNE.lane.thresholdStep;
        const microDriftSpeed = ARCANE_TUNE.lane.microDriftBase + lane * ARCANE_TUNE.lane.microDriftStep;
        const gateCadence = ARCANE_TUNE.lane.gateCadenceBase + lane * ARCANE_TUNE.lane.gateCadenceStep;

        let started = false;
        for (let i = 0; i <= ringPoints.length; i++) {
          const idx = i % ringPoints.length;
          const p = ringPoints[idx]!;
          const n = ringNormals[idx]!;
          const jitterSeed = hash(idx * 19.13 + lane * 71.7 + seed * 100);
          const drift =
            Math.sin(
              t * microDriftSpeed +
                idx * ARCANE_TUNE.shape.driftIndexScale +
                lanePhase * ARCANE_TUNE.shape.driftPhaseScale +
                jitterSeed * ARCANE_TUNE.shape.driftSeedScale +
                phaseNudge * ARCANE_TUNE.shape.driftPhaseNudgeScale,
            ) * ARCANE_TUNE.shape.driftAmplitude;
          const wobble = Math.sin(t * laneSpeed + idx * laneFreq + lanePhase + jitterSeed * TAU + drift + phaseNudge);
          const tangentWiggle = Math.cos(
            t * (laneSpeed * ARCANE_TUNE.shape.tangentWiggleScale) +
              idx * ARCANE_TUNE.shape.tangentIndexScale +
              jitterSeed * ARCANE_TUNE.shape.tangentSeedScale +
              drift * ARCANE_TUNE.shape.tangentDriftScale,
          );
          const offsetN =
            wobble *
            (ARCANE_TUNE.shape.normalOffsetBase + jitterSeed * ARCANE_TUNE.shape.normalOffsetJitterScale) *
            amp;
          const offsetT = tangentWiggle * ARCANE_TUNE.shape.tangentOffset;
          const x = p.x + n.x * offsetN + -n.y * offsetT;
          const y = p.y + n.y * offsetN + n.x * offsetT;
          const projected = projectPointToSurface({ x, y }, frame);

          const gateNoise = hash(idx * 13.1 + lane * 97.1 + Math.floor((t + gateNudge) * gateCadence));
          const gateWave =
            0.5 +
            0.5 *
              Math.sin(
                t * (ARCANE_TUNE.gate.waveFrequencyBase + lane * ARCANE_TUNE.gate.waveFrequencyStep) +
                  idx * ARCANE_TUNE.gate.waveIndexScale +
                  lanePhase +
                  drift +
                  phaseNudge * ARCANE_TUNE.gate.wavePhaseNudgeScale,
              );
          const gate = gateWave * ARCANE_TUNE.gate.waveWeight + gateNoise * ARCANE_TUNE.gate.noiseWeight;
          const lit = gate > laneThreshold;

          if (!lit || (i > 0 && i < ringPoints.length && gateNoise < ARCANE_TUNE.gate.breakNoiseThreshold)) {
            started = false;
            continue;
          }

          if (!started) {
            aura.moveTo(projected.x, projected.y);
            strands.moveTo(projected.x, projected.y);
            core.moveTo(projected.x, projected.y);
            started = true;
          } else {
            aura.lineTo(projected.x, projected.y);
            strands.lineTo(projected.x, projected.y);
            core.lineTo(projected.x, projected.y);
          }
        }
      }

      aura.stroke({
        width: ARCANE_TUNE.stroke.aura.width,
        color: ARCANE_OUTER,
        alpha: ARCANE_TUNE.stroke.aura.alpha * hoverBoost,
      });
      strands.stroke({
        width: ARCANE_TUNE.stroke.strands.width,
        color: ARCANE_OUTER,
        alpha: ARCANE_TUNE.stroke.strands.alpha * pulse,
      });
      core.stroke({
        width: ARCANE_TUNE.stroke.core.width,
        color: ARCANE_CORE,
        alpha: ARCANE_TUNE.stroke.core.alpha * pulse,
      });

      for (let i = strikes.length - 1; i >= 0; i--) {
        const strike = strikes[i]!;
        strike.life -= frame.dt;
        if (strike.life <= 0) {
          strikes.splice(i, 1);
          continue;
        }
        const lifeT = strike.life / strike.maxLife;
        const alphaT = Math.min(1, lifeT * 1.8);
        const path = strike.path;
        if (path.length > 1) {
          const start = projectPointToSurface(path[0]!, frame);
          strikeAura.moveTo(start.x, start.y);
          strikeCore.moveTo(start.x, start.y);
          for (let j = 1; j < path.length; j++) {
            const p = projectPointToSurface(path[j]!, frame);
            strikeAura.lineTo(p.x, p.y);
            strikeCore.lineTo(p.x, p.y);
          }
        }
        const impact = projectPointToSurface(strike.impact, frame);
        strikeAura.circle(impact.x, impact.y, ARCANE_TUNE.hoverStrike.impactRadius * alphaT);
        strikeAura.fill({ color: ARCANE_OUTER, alpha: ARCANE_TUNE.hoverStrike.impactAlpha * alphaT });
      }

      strikeAura.stroke({
        width: ARCANE_TUNE.hoverStrike.auraWidth,
        color: ARCANE_OUTER,
        alpha: ARCANE_TUNE.hoverStrike.auraAlpha,
      });
      strikeCore.stroke({
        width: ARCANE_TUNE.hoverStrike.coreWidth,
        color: ARCANE_CORE,
        alpha: ARCANE_TUNE.hoverStrike.coreAlpha,
      });
    };

    return makeRuntime(
      'arcane',
      step,
      noopDestroy(() => {
        aura.destroy();
        strands.destroy();
        core.destroy();
        strikeAura.destroy();
        strikeCore.destroy();
      }),
    );
  },
};
