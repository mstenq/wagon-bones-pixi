import { TextStyle } from "pixi.js";

import {
  BUTTON_DISABLED_FACE_HEX,
  BUTTON_VARIANT_COLORS,
  BUTTON_VARIANTS,
  type ButtonVariant,
} from "@/ui/components/Button/buttonVariantColors";
import { hexToPixiColor } from "@/ui/pixi/color";

export { BUTTON_VARIANTS, type ButtonVariant };

export type ButtonProps = {
  variant: ButtonVariant;
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  disabled?: boolean;
  onClick?: () => void;
};

export type ButtonElementProps = {
  variant: ButtonVariant;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
};

export type ButtonVariantTheme = {
  face: number;
  disabledFace: number;
};

const disabledFace = hexToPixiColor(BUTTON_DISABLED_FACE_HEX);

export const BUTTON_VARIANT_THEME: Record<ButtonVariant, ButtonVariantTheme> = {
  primary: {
    face: hexToPixiColor(BUTTON_VARIANT_COLORS.primary),
    disabledFace,
  },
  secondary: {
    face: hexToPixiColor(BUTTON_VARIANT_COLORS.secondary),
    disabledFace,
  },
  success: {
    face: hexToPixiColor(BUTTON_VARIANT_COLORS.success),
    disabledFace,
  },
  danger: {
    face: hexToPixiColor(BUTTON_VARIANT_COLORS.danger),
    disabledFace,
  },
  warning: {
    face: hexToPixiColor(BUTTON_VARIANT_COLORS.warning),
    disabledFace,
  },
};

export const DEFAULT_BUTTON_WIDTH = 168;
export const DEFAULT_BUTTON_HEIGHT = 52;
export const BUTTON_CORNER_RADIUS = 10;
export const BUTTON_BORDER_WIDTH = 3;
export const BUTTON_BORDER_COLOR = 0x000000;
export const BUTTON_SHADOW_OFFSET_X = 5;
export const BUTTON_SHADOW_OFFSET_Y = 5;
export const BUTTON_HOVER_OFFSET_X = BUTTON_SHADOW_OFFSET_X / 2;
export const BUTTON_HOVER_OFFSET_Y = BUTTON_SHADOW_OFFSET_Y / 2;
/** Matches `.btn-neo-face` transform transition in index.css */
export const BUTTON_PRESS_TRANSITION_MS = 70;

export function buttonFaceOffset(
  hovered: boolean,
  pressed: boolean,
): { x: number; y: number } {
  if (pressed) {
    return { x: -BUTTON_SHADOW_OFFSET_X, y: BUTTON_SHADOW_OFFSET_Y };
  }
  if (hovered) {
    return { x: -BUTTON_HOVER_OFFSET_X, y: BUTTON_HOVER_OFFSET_Y };
  }
  return { x: 0, y: 0 };
}
export const BUTTON_SHADOW_COLOR = 0x000000;
export const BUTTON_TEXT_COLOR = 0x000000;
export const BUTTON_LABEL_FONT_FAMILY = '"Bree Serif", serif';
export const BUTTON_LABEL_FONT_SIZE = 22;

export function buttonLabelTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: BUTTON_LABEL_FONT_FAMILY,
    fontSize: BUTTON_LABEL_FONT_SIZE,
    fill: BUTTON_TEXT_COLOR,
    align: "center",
  });
}
