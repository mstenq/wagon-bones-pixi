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
    "font-score flex w-72 max-w-full items-stretch gap-2 overflow-hidden rounded-xl bg-ui-panel p-2 select-none",
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
      <div className="flex px-1  w-16 shrink-0 flex-col justify-center gap-0.5 text-white">
        <span className="text-xl leading-none">Round</span>
        <span className="text-xl leading-none">score</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end rounded-lg bg-ui-panel-inset px-3 py-2">
        <span className="max-w-full truncate text-right text-4xl leading-none font-bold text-white tabular-nums">
          {formatRoundScoreDisplay(displayScore)}
        </span>
      </div>
    </div>
  );
}
