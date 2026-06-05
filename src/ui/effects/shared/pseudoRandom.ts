/** Deterministic-ish burst timer from wall-clock time and seed. */
export function burstTimer(time: number, seed: number, interval: number, window = 0.12): number {
  const phase = (time * (0.7 + seed * 0.11) + seed * 1.7) % interval;
  return phase < window ? 1 - phase / window : 0;
}

export function hashSeed(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
