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
  className?: string;
};

const baseClass = "inline-flex min-h-8 min-w-14 items-center rounded-lg border-b-4  px-2.5 pt-1.5 pb-1 font-score text-5xl leading-none text-white tabular-nums select-none";

function variantFaceClass(variant: ScoreBoxVariant): string {
  const theme = scoreBoxVariantTheme[variant];
  const justify = variant === "points" ? "justify-end" : "justify-start";
  return ["score-box__face", justify, theme.borderClass, theme.surfaceClass].join(" ");
}

const variantDigitsClass: Record<ScoreBoxVariant, string> = {
  points: "inline-flex items-baseline justify-end gap-[0.04em]",
  mult: "inline-flex items-baseline justify-start gap-[0.04em]",
};

function formatScoreValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function getDigitChars(value: number): string[] {
  return formatScoreValue(value).toString().split("");
}

function getDigitChangeMask(previous: number, next: number): boolean[] {
  const prevDigits = getDigitChars(previous);
  const nextDigits = getDigitChars(next);
  const length = Math.max(prevDigits.length, nextDigits.length);
  const mask: boolean[] = [];

  for (let index = 0; index < length; index += 1) {
    const prevDigit = prevDigits[prevDigits.length - length + index] ?? "";
    const nextDigit = nextDigits[nextDigits.length - length + index] ?? "";
    mask.push(prevDigit !== nextDigit);
  }

  return mask;
}

export function ScoreBox({ variant, value, flameIntensity = 0, className }: ScoreBoxProps) {
  const displayValue = formatScoreValue(value);
  const digits = getDigitChars(displayValue);

  const previousValueRef = useRef(displayValue);
  const bumpGenerationRef = useRef(0);
  const changeMaskRef = useRef<boolean[]>(digits.map(() => false));

  if (previousValueRef.current !== displayValue) {
    changeMaskRef.current = getDigitChangeMask(previousValueRef.current, displayValue);
    bumpGenerationRef.current += 1;
    previousValueRef.current = displayValue;
  }

  const bumpGeneration = bumpGenerationRef.current;
  const changeMask = changeMaskRef.current;

  const faceClassName = [baseClass, variantFaceClass(variant), className].filter(Boolean).join(" ");

  return (
    <div className="relative inline-flex" aria-label={`${variant} score ${displayValue}`}>
      <ScoreFlame variant={variant} intensity={flameIntensity} />
      <div className={faceClassName}>
        <WaveBounceChars
          text={digits.join("")}
          className={variantDigitsClass[variant]}
          getCharKey={({ char, index }) => `${index}-${char}-${bumpGeneration}`}
          renderChar={({ char, index }) => {
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
                {char}
              </span>
            );
          }}
        />
      </div>
    </div>
  );
}
