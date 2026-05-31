import { WaveBounceChars } from "@/ui/components/WaveBounce/WaveBounceChars";

export type RoundInfoProps = {
  title: string;
  subtitle?: string;
  headerColor: string;
  bodyColor: string;
  iconSrc?: string;
  difficultyColor: string;
  targetScore: number;
  payoutAmount: number;
  className?: string;
};

function formatScore(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Math.max(0, Math.floor(value)).toLocaleString("en-US");
}

function formatPayout(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0";
  }
  return `$${Math.max(0, Math.floor(value))}`;
}

export function RoundInfo({
  title,
  subtitle,
  headerColor,
  bodyColor,
  iconSrc,
  difficultyColor,
  targetScore,
  payoutAmount,
  className,
}: RoundInfoProps) {
  const formattedScore = formatScore(targetScore);
  const formattedPayout = formatPayout(payoutAmount);

  const rootClassName = [
    "font-score w-72 max-w-sm overflow-hidden select-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={rootClassName}
      aria-label={`${title}. Score at least ${formattedScore}. Payout ${formattedPayout}.`}
    >
      <header
        className="flex rounded-xl  border-b-3 border-black/50 items-center justify-center px-3 py-2 mb-1"
        style={{ backgroundColor: headerColor }}
      >
        <WaveBounceChars
          text={title}
          className="text-center text-3xl leading-none font-bold tracking-wide text-white"
          renderChar={({ char }) => <span className="inline-block">{char}</span>}
        />
      </header>

      <div className="px-3 rounded-xl border-b-3 border-black/30 pt-2 pb-3" style={{ backgroundColor: bodyColor }}>
        {subtitle ? (
          <p className="mb-2 text-center text-xl leading-snug text-white">{subtitle}</p>
        ) : null}

        <div className="flex items-stretch gap-2">
          <div className="flex w-1/4 shrink-0 items-center justify-center">
            <div className="aspect-square w-full max-w-16 rounded-full border-2 border-black/50 bg-black/20">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt=""
                  className="size-full rounded-full object-cover"
                />
              ) : null}
            </div>
          </div>

          <div className="flex w-3/4 min-w-0 flex-col items-center justify-center gap-1 rounded-lg bg-ui-panel-well px-2 py-2.5">
            <p className="text-center text-xl leading-none text-white">Score at least</p>

            <div className="flex items-center justify-center gap-2">
              <span
                className="size-4 shrink-0 rounded-full border border-white/30"
                style={{ backgroundColor: difficultyColor }}
                aria-hidden
              />
              <p className="text-3xl leading-none font-bold text-red-500 tabular-nums">
                {formattedScore}
              </p>
            </div>

            <p className="text-center text-xl leading-none">
              <span className="text-white">payout </span>
              <span className="text-yellow-400">{formattedPayout}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
