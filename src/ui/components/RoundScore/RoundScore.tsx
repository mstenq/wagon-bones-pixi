import { useEffect, useRef, useState } from "react";

import {
  buildRoundScoreAnimationFrames,
  formatRoundScore,
  STEP_INTERVAL_MS,
} from "@/ui/components/RoundScore/roundScoreAnimation";

export type RoundScoreProps = {
  score: number;
  className?: string;
};

function formatRoundScoreDisplay(value: number): string {
  return formatRoundScore(value).toLocaleString("en-US");
}

export function RoundScore({ score, className }: RoundScoreProps) {
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

  const rootClassName = [
    "water-color-600x150 font-score flex w-full min-w-0 max-w-full items-stretch gap-1.5 overflow-hidden rounded-xl p-4 select-none md:gap-2 md:p-5",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      aria-label={`Round score ${formatRoundScoreDisplay(displayScore)}`}
      aria-live="polite"
    >
      <div className="flex w-12 shrink-0 flex-col font-body justify-center gap-0.5 px-1 text-taupe-900 md:w-16">
        <span className="text-lg leading-none md:text-xl">Round</span>
        <span className="text-lg leading-none md:text-xl">score</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end rounded-lg px-2 py-1 md:px-3 md:py-2">
        <span className="max-w-full truncate text-right text-3xl leading-none font-bold text-taupe-700 tabular-nums md:text-4xl">
          {formatRoundScoreDisplay(displayScore)}
        </span>
      </div>
    </div>
  );
}
