/** Normalized flame strength from game logic (0 = off, 1 = max). */
export function clampFlameIntensity(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.min(1, Math.max(0, raw));
}
