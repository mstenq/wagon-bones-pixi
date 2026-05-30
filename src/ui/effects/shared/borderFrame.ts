import type { Graphics } from "pixi.js";

import type { AuraHostKind, AuraMountContext } from "@/ui/effects/types";

export type BorderBounds = {
  halfW: number;
  halfH: number;
  cornerRadius: number;
};

export function borderBoundsFromSize(width: number, height: number): BorderBounds {
  const halfW = width / 2;
  const halfH = height / 2;
  const cornerRadius = Math.min(14, Math.min(halfW, halfH) * 0.12);
  return { halfW, halfH, cornerRadius };
}

/** Padded bounds so glow/blur is not clipped to the host art rectangle. */
export function auraVisualBounds(mount: AuraMountContext): BorderBounds {
  const pad = mount.padding;
  return borderBoundsFromSize(mount.width + pad * 2, mount.height + pad * 2);
}

export function hostUsesRectFrame(hostKind: AuraHostKind): boolean {
  return hostKind === "card";
}

export function hostIsDie(hostKind: AuraHostKind): boolean {
  return hostKind === "die";
}

export function drawRoundedRectFrame(
  g: Graphics,
  bounds: BorderBounds,
  strokeWidth: number,
  color: number,
  alpha = 1,
): void {
  const { halfW, halfH, cornerRadius } = bounds;
  g.roundRect(-halfW, -halfH, halfW * 2, halfH * 2, cornerRadius);
  g.stroke({ width: strokeWidth, color, alpha });
}

/** Card-only outline — avoids the visible “box” on dice hosts. */
export function drawCardFrameStroke(
  g: Graphics,
  bounds: BorderBounds,
  hostKind: AuraHostKind,
  strokeWidth: number,
  color: number,
  alpha = 1,
): void {
  if (!hostUsesRectFrame(hostKind)) {
    return;
  }
  drawRoundedRectFrame(g, bounds, strokeWidth, color, alpha);
}

export function perimeterPoint(
  bounds: BorderBounds,
  t: number,
): { x: number; y: number } {
  const { halfW, halfH } = bounds;
  const w = halfW * 2;
  const h = halfH * 2;
  const perimeter = 2 * (w + h);
  let d = ((t % 1) + 1) % 1 * perimeter;
  const x0 = -halfW;
  const y0 = -halfH;

  if (d < w) {
    return { x: x0 + d, y: y0 };
  }
  d -= w;
  if (d < h) {
    return { x: x0 + w, y: y0 + d };
  }
  d -= h;
  if (d < w) {
    return { x: x0 + w - d, y: y0 + h };
  }
  d -= w;
  return { x: x0, y: y0 + h - d };
}

/** Point on ellipse perimeter (t in 0..1). Works well for dice hosts. */
export function perimeterPointEllipse(
  bounds: BorderBounds,
  t: number,
): { x: number; y: number } {
  const a = bounds.halfW * 0.92;
  const b = bounds.halfH * 0.92;
  const angle = ((t % 1) + 1) % 1 * Math.PI * 2;
  return { x: Math.cos(angle) * a, y: Math.sin(angle) * b };
}

export function spawnPointForHost(
  bounds: BorderBounds,
  hostKind: AuraHostKind,
  t: number,
): { x: number; y: number } {
  return hostIsDie(hostKind)
    ? perimeterPointEllipse(bounds, t)
    : perimeterPoint(bounds, t);
}
