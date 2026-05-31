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
  /** Render only the header or body — used by GameInfo landscape grid. */
  segment?: "full" | "header" | "body";
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
  segment = "full",
  className,
}: RoundInfoProps) {
  const formattedScore = formatScore(targetScore);
  const formattedPayout = formatPayout(payoutAmount);

  const header = (
    <header
      className="flex h-full items-center justify-center rounded-xl border-b-3 border-black/50 px-2 py-1 md:px-3 md:py-2"
      style={{ backgroundColor: headerColor }}
    >
      <WaveBounceChars
        text={title}
        className="text-center text-2xl leading-none font-bold tracking-wide text-white md:text-3xl"
        renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
      />
    </header>
  );

  const body = (
    <div
      className="flex h-full flex-col rounded-xl border-b-3 border-black/30 px-2 pt-1.5 pb-2 md:px-3 md:pt-2 md:pb-3"
      style={{ backgroundColor: bodyColor }}
    >
      {subtitle ? (
        <p className="mb-1.5 text-center text-lg leading-snug text-white md:mb-2 md:text-xl">
          {subtitle}
        </p>
      ) : null}

      <div className="flex flex-1 items-stretch gap-1.5 md:gap-2">
        <div className="flex w-1/4 shrink-0 items-center justify-center">
          <div className="aspect-square w-full max-w-12 rounded-full border-2 border-black/50 bg-black/20 md:max-w-16">
            {iconSrc ? (
              <img src={iconSrc} alt="" className="size-full rounded-full object-cover" />
            ) : null}
          </div>
        </div>

        <div className="flex w-3/4 min-w-0 flex-col items-center justify-center gap-1 rounded-lg bg-ui-panel-well px-2 py-1.5 md:py-2.5">
          <p className="text-center text-lg leading-none text-white md:text-xl">
            Score at least
          </p>

          <div className="flex items-center justify-center gap-2">
            <span
              className="size-4 shrink-0 rounded-full border border-white/30"
              style={{ backgroundColor: difficultyColor }}
              aria-hidden
            />
            <p className="text-2xl leading-none text-red-500 tabular-nums md:text-3xl">
              {formattedScore}
            </p>
          </div>

          <p className="text-center text-lg leading-none md:text-xl">
            <span className="text-white">payout </span>
            <span className="text-yellow-400">{formattedPayout}</span>
          </p>
        </div>
      </div>
    </div>
  );

  if (segment === "header") {
    const headerClassName = ["font-score h-full min-h-0 w-full select-none", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={headerClassName} aria-label={title}>
        {header}
      </div>
    );
  }

  if (segment === "body") {
    const bodyClassName = ["font-score h-full min-h-0 w-full select-none", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={bodyClassName}
        aria-label={`Score at least ${formattedScore}. Payout ${formattedPayout}.`}
      >
        {body}
      </div>
    );
  }

  const rootClassName = [
    "font-score w-full min-w-0 overflow-hidden select-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={rootClassName}
      aria-label={`${title}. Score at least ${formattedScore}. Payout ${formattedPayout}.`}
    >
      <div className="mb-1 h-auto">{header}</div>
      {body}
    </article>
  );
}
