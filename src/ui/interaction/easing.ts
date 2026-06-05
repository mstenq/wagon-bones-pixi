export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Phaser Power2 ease-out (quadratic). */
export function easeOutQuad(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
}

/** Phaser Quad.easeOut for roll bounce. */
export function easeOutQuadRaw(t: number): number {
  return easeOutQuad(t);
}

/** Approximate Phaser Back.easeOut for pouch fly-in. */
export function easeOutBack(t: number, overshoot = 1.70158): number {
  const x = clamp01(t) - 1;
  return 1 + (overshoot + 1) * x * x * x + overshoot * x * x;
}
