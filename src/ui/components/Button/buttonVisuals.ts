import type { Graphics } from 'pixi.js';

import {
  BUTTON_BORDER_COLOR,
  BUTTON_BORDER_WIDTH,
  BUTTON_CORNER_RADIUS,
  BUTTON_SHADOW_COLOR,
  BUTTON_SHADOW_OFFSET_X,
  BUTTON_SHADOW_OFFSET_Y,
  type ButtonVariantTheme,
} from '@/ui/components/Button/buttonTheme';

export function drawButtonShadow(graphics: Graphics, width: number, height: number): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = BUTTON_CORNER_RADIUS;

  graphics.clear();
  graphics.roundRect(-halfW + BUTTON_SHADOW_OFFSET_X, -halfH + BUTTON_SHADOW_OFFSET_Y, width, height, radius);
  graphics.fill({ color: BUTTON_SHADOW_COLOR, alpha: 1 });
}

export function drawButtonFace(
  graphics: Graphics,
  width: number,
  height: number,
  theme: ButtonVariantTheme,
  disabled: boolean,
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = BUTTON_CORNER_RADIUS;
  const face = disabled ? theme.disabledFace : theme.face;

  graphics.clear();
  graphics.roundRect(-halfW, -halfH, width, height, radius);
  graphics.fill({ color: face });
  graphics.stroke({
    color: BUTTON_BORDER_COLOR,
    width: BUTTON_BORDER_WIDTH,
    alignment: 1,
  });
}
