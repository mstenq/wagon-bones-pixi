import type { CSSProperties, ReactNode } from "react";

import { WAVE_IDLE_STAGGER_S } from "@/ui/components/WaveBounce/waveBounce";

export type WaveBounceCharRenderProps = {
  char: string;
  /** Safe to render inside `inline-block` per-char wrappers (spaces → nbsp). */
  displayChar: string;
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

/** Spaces collapse inside per-char `inline-block` wrappers — use nbsp for display. */
function waveDisplayChar(char: string): string {
  return char === " " ? "\u00A0" : char;
}

export function WaveBounceChars({
  text,
  className,
  staggerSeconds = WAVE_IDLE_STAGGER_S,
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
        const key = getCharKey?.({ char, displayChar: waveDisplayChar(char), index }) ?? `${index}-${char}`;

        return (
          <span key={key} className={waveOuterClass} style={waveStyle}>
            {renderChar({ char, displayChar: waveDisplayChar(char), index })}
          </span>
        );
      })}
    </span>
  );
}
