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
    ? "flex items-stretch gap-1 p-2 xl:gap-2 xl:p-3.5"
    : "flex items-stretch gap-1 p-2.5 xl:gap-2 xl:p-5";

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
        <div className="flex w-10 shrink-0 flex-col justify-center gap-0.5 px-0.5 font-body text-black xl:w-16 xl:px-1">
          <span className="text-sm leading-none xl:text-xl">Round</span>
          <span className="text-sm leading-none xl:text-xl">score</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end px-1 py-0.5 xl:px-3 xl:py-2">
          <span className="max-w-full truncate text-right font-header text-xl leading-none text-primary tabular-nums xl:text-4xl">
            {formatRoundScoreDisplay(displayScore)}
          </span>
        </div>
      </div>
    </NeoSurface>
  );
}
