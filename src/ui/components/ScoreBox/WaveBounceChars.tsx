import type { CSSProperties, ReactNode } from "react";

export type WaveBounceCharRenderProps = {
  char: string;
  index: number;
};

export type WaveBounceCharsProps = {
  text: string;
  className?: string;
  /** Seconds added to idle delay per character index (wave phase). */
  staggerSeconds?: number;
  getCharKey?: (props: WaveBounceCharRenderProps) => string;
  renderChar: (props: WaveBounceCharRenderProps) => ReactNode;
};

const waveOuterClass =
  "inline-block origin-bottom will-change-transform animate-score-idle";

export function WaveBounceChars({
  text,
  className,
  staggerSeconds = 0.1,
  getCharKey,
  renderChar,
}: WaveBounceCharsProps) {
  const chars = [...text];

  return (
    <span className={className} aria-hidden>
      {chars.map((char, index) => {
        const waveStyle: CSSProperties = {
          animationDelay: `${index * staggerSeconds}s`,
        };
        const key = getCharKey?.({ char, index }) ?? `${index}-${char}`;

        return (
          <span key={key} className={waveOuterClass} style={waveStyle}>
            {renderChar({ char, index })}
          </span>
        );
      })}
    </span>
  );
}
