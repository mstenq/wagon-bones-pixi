import { Graphics } from "pixi.js";

export type WavyPanelMaskOptions = {
  /** Peak deflection of the outer top/bottom edge in px. */
  amplitude?: number;
  /** Horizontal distance between wave peaks in px. */
  wavelength?: number;
};

const DEFAULTS = {
  amplitude: 3.25,
  wavelength: 130,
} as const;

/** Second-harmonic mix — breaks up regular ripples without dominating the edge. */
const HARMONIC2_WEIGHT = 0.28;
const HARMONIC2_FREQ_RATIO = 1.62;
const HARMONIC2_PHASE_OFFSET = 0.65;

const MASK_STEP_PX = 6;

/**
 * Clips a rectangular panel so the outer top and bottom edges follow a subtle wavy path.
 * Two incommensurate sines keep the tear from looking perfectly periodic.
 * Left/right edges stay straight so horizontal border tiles still align.
 */
export function createWavyPanelMask(
  width: number,
  height: number,
  options: WavyPanelMaskOptions = {},
): Graphics {
  const amplitude = options.amplitude ?? DEFAULTS.amplitude;
  const wavelength = options.wavelength ?? DEFAULTS.wavelength;

  const wave = (x: number, phase: number) => {
    const t1 = (x / wavelength) * Math.PI * 2 + phase;
    const t2 =
      (x / (wavelength / HARMONIC2_FREQ_RATIO)) * Math.PI * 2 +
      phase +
      HARMONIC2_PHASE_OFFSET;
    return amplitude * (Math.sin(t1) + HARMONIC2_WEIGHT * Math.sin(t2));
  };

  const topY = (x: number) => wave(x, 0);
  const bottomY = (x: number) => wave(x, Math.PI);

  const points: number[] = [];
  const push = (x: number, y: number) => {
    points.push(x, y);
  };

  push(0, topY(0));
  for (let x = MASK_STEP_PX; x < width; x += MASK_STEP_PX) {
    push(x, topY(x));
  }
  push(width, topY(width));

  push(width, height + bottomY(width));

  for (let x = width - MASK_STEP_PX; x > 0; x -= MASK_STEP_PX) {
    push(x, height + bottomY(x));
  }
  push(0, height + bottomY(0));

  const mask = new Graphics();
  mask.label = "cardboard-wavy-mask";
  mask.eventMode = "none";
  mask.poly(points, true).fill(0xffffff);

  return mask;
}
