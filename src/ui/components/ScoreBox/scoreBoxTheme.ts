import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";

/** Shared with Tailwind surface classes on ScoreBox (`bg-blue-400`, `bg-red-500`). */
export type ScoreBoxVariantTheme = {
  surfaceClass: string;
  borderClass: string;
  surfaceColor: string;
  flameMidColor: string;
  flameFrontColor: string;
};

export const scoreBoxVariantTheme: Record<ScoreBoxVariant, ScoreBoxVariantTheme> = {
  points: {
    surfaceClass: "bg-blue-400",
    borderClass: "border-blue-800",
    surfaceColor: "var(--color-blue-400)",
    flameMidColor: "var(--color-blue-600)",
    flameFrontColor: "var(--color-blue-300)",
  },
  mult: {
    surfaceClass: "bg-red-500",
    borderClass: "border-red-900",
    surfaceColor: "var(--color-red-500)",
    flameMidColor: "var(--color-red-700)",
    flameFrontColor: "var(--color-red-300)",
  },
};
