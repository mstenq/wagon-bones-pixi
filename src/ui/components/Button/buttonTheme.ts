import { TextStyle } from 'pixi.js';

import {
  BUTTON_DISABLED_FACE_HEX,
  BUTTON_NEUTRAL_FACE_HEX,
  BUTTON_VARIANTS,
  type ButtonVariant,
} from '@/ui/components/Button/buttonVariantColors';
import {
  getPixiPrimaryFaceHex,
  NEO_BORDER_COLOR,
  NEO_BORDER_WIDTH_PX,
  NEO_RADIUS_PX,
  NEO_SHADOW_OFFSET_X,
  NEO_SHADOW_OFFSET_Y,
  UI_FONT_BODY,
} from '@/ui/theme/uiTokens';
import { hexToPixiColor } from '@/ui/pixi/color';

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
  /** Optional face colors overriding the variant theme. */
  faceTheme?: ButtonVariantTheme;
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
const neutralFace = hexToPixiColor(BUTTON_NEUTRAL_FACE_HEX);

export function getButtonVariantTheme(variant: ButtonVariant): ButtonVariantTheme {
  if (variant === 'primary') {
    return {
      face: hexToPixiColor(getPixiPrimaryFaceHex()),
      disabledFace,
    };
  }
  return {
    face: neutralFace,
    disabledFace,
  };
}

export const DEFAULT_BUTTON_WIDTH = 168;
export const DEFAULT_BUTTON_HEIGHT = 52;
export const BUTTON_CORNER_RADIUS = NEO_RADIUS_PX;
export const BUTTON_BORDER_WIDTH = NEO_BORDER_WIDTH_PX;
export const BUTTON_BORDER_COLOR = NEO_BORDER_COLOR;
export const BUTTON_SHADOW_OFFSET_X = NEO_SHADOW_OFFSET_X;
export const BUTTON_SHADOW_OFFSET_Y = NEO_SHADOW_OFFSET_Y;
export const BUTTON_HOVER_OFFSET_X = NEO_SHADOW_OFFSET_X / 2;
export const BUTTON_HOVER_OFFSET_Y = NEO_SHADOW_OFFSET_Y / 2;
/** Does not match `.neo-surface-face--interactive` transform transition in index.css
 *  purposely faster than DOM one because the pixi one feels slower, not sure why
 */
export const BUTTON_PRESS_TRANSITION_MS = 70;

export function buttonFaceOffset(hovered: boolean, pressed: boolean): { x: number; y: number } {
  if (pressed) {
    return { x: BUTTON_SHADOW_OFFSET_X, y: BUTTON_SHADOW_OFFSET_Y };
  }
  if (hovered) {
    return { x: BUTTON_HOVER_OFFSET_X, y: BUTTON_HOVER_OFFSET_Y };
  }
  return { x: 0, y: 0 };
}

export const BUTTON_SHADOW_COLOR = NEO_BORDER_COLOR;
export const BUTTON_TEXT_COLOR = 0x000000;
export const BUTTON_LABEL_FONT_FAMILY = UI_FONT_BODY;
export const BUTTON_LABEL_FONT_SIZE = 22;

export function buttonLabelTextStyle(): TextStyle {
  return new TextStyle({
    fontFamily: BUTTON_LABEL_FONT_FAMILY,
    fontSize: BUTTON_LABEL_FONT_SIZE,
    fill: BUTTON_TEXT_COLOR,
    align: 'center',
  });
}
