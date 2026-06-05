import type { Graphics } from "pixi.js";

import {
  drawButtonFace,
  drawButtonShadow,
} from "@/ui/components/Button/buttonVisuals";
import {
  ROUND_CARD_BORDER_COLOR,
  ROUND_CARD_BORDER_WIDTH,
  ROUND_CARD_CORNER_RADIUS,
  ROUND_CARD_SHADOW_OFFSET_X,
  ROUND_CARD_SHADOW_OFFSET_Y,
  type RoundCardStatusTheme,
} from "@/ui/components/RoundCard/roundCardTheme";
import { NEO_SHADOW_COLOR } from "@/ui/theme/uiTokens";

type ButtonVariantTheme = {
  face: number;
  disabledFace: number;
};

export function drawRoundCardShadow(
  graphics: Graphics,
  width: number,
  height: number,
): void {
  drawButtonShadow(graphics, width, height);
}

export function drawRoundCardFace(
  graphics: Graphics,
  width: number,
  height: number,
  theme: RoundCardStatusTheme,
): void {
  const variantTheme: ButtonVariantTheme = {
    face: theme.faceColor,
    disabledFace: theme.faceColor,
  };
  drawButtonFace(graphics, width, height, variantTheme, false);

  if (theme.accentStrokeColor === null) {
    return;
  }

  const halfW = width / 2;
  const halfH = height / 2;
  const radius = ROUND_CARD_CORNER_RADIUS;

  graphics.roundRect(-halfW, -halfH, width, height, radius);
  graphics.stroke({
    color: theme.accentStrokeColor,
    width: ROUND_CARD_BORDER_WIDTH + 1,
    alignment: 1,
  });
}

export function drawPlaceholderCircle(
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
): void {
  graphics.clear();
  graphics.circle(x, y, radius);
  graphics.fill({ color, alpha: 1 });
  graphics.stroke({
    color: ROUND_CARD_BORDER_COLOR,
    width: 2,
    alignment: 1,
  });
}

export function drawNeoChipShadow(
  graphics: Graphics,
  width: number,
  height: number,
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = Math.min(8, ROUND_CARD_CORNER_RADIUS);

  graphics.clear();
  graphics.roundRect(
    -halfW + ROUND_CARD_SHADOW_OFFSET_X,
    -halfH + ROUND_CARD_SHADOW_OFFSET_Y,
    width,
    height,
    radius,
  );
  graphics.fill({ color: NEO_SHADOW_COLOR, alpha: 1 });
}

export function drawNeoChipFace(
  graphics: Graphics,
  width: number,
  height: number,
  faceColor: number,
): void {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = Math.min(8, ROUND_CARD_CORNER_RADIUS);

  graphics.clear();
  graphics.roundRect(-halfW, -halfH, width, height, radius);
  graphics.fill({ color: faceColor, alpha: 1 });
  graphics.stroke({
    color: ROUND_CARD_BORDER_COLOR,
    width: ROUND_CARD_BORDER_WIDTH,
    alignment: 1,
  });
}

export function drawSkipButtonShadow(
  graphics: Graphics,
  width: number,
  height: number,
): void {
  drawButtonShadow(graphics, width, height);
}

export function drawSkipButtonFace(
  graphics: Graphics,
  width: number,
  height: number,
  faceColor: number,
): void {
  const variantTheme: ButtonVariantTheme = {
    face: faceColor,
    disabledFace: faceColor,
  };
  drawButtonFace(graphics, width, height, variantTheme, false);
}
