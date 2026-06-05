import type { Graphics } from 'pixi.js';

import { drawButtonFace, drawButtonShadow } from '@/ui/components/Button/buttonVisuals';
import { SHOP_PANEL_FACE_COLOR } from '@/ui/shop/shopTheme';

type PanelTheme = {
  face: number;
  disabledFace: number;
};

export function drawShopPanelShadow(graphics: Graphics, width: number, height: number): void {
  drawButtonShadow(graphics, width, height);
}

export function drawShopPanelFace(graphics: Graphics, width: number, height: number): void {
  const theme: PanelTheme = {
    face: SHOP_PANEL_FACE_COLOR,
    disabledFace: SHOP_PANEL_FACE_COLOR,
  };
  drawButtonFace(graphics, width, height, theme, false);
}
