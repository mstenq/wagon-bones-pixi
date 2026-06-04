import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import { formatRoundPayout, formatRoundScore } from "@/ui/components/RoundInfo/roundInfoFormat";

export type RoundInfoProps = {
  subtitle?: string;
  iconSrc?: string;
  difficultyColor: string;
  targetScore: number;
  payoutAmount: number;
  className?: string;
};

export function RoundInfo({
  subtitle,
  iconSrc,
  difficultyColor,
  targetScore,
  payoutAmount,
  className,
}: RoundInfoProps) {
  const formattedScore = formatRoundScore(targetScore);
  const formattedPayout = formatRoundPayout(payoutAmount);

  return (
    <div
      className={["h-full min-h-0 min-w-0", className].filter(Boolean).join(" ")}
      aria-label={`Score at least ${formattedScore}. Payout ${formattedPayout}.`}
    >
      <NeoSurface fullWidth className="h-full" faceClassName="flex h-full min-h-0 flex-col">
        {subtitle ? (
          <p className="mb-1.5 text-center text-lg leading-snug text-black md:mb-2 md:text-xl">
            {subtitle}
          </p>
        ) : null}

        <div className="flex flex-1 items-stretch gap-1.5 p-4 md:gap-2">
          <div className="flex w-1/4 shrink-0 items-center justify-center">
            <div className="aspect-square w-full max-w-12 rounded-full border-2 border-black bg-black/10 md:max-w-16">
              {iconSrc ? (
                <img src={iconSrc} alt="" className="size-full rounded-full object-cover" />
              ) : null}
            </div>
          </div>

          <div className="flex w-3/4 min-w-0 flex-col items-center justify-center gap-1 px-2 py-1.5 md:py-2.5">
            <p className="text-center text-lg leading-none text-black md:text-xl">Score at least</p>

            <div className="flex items-center justify-center gap-2">
              <span
                className="size-4 shrink-0 rounded-full border border-black/30"
                style={{ backgroundColor: difficultyColor }}
                aria-hidden
              />
              <p className="font-header text-2xl leading-none text-primary tabular-nums md:text-3xl">
                {formattedScore}
              </p>
            </div>

            <p className="text-center text-lg leading-none md:text-xl">
              <span className="text-black">payout </span>
              <span className="font-header text-primary">{formattedPayout}</span>
            </p>
          </div>
        </div>
      </NeoSurface>
    </div>
  );
}
