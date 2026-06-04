import { useRef, type CSSProperties } from "react";

import { ScoreFlame } from "@/ui/components/ScoreBox/ScoreFlame";
import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";
import { scoreBoxVariantTheme } from "@/ui/components/ScoreBox/scoreBoxTheme";
import { WaveBounceChars } from "@/ui/components/WaveBounce/WaveBounceChars";

export type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";

export type ScoreBoxProps = {
  variant: ScoreBoxVariant;
  value: number;
  /** 0–1 flame strength from game logic; 0 is off. */
  flameIntensity?: number;
  /** Grow to fill a flex parent (e.g. HandInfo score row). */
  fill?: boolean;
  className?: string;
};

const chipFaceClass =
  "min-h-7 items-center px-2 pt-1 pb-1 font-header text-4xl leading-none tabular-nums select-none md:min-h-8 md:px-2.5 md:pt-1.5 md:pb-1 md:text-5xl";
const bankFaceClass =
  "min-h-7 items-center px-2 py-1.5 font-header text-4xl leading-none tabular-nums select-none md:min-h-8 md:px-3 md:py-2 md:text-5xl";
const shrinkClass = "inline-flex min-w-14";
const fillClass = "flex w-full min-w-0 flex-1";

function variantFaceClass(variant: ScoreBoxVariant): string {
  const theme = scoreBoxVariantTheme[variant];
  const justify =
    variant === "points"
      ? "justify-end"
      : variant === "mult"
        ? "justify-start"
        : "justify-center";
  const face =
    variant === "bank"
      ? [bankFaceClass, justify, theme.borderClass, theme.surfaceClass]
      : [chipFaceClass, justify, theme.borderClass, theme.surfaceClass];
  return ["score-box__face", ...face].join(" ");
}

const variantDigitsClass: Record<ScoreBoxVariant, string> = {
  points: "pt-3 inline-flex items-baseline justify-end gap-[0.04em]",
  mult: "pt-3 inline-flex items-baseline justify-start gap-[0.04em]",
  bank: "pt-3 inline-flex items-baseline justify-center gap-[0.04em]",
};

function formatScoreValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function getWaveText(variant: ScoreBoxVariant, value: number): string {
  const formatted = formatScoreValue(value).toString();
  return variant === "bank" ? `$${formatted}` : formatted;
}

function getCharChangeMask(previous: string, next: string): boolean[] {
  const length = Math.max(previous.length, next.length);
  const mask: boolean[] = [];

  for (let index = 0; index < length; index += 1) {
    const prevChar = previous[previous.length - length + index] ?? "";
    const nextChar = next[next.length - length + index] ?? "";
    mask.push(prevChar !== nextChar);
  }

  return mask;
}

export function ScoreBox({
  variant,
  value,
  flameIntensity = 0,
  fill = false,
  className,
}: ScoreBoxProps) {
  const displayValue = formatScoreValue(value);
  const waveText = getWaveText(variant, displayValue);

  const previousValueRef = useRef(displayValue);
  const bumpGenerationRef = useRef(0);
  const changeMaskRef = useRef<boolean[]>([...waveText].map(() => false));

  if (previousValueRef.current !== displayValue) {
    changeMaskRef.current = getCharChangeMask(
      getWaveText(variant, previousValueRef.current),
      waveText,
    );
    bumpGenerationRef.current += 1;
    previousValueRef.current = displayValue;
  }

  const bumpGeneration = bumpGenerationRef.current;
  const changeMask = changeMaskRef.current;

  const faceClassName = [
    fill ? fillClass : shrinkClass,
    variantFaceClass(variant),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootClassName = [
    "relative min-h-7 min-w-0 overflow-visible md:min-h-8",
    fill ? "flex flex-1" : "inline-flex",
  ]
    .filter(Boolean)
    .join(" ");

  const ariaLabel =
    variant === "bank" ? `Bank balance ${displayValue}` : `${variant} score ${displayValue}`;

  return (
    <div className={rootClassName} aria-label={ariaLabel}>
      {variant !== "bank" ? <ScoreFlame variant={variant} intensity={flameIntensity} /> : null}
      <div className={faceClassName}>
        <WaveBounceChars
          text={waveText}
          className={variantDigitsClass[variant]}
          getCharKey={({ char, index }) => `${index}-${char}-${bumpGeneration}`}
          renderChar={({ displayChar, index }) => {
            const changed = changeMask[index] ?? true;
            const digitClassName = [
              "inline-block origin-bottom will-change-transform",
              bumpGeneration > 0 ? "animate-score-bump" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const bumpStyle: CSSProperties | undefined =
              bumpGeneration > 0
                ? ({ "--bump-scale": changed ? 1.24 : 1.08 } as CSSProperties)
                : undefined;

            return (
              <span className={digitClassName} style={bumpStyle}>
                {displayChar}
              </span>
            );
          }}
        />
      </div>
    </div>
  );
}
