import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";

type Rgb = readonly [number, number, number];

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
    surfaceClass: "bg-blue-500 text-blue-50 rounded-lg",
    borderClass: "",
    surfaceColor: "var(--color-blue-500)",
    surfaceRgb: [59, 130, 246],
    flameMidColor: "var(--color-blue-600)",
    flameFrontColor: "var(--color-blue-300)",
  },
  mult: {
    surfaceClass: "bg-red-500 text-red-50 rounded-lg",
    borderClass: "",
    surfaceColor: "var(--color-red-500)",
    surfaceRgb: [239, 68, 68],
    flameMidColor: "var(--color-red-700)",
    flameFrontColor: "var(--color-red-300)",
  },
  bank: {
    surfaceClass: "bg-transparent text-yellow-500",
    borderClass: "",
    surfaceColor: "var(--color-primary-50)",
    surfaceRgb: [239, 246, 255],
    flameMidColor: "var(--color-primary)",
    flameFrontColor: "var(--color-primary)",
  },
};
