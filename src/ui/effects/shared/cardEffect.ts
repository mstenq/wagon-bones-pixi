import type { Graphics } from 'pixi.js';

import type { BorderBounds } from '@/ui/effects/shared/borderFrame';
import { hostIsDie } from '@/ui/effects/shared/borderFrame';
import type { EffectHostKind } from '@/ui/effects/types';

/** Soft filled backdrop hugging card/die shape — no stroke outlines. */
export function drawEffectBackdrop(
  g: Graphics,
  bounds: BorderBounds,
  hostKind: EffectHostKind,
  color: number,
  alpha: number,
  inset = 6,
): void {
  g.clear();
  if (hostIsDie(hostKind)) {
    const r = Math.min(bounds.halfW, bounds.halfH) - inset * 0.4;
    g.circle(0, 0, r);
    g.fill({ color, alpha });
    g.circle(0, 0, r * 0.72);
    g.fill({ color, alpha: alpha * 0.55 });
    return;
  }
  const { halfW, halfH, cornerRadius } = bounds;
  g.roundRect(-halfW + inset, -halfH + inset, halfW * 2 - inset * 2, halfH * 2 - inset * 2, cornerRadius);
  g.fill({ color, alpha });
  g.roundRect(
    -halfW + inset * 2,
    -halfH + inset * 2,
    halfW * 2 - inset * 4,
    halfH * 2 - inset * 4,
    Math.max(4, cornerRadius - 2),
  );
  g.fill({ color, alpha: alpha * 0.45 });
}
