import { Graphics } from "pixi.js";

import type { BorderBounds } from "@/ui/effects/shared/borderFrame";

export function drawScanlines(
  g: Graphics,
  bounds: BorderBounds,
  lineAlpha: number,
  spacing = 4,
): void {
  const { halfW, halfH } = bounds;
  g.clear();
  for (let y = -halfH; y <= halfH; y += spacing) {
    g.moveTo(-halfW, y);
    g.lineTo(halfW, y);
  }
  g.stroke({ width: 1, color: 0x88ccff, alpha: lineAlpha });
}

export function drawScanSweep(
  g: Graphics,
  bounds: BorderBounds,
  sweepY: number,
  band = 6,
): void {
  const { halfW, halfH } = bounds;
  g.rect(-halfW, sweepY - band / 2, halfW * 2, band);
  g.fill({ color: 0xffffff, alpha: 0.15 });
}
