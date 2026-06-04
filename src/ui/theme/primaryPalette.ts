import tailwindColors from "tailwindcss/colors";

import {
  TAILWIND_500_HEX,
  UI_PRIMARY_COLORS,
  type UiPrimaryColor,
} from "@/ui/theme/uiTokens";

export const UI_PRIMARY_SHADES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type UiPrimaryShade = (typeof UI_PRIMARY_SHADES)[number];

export type PrimaryPalette = Record<UiPrimaryShade, string>;

function readPalette(color: UiPrimaryColor): PrimaryPalette {
  const source = tailwindColors[color] as Record<number, string>;
  const palette = {} as PrimaryPalette;

  for (const shade of UI_PRIMARY_SHADES) {
    const value = source[shade];
    if (typeof value !== "string") {
      throw new Error(`Missing Tailwind color ${color}-${shade}`);
    }
    palette[shade] = value;
  }

  return palette;
}

const paletteCache = new Map<UiPrimaryColor, PrimaryPalette>();

/** Full Tailwind scale for the active primary hue (oklch, matches tailwindcss/colors). */
export function getPrimaryPalette(color: UiPrimaryColor): PrimaryPalette {
  const cached = paletteCache.get(color);
  if (cached) {
    return cached;
  }

  const palette = readPalette(color);
  paletteCache.set(color, palette);
  return palette;
}

/** CSS custom properties for `bg-primary-*`, `text-primary-*`, etc. */
export function primaryPaletteCssProperties(
  color: UiPrimaryColor,
): Record<string, string> {
  const palette = getPrimaryPalette(color);
  const properties: Record<string, string> = {
    "--color-primary": palette[500],
  };

  for (const shade of UI_PRIMARY_SHADES) {
    properties[`--color-primary-${shade}`] = palette[shade];
  }

  return properties;
}

export function applyUiPrimaryPalette(element: HTMLElement, color: UiPrimaryColor): void {
  const properties = primaryPaletteCssProperties(color);
  for (const [name, value] of Object.entries(properties)) {
    element.style.setProperty(name, value);
  }
}

/** Default blue scale for @theme in index.css — keep in sync via `bun run theme:dump-primary`. */
export const DEFAULT_UI_PRIMARY_THEME_CSS = /* generated from tailwindcss/colors blue */ {
  50: "oklch(97% 0.014 254.604)",
  100: "oklch(93.2% 0.032 255.585)",
  200: "oklch(88.2% 0.059 254.128)",
  300: "oklch(80.9% 0.105 251.813)",
  400: "oklch(70.7% 0.165 254.624)",
  500: "oklch(62.3% 0.214 259.815)",
  600: "oklch(54.6% 0.245 262.881)",
  700: "oklch(48.8% 0.243 264.376)",
  800: "oklch(42.4% 0.199 265.638)",
  900: "oklch(37.9% 0.146 265.522)",
  950: "oklch(28.2% 0.091 267.935)",
} as const satisfies Record<UiPrimaryShade, string>;
