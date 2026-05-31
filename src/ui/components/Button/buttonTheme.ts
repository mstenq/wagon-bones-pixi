import { TextStyle } from "pixi.js";
import type { SquishTargets } from "@/ui/interaction/spring";

export const BUTTON_VARIANTS = ["primary", "secondary", "success", "danger"] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

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

export type ButtonVariantTheme = {
  face: number;
  faceHover: number;
  text: number;
  textShadow: number;
  shadow: number;
  disabledFace: number;
  disabledText: number;
};

export const buttonVariantTheme: Record<ButtonVariant, ButtonVariantTheme> = {
  primary: {
    face: 0x3b82f6,
    faceHover: 0x60a5fa,
    text: 0xffffff,
    textShadow: 0x1e3a8a,
    shadow: 0x0f172a,
    disabledFace: 0x334155,
    disabledText: 0x94a3b8,
  },
  secondary: {
    face: 0x52525b,
    faceHover: 0x71717a,
    text: 0xffffff,
    textShadow: 0x27272a,
    shadow: 0x0f172a,
    disabledFace: 0x3f3f46,
    disabledText: 0x94a3b8,
  },
  success: {
    face: 0x22c55e,
    faceHover: 0x4ade80,
    text: 0xffffff,
    textShadow: 0x14532d,
    shadow: 0x052e16,
    disabledFace: 0x3f3f46,
    disabledText: 0x94a3b8,
  },
  danger: {
    face: 0xef4444,
    faceHover: 0xf87171,
    text: 0xffffff,
    textShadow: 0x7f1d1d,
    shadow: 0x450a0a,
    disabledFace: 0x3f3f46,
    disabledText: 0x94a3b8,
  },
};

export const DEFAULT_BUTTON_WIDTH = 168;
export const DEFAULT_BUTTON_HEIGHT = 52;
export const BUTTON_CORNER_RADIUS = 10;
export const BUTTON_SHADOW_OFFSET_Y = 4;
export const BUTTON_SHADOW_ALPHA = 0.35;

export const BUTTON_HOVER_SCALE = 1.08;
export const BUTTON_CLICK_SQUISH_MS = 160;
export const BUTTON_REDUCED_MOTION_HOVER_SCALE = 1.02;

export const BUTTON_GRAB_SQUISH: SquishTargets = { scaleX: 1.04, scaleY: 0.88 };
export const BUTTON_POP_SQUISH: SquishTargets = { scaleX: 1.1, scaleY: 1.1 };
export const BUTTON_PINCH_SQUISH: SquishTargets = { scaleX: 0.92, scaleY: 0.94 };

export const BUTTON_LABEL_FONT_SIZE = 28;
export const BUTTON_LABEL_CHAR_GAP_PX = 2;
export const BUTTON_LABEL_CLICK_RIPPLE_MS = 420;
export const BUTTON_LABEL_CLICK_BUMP_PX = 6;

export function buttonHoverSquish(scale: number): SquishTargets {
  return { scaleX: scale, scaleY: scale };
}

export function buttonLabelTextStyleFor(fill: number, shadow: number): TextStyle {
  return new TextStyle({
    fontFamily: '"Jersey 10", sans-serif',
    fontSize: BUTTON_LABEL_FONT_SIZE,
    fill,
    align: "center",
    dropShadow: {
      alpha: 0.55,
      angle: Math.PI / 2,
      blur: 0,
      color: shadow,
      distance: 2,
    },
  });
}
