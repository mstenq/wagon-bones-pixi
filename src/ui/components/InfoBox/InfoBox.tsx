import type { ReactNode } from "react";

import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";

export type InfoBoxProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

const labelClass =
  "p-1 text-center text-base leading-none font-body text-black md:text-xl";

const bodyClass =
  "mx-2 mb-1.5 flex min-h-9 flex-1 items-center justify-center md:mb-2 md:min-h-12";

export function InfoBox({ label, children, className }: InfoBoxProps) {
  return (
    <NeoSurface
      fullWidth
      className={["min-w-0 flex-1", className].filter(Boolean).join(" ")}
      faceClassName="flex h-full min-h-0 flex-col py-2"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <span className={labelClass}>{label}</span>
        <div className={bodyClass}>{children}</div>
      </div>
    </NeoSurface>
  );
}

const valueTextClass = "text-4xl leading-none tabular-nums md:text-5xl";

export type InfoBoxRockValueProps = {
  value: number | string;
};

/** Colored value with subtle back-and-forth rock via `animate-info-rock`. */
export function InfoBoxRockValue({ value }: InfoBoxRockValueProps) {
  return (
    <span
      className={[
        "inline-block origin-center animate-info-rock font-header",
        valueTextClass,
      ].join(" ")}
    >
      {value}
    </span>
  );
}

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
      <span className={[valueTextClass, "font-header text-amber-500"].join(" ")}>
        {current}
      </span>
      <span className="hidden text-2xl font-body text-black/70 tabular-nums md:inline">
        / {total}
      </span>
    </div>
  );
}
