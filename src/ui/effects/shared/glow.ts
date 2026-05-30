import { BlurFilter, Graphics, Rectangle } from "pixi.js";

import { dieBlurPadding, dieBlurStrength } from "@/ui/effects/dieTuning";
import type { EffectHostKind, EffectMountContext } from "@/ui/effects/types";

export function createGlowGraphics(): Graphics {
  return new Graphics();
}

export function drawSoftGlow(
  g: Graphics,
  halfW: number,
  halfH: number,
  color: number,
  alpha: number,
  inset = 8,
  hostKind: EffectHostKind = "card",
): void {
  g.clear();
  if (hostKind === "die") {
    const r = Math.min(halfW, halfH) * 0.88 - inset * 0.25;
    g.circle(0, 0, r);
    g.fill({ color, alpha });
    g.circle(0, 0, r * 0.72);
    g.fill({ color, alpha: alpha * 0.5 });
    return;
  }
  g.roundRect(-halfW + inset, -halfH + inset, halfW * 2 - inset * 2, halfH * 2 - inset * 2, 10);
  g.fill({ color, alpha });
}

export function drawRadialBloom(
  g: Graphics,
  radius: number,
  color: number,
  alpha: number,
  rings = 3,
): void {
  g.clear();
  for (let i = rings; i >= 1; i--) {
    const t = i / rings;
    g.circle(0, 0, radius * t);
    g.fill({ color, alpha: alpha * (0.35 + 0.25 * t) });
  }
}

export function glowBlurFilter(strength = 12): BlurFilter {
  return new BlurFilter({ strength, quality: 4 });
}

export function filterAreaForBounds(width: number, height: number, padding: number): Rectangle {
  const halfW = width / 2 + padding;
  const halfH = height / 2 + padding;
  return new Rectangle(-halfW, -halfH, halfW * 2, halfH * 2);
}

/** Prevent BlurFilter from clipping to a hard rectangular edge. */
export function applyBlurredGlow(
  g: Graphics,
  hostWidth: number,
  hostHeight: number,
  padding: number,
  strength: number,
): BlurFilter {
  const blur = new BlurFilter({ strength, quality: 5 });
  g.filters = [blur];
  g.filterArea = filterAreaForBounds(hostWidth, hostHeight, padding);
  return blur;
}

export function applyBlurredGlowForMount(
  g: Graphics,
  mount: EffectMountContext,
  strength: number,
): BlurFilter {
  const pad = dieBlurPadding(mount);
  const str = dieBlurStrength(mount, strength);
  return applyBlurredGlow(g, mount.width, mount.height, pad, str);
}
