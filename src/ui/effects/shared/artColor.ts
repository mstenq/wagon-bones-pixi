import { ColorMatrixFilter } from 'pixi.js';

/** Warm divine tint on artwork — Pixi ColorMatrixFilter. */
export function createHolyArtMatrix(): ColorMatrixFilter {
  const filter = new ColorMatrixFilter();
  filter.sepia(false);
  filter.brightness(1.06, false);
  filter.saturate(0.12, true);
  filter.colorTone(0.08, 0.18, 0xfff8e0, 0x886622, false);
  return filter;
}

export function stepHolyArtMatrix(filter: ColorMatrixFilter, pulse: number): void {
  filter.brightness(1.04 + pulse * 0.1, false);
}

/** Ember warmth on artwork. */
export function createFireArtMatrix(): ColorMatrixFilter {
  const filter = new ColorMatrixFilter();
  filter.brightness(1.04, false);
  filter.saturate(0.2, true);
  filter.colorTone(0.05, 0.22, 0xffaa44, 0x551100, false);
  return filter;
}

export function stepFireArtMatrix(filter: ColorMatrixFilter, burst: number): void {
  filter.brightness(1.04 + burst * 0.18, false);
  filter.saturate(0.2 + burst * 0.12, false);
}
