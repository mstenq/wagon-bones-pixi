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
    surfaceClass: "bg-blue-400",
    borderClass: "border-blue-800",
    surfaceColor: "var(--color-blue-400)",
    surfaceRgb: [96, 165, 250],
    flameMidColor: "var(--color-blue-600)",
    flameFrontColor: "var(--color-blue-300)",
  },
  mult: {
    surfaceClass: "bg-red-500",
    borderClass: "border-red-900",
    surfaceColor: "var(--color-red-500)",
    surfaceRgb: [239, 68, 68],
    flameMidColor: "var(--color-red-700)",
    flameFrontColor: "var(--color-red-300)",
  },
  bank: {
    surfaceClass: "bg-ui-panel-inset",
    borderClass: "border-black/40",
    surfaceColor: "var(--color-ui-panel-inset)",
    surfaceRgb: [42, 48, 51],
    flameMidColor: "var(--color-amber-600)",
    flameFrontColor: "var(--color-amber-300)",
  },
};
