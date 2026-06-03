export {
  DICE_COUNT,
  DICE_ENHANCEMENT_OPTIONS,
  DICE_LABELS,
  DICE_TYPES,
  type DiceType,
} from "@/data/dice";

export type DieMode =
  | "base"
  | "selected"
  | "debuffed"
  | "playedNonScoring"
  | "locked";

export const DIE_MODES: DieMode[] = [
  "base",
  "selected",
  "debuffed",
  "playedNonScoring",
  "locked",
];

export const DIE_MODE_LABELS: Record<DieMode, string> = {
  base: "Base",
  selected: "Selected",
  debuffed: "Debuffed",
  playedNonScoring: "Played (non-scoring)",
  locked: "Locked",
};

export const DIE_SELECTED_LIFT_PX = 30;

export function dieModeAlpha(mode: DieMode): number {
  if (mode === "debuffed") {
    return 0.8;
  }
  if (mode === "playedNonScoring") {
    return 0.7;
  }
  return 1;
}
