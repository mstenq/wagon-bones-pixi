export const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "success",
  "danger",
  "warning",
] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

/** Canonical button face colors — keep @theme `--color-btn-*` tokens in index.css in sync. */
export const BUTTON_DISABLED_FACE_HEX = "#9ca3af";

export const BUTTON_VARIANT_COLORS: Record<ButtonVariant, `#${string}`> = {
  primary: "#4a90e2",
  secondary: "#71717a",
  success: "#22c55e",
  danger: "#dc2626",
  warning: "#f97316",
};
