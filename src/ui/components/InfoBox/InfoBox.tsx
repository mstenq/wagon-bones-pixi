import type { ReactNode } from "react";

export type InfoBoxProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

const rootClass =
  "water-color-600x150 font-score flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl py-2 select-none";

const labelClass = "p-1 text-center text-base leading-none  font-body text-taupe-800 md:text-xl";

const bodyClass =
  "mx-2 mb-1.5 flex min-h-9 flex-1 items-center justify-center md:mb-2 md:min-h-12";

export function InfoBox({ label, children, className }: InfoBoxProps) {
  const rootClassName = [rootClass, className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <span className={labelClass}>{label}</span>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export type InfoBoxRockTone = "blue" | "red" | "amber";

const valueTextClass =
  "text-4xl leading-none tabular-nums md:text-5xl";

const rockToneClass: Record<InfoBoxRockTone, string> = {
  blue: "text-blue-400",
  red: "text-red-500",
  amber: "text-amber-500",
};

export type InfoBoxRockValueProps = {
  value: number | string;
  tone: InfoBoxRockTone;
};

/** Colored value with subtle back-and-forth rock via `animate-info-rock`. */
export function InfoBoxRockValue({ value, tone }: InfoBoxRockValueProps) {
  return (
    <span
      className={[
        "inline-block origin-center animate-info-rock font-bold",
        valueTextClass,
        rockToneClass[tone],
      ].join(" ")}
    >
      {value}
    </span>
  );
}

const staticAmberClass = [valueTextClass, "text-amber-500 font-bold"].join(" ");

export type InfoBoxAnteValueProps = {
  current: number;
  total: number;
};

/** Ante tracker — current only below md; full `current / total` at md+. */
export function InfoBoxAnteValue({ current, total }: InfoBoxAnteValueProps) {
  return (
    <div
      className="flex items-center justify-center leading-none"
      aria-label={`Ante ${current} of ${total}`}
    >
      <span className={staticAmberClass}>{current}</span>
      <span className="hidden text-2xl text-taupe-800 tabular-nums md:inline">/ {total}</span>
    </div>
  );
}
