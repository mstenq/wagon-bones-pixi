export type DragSwingConfig = {
  /** Radians per pixel of horizontal pointer velocity. */
  factor?: number;
  maxRadians?: number;
  /** Per-frame multiplier while coasting to rest (0–1). */
  decay?: number;
  /** How quickly current swing catches the target (0–1). */
  follow?: number;
  /** Velocity smoothing per move (0–1, higher = snappier). */
  velocitySmoothing?: number;
};

const defaults: Required<DragSwingConfig> = {
  factor: 0.09,
  maxRadians: 0.9,
  decay: 0.86,
  follow: 0.28,
  velocitySmoothing: 0.45,
};

export function swingFromVelocity(vx: number, config: DragSwingConfig = {}): number {
  const { factor, maxRadians } = { ...defaults, ...config };
  const swing = vx * factor;
  return Math.max(-maxRadians, Math.min(maxRadians, swing));
}

export function decaySwing(angle: number, config: DragSwingConfig = {}): number {
  const { decay } = { ...defaults, ...config };
  const next = angle * decay;
  return Math.abs(next) < 0.002 ? 0 : next;
}

export function stepSwing(
  current: number,
  target: number,
  config: DragSwingConfig = {},
): number {
  const { follow } = { ...defaults, ...config };
  return current + (target - current) * follow;
}

export function smoothVelocity(
  current: number,
  sample: number,
  config: DragSwingConfig = {},
): number {
  const { velocitySmoothing } = { ...defaults, ...config };
  return current * (1 - velocitySmoothing) + sample * velocitySmoothing;
}
