import { useRef, type CSSProperties } from "react";

export type ScoreBoxVariant = "points" | "mult";

export type ScoreBoxProps = {
  variant: ScoreBoxVariant;
  value: number;
  className?: string;
};

const variantRootClass: Record<ScoreBoxVariant, string> = {
  points:
    "inline-flex min-h-10 min-w-14 items-center justify-end rounded-lg border-b-4 border-blue-800 bg-blue-400 px-2.5 pt-1.5 pb-2 font-score text-4xl leading-none font-bold text-white tabular-nums select-none",
  mult:
    "inline-flex min-h-10 min-w-14 items-center justify-start rounded-lg border-b-4 border-red-900 bg-red-500 px-2.5 pt-1.5 pb-2 font-score text-4xl leading-none font-bold text-white tabular-nums select-none",
};

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

export function ScoreBox({ variant, value, className }: ScoreBoxProps) {
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

  const rootClassName = [variantRootClass[variant], className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName} aria-label={`${variant} score ${displayValue}`}>
      <span className={variantDigitsClass[variant]} aria-hidden>
        {digits.map((digit, index) => {
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
            <span
              key={`${index}-${digit}-${bumpGeneration}`}
              className={digitClassName}
              style={bumpStyle}
            >
              {digit}
            </span>
          );
        })}
      </span>
    </div>
  );
}
