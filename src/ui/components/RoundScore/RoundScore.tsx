import { useEffect, useRef, useState } from "react";

import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import {
  buildRoundScoreAnimationFrames,
  formatRoundScore,
  STEP_INTERVAL_MS,
} from "@/ui/components/RoundScore/roundScoreAnimation";

export type RoundScoreProps = {
  score: number;
  /** Shorter padding for landscape top-row grid cell. */
  compact?: boolean;
  className?: string;
};

function formatRoundScoreDisplay(value: number): string {
  return formatRoundScore(value).toLocaleString("en-US");
}

export function RoundScore({ score, compact = false, className }: RoundScoreProps) {
  const targetScore = formatRoundScore(score);
  const [displayScore, setDisplayScore] = useState(targetScore);
  const displayScoreRef = useRef(targetScore);
  const animationTokenRef = useRef(0);

  displayScoreRef.current = displayScore;

  // Timed count-up/down: no discrete callback when `score` changes; interval steps only.
  useEffect(() => {
    if (targetScore === displayScoreRef.current) {
      return;
    }

    const token = animationTokenRef.current + 1;
    animationTokenRef.current = token;

    const from = displayScoreRef.current;
    const frames = buildRoundScoreAnimationFrames(from, targetScore);
    let frameIndex = 0;

    const applyFrame = () => {
      if (animationTokenRef.current !== token) {
        return;
      }

      const next = frames[frameIndex] ?? targetScore;
      displayScoreRef.current = next;
      setDisplayScore(next);
      frameIndex += 1;

      if (frameIndex < frames.length) {
        window.setTimeout(applyFrame, STEP_INTERVAL_MS);
      }
    };

    if (frames.length > 0) {
      applyFrame();
    }

    return () => {
      animationTokenRef.current += 1;
    };
  }, [targetScore]);

  const facePadding = compact
    ? "flex min-h-10 items-stretch gap-1 p-2"
    : "flex items-stretch gap-1 p-2 lg:p-2.5 xl:gap-2 xl:p-3";

  const faceLayout = compact
    ? `${facePadding} h-full min-h-0`
    : facePadding;

  return (
    <NeoSurface
      fullWidth
      className={["min-w-0 max-w-full", className].filter(Boolean).join(" ")}
      faceClassName={faceLayout}
    >
      <div
        className="flex h-full min-h-0 w-full min-w-0 items-stretch"
        aria-label={`Round score ${formatRoundScoreDisplay(displayScore)}`}
        aria-live="polite"
      >
        <div
          className={[
            "flex shrink-0 flex-col justify-center gap-0 font-body text-black xl:w-16 xl:gap-0.5 xl:px-1",
            compact ? "w-8 gap-0.5 px-0.5" : "w-10 gap-0.5 px-0.5 lg:w-12",
          ].join(" ")}
        >
          <span
            className={
              compact
                ? "text-[11px] leading-none"
                : "text-sm leading-none lg:text-base xl:text-xl"
            }
          >
            Round
          </span>
          <span
            className={
              compact
                ? "text-[11px] leading-none"
                : "text-sm leading-none lg:text-base xl:text-xl"
            }
          >
            score
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end px-1 py-0.5 lg:px-1 xl:px-3 xl:py-2">
          <span
            className={[
              "max-w-full truncate text-right font-header leading-none text-primary tabular-nums lg:text-2xl xl:text-4xl",
              compact ? "text-lg" : "text-xl",
            ].join(" ")}
          >
            {formatRoundScoreDisplay(displayScore)}
          </span>
        </div>
      </div>
    </NeoSurface>
  );
}
