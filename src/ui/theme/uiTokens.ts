/** Tailwind default palette — 500 step for primary chrome and Pixi fills. */
export const UI_PRIMARY_COLORS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'sky',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const;

export type UiPrimaryColor = (typeof UI_PRIMARY_COLORS)[number];

export const DEFAULT_UI_PRIMARY_COLOR: UiPrimaryColor = 'blue';

/** Tailwind v4 default --color-*-500 values */
export const TAILWIND_500_HEX: Record<UiPrimaryColor, `#${string}`> = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

export const NEO_SHADOW_OFFSET_X = -5;
export const NEO_SHADOW_OFFSET_Y = 5;
export const NEO_RADIUS_PX = 10;
export const NEO_BORDER_WIDTH_PX = 3;
export const NEO_BORDER_COLOR = 0x000000;
export const NEO_SHADOW_COLOR = 0x000000;

export const BUTTON_DISABLED_FACE_HEX = '#9ca3af';
export const BUTTON_NEUTRAL_FACE_HEX = '#ffffff';

export const UI_FONT_HEADER = '"Angkor", serif';
export const UI_FONT_BODY = '"Bree Serif", serif';

/** Pixi fill color at the 500 step (hex; CSS uses oklch from primaryPalette). */
export function getPrimaryHex(color: UiPrimaryColor): `#${string}` {
  return TAILWIND_500_HEX[color];
}

/** Updated by UiPrimaryProvider for Pixi primary button face. */
let pixiPrimaryFaceHex: `#${string}` = TAILWIND_500_HEX[DEFAULT_UI_PRIMARY_COLOR];

export function getPixiPrimaryFaceHex(): `#${string}` {
  return pixiPrimaryFaceHex;
}

export function setPixiPrimaryFaceHex(hex: `#${string}`): void {
  pixiPrimaryFaceHex = hex;
}
