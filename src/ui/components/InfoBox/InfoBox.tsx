import type { ReactNode } from "react";

import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";

export type InfoBoxProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

const labelClass =
  "p-0.5 text-center text-xs leading-none font-body text-black xl:p-1 xl:text-xl";

const bodyClass =
  "mx-1 mb-1 flex min-h-6 flex-1 items-center justify-center xl:mx-2 xl:mb-2 xl:min-h-12";

export function InfoBox({ label, children, className }: InfoBoxProps) {
  return (
    <NeoSurface
      fullWidth
      className={["min-w-0 flex-1", className].filter(Boolean).join(" ")}
      faceClassName="flex h-full min-h-0 flex-col py-1 xl:py-2"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <span className={labelClass}>{label}</span>
        <div className={bodyClass}>{children}</div>
      </div>
    </NeoSurface>
  );
}

const valueTextClass = "text-2xl leading-none tabular-nums xl:text-5xl";

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
      <span className="hidden text-lg font-body text-black/70 tabular-nums xl:inline xl:text-2xl">
        / {total}
      </span>
    </div>
  );
}
