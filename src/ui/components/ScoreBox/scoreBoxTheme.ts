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

export const scoreBoxVariantTheme: Record<ScoreBoxVariant, ScoreBoxVariantTheme> = {
  points: {
    surfaceClass: "water-color-blue text-blue-700",
    borderClass: "",
    surfaceColor: "var(--color-blue-400)",
    surfaceRgb: [96, 165, 250],
    flameMidColor: "var(--color-blue-600)",
    flameFrontColor: "var(--color-blue-300)",
  },
  mult: {
    surfaceClass: "water-color-red text-red-700",
    borderClass: "",
    surfaceColor: "var(--color-red-500)",
    surfaceRgb: [239, 68, 68],
    flameMidColor: "var(--color-red-700)",
    flameFrontColor: "var(--color-red-300)",
  },
  bank: {
    surfaceClass: "",
    borderClass: "",
    surfaceColor: "var(--color-ui-panel-inset)",
    surfaceRgb: [42, 48, 51],
    flameMidColor: "var(--color-amber-600)",
    flameFrontColor: "var(--color-amber-300)",
  },
};
