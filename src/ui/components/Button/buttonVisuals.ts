import type { Graphics } from "pixi.js";

import { BUTTON_CORNER_RADIUS } from "@/ui/components/Button/buttonTheme";
import type { ButtonVariantTheme } from "@/ui/components/Button/buttonTheme";

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = lerpChannel(ar, br, t);
  const g = lerpChannel(ag, bg, t);
  const bl = lerpChannel(ab, bb, t);
  return (r << 16) | (g << 8) | bl;
}

export function drawButtonShadow(
  graphics: Graphics,
  width: number,
  height: number,
  shadowColor: number,
  alpha: number,
  offsetY: number,
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = BUTTON_CORNER_RADIUS;

  graphics.clear();
  graphics.roundRect(-halfW, -halfH + offsetY, width, height, radius);
  graphics.fill({ color: shadowColor, alpha });
}

export function drawButtonFace(
  graphics: Graphics,
  width: number,
  height: number,
  theme: ButtonVariantTheme,
  highlight: number,
  disabled: boolean,
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = BUTTON_CORNER_RADIUS;

  const face = disabled
    ? theme.disabledFace
    : lerpColor(theme.face, theme.faceHover, highlight);

  graphics.clear();
  graphics.roundRect(-halfW, -halfH, width, height, radius);
  graphics.fill({ color: face });
}
