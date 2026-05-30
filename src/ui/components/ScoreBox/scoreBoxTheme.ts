import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";

type Rgb = readonly [number, number, number];

/** Shared with Tailwind surface classes on ScoreBox (`bg-blue-400`, `bg-red-500`). */
export type ScoreBoxVariantTheme = {
  surfaceClass: string;
  borderClass: string;
  surfaceColor: string;
  surfaceRgb: Rgb;
  flameMidColor: string;
  flameFrontColor: string;
};

type VariantColorScale = {
  surfaceToken: string;
  borderToken: string;
  flameMidToken: string;
  flameFrontToken: string;
  surfaceRgb: Rgb;
};

function tokenToClass(prefix: string, token: string): string {
  return `${prefix}-${token}`;
}

function tokenToCssVar(token: string): string {
  return `var(--color-${token})`;
}

function createTheme(scale: VariantColorScale): ScoreBoxVariantTheme {
  return {
    surfaceClass: tokenToClass("bg", scale.surfaceToken),
    borderClass: tokenToClass("border", scale.borderToken),
    surfaceColor: tokenToCssVar(scale.surfaceToken),
    surfaceRgb: scale.surfaceRgb,
    flameMidColor: tokenToCssVar(scale.flameMidToken),
    flameFrontColor: tokenToCssVar(scale.flameFrontToken),
  };
}

const scoreBoxVariantColors: Record<ScoreBoxVariant, VariantColorScale> = {
  points: {
    surfaceToken: "blue-400",
    borderToken: "blue-800",
    flameMidToken: "blue-600",
    flameFrontToken: "blue-300",
    surfaceRgb: [96, 165, 250],
  },
  mult: {
    surfaceToken: "red-500",
    borderToken: "red-900",
    flameMidToken: "red-700",
    flameFrontToken: "red-300",
    surfaceRgb: [239, 68, 68],
  },
};

export const scoreBoxVariantTheme: Record<ScoreBoxVariant, ScoreBoxVariantTheme> = {
  points: createTheme(scoreBoxVariantColors.points),
  mult: createTheme(scoreBoxVariantColors.mult),
};
