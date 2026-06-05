import type { Graphics } from 'pixi.js';

import { drawButtonFace, drawButtonShadow } from '@/ui/components/Button/buttonVisuals';
import { TRAIL_EVENT_PANEL_FACE_COLOR } from '@/ui/trailEvent/trailEventTheme';
import { NEO_BORDER_WIDTH_PX, NEO_RADIUS_PX } from '@/ui/theme/uiTokens';

type PanelTheme = {
  face: number;
  disabledFace: number;
};

export function drawTrailEventPanelShadow(graphics: Graphics, width: number, height: number): void {
  drawButtonShadow(graphics, width, height);
}

export function drawTrailEventPanelFace(
  graphics: Graphics,
  width: number,
  height: number,
  accentColor: number,
): void {
  const theme: PanelTheme = {
    face: TRAIL_EVENT_PANEL_FACE_COLOR,
    disabledFace: TRAIL_EVENT_PANEL_FACE_COLOR,
  };
  drawButtonFace(graphics, width, height, theme, false);

  const halfW = width / 2;
  const halfH = height / 2;
  const accentHeight = 8;
  const inset = NEO_BORDER_WIDTH_PX;
  const innerX = -halfW + inset;
  const innerY = -halfH + inset;
  const innerW = width - inset * 2;
  const accentRadius = Math.max(0, NEO_RADIUS_PX - inset);

  graphics.roundRect(innerX, innerY, innerW, accentHeight, accentRadius);
  graphics.fill({ color: accentColor, alpha: 1 });
}

export function drawSpyglassRing(graphics: Graphics, radius: number): void {
  graphics.clear();
  graphics.circle(0, 0, radius);
  graphics.stroke({
    color: 0xffcc00,
    width: 3,
    alignment: 1,
  });
  graphics.circle(0, 0, radius - 2);
  graphics.stroke({
    color: 0xffffff,
    width: 1,
    alpha: 0.35,
    alignment: 1,
  });
}
