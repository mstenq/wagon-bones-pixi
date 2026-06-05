import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import { formatRoundPayout, formatRoundScore } from "@/ui/components/RoundInfo/roundInfoFormat";

export type RoundInfoProps = {
  subtitle?: string;
  iconSrc?: string;
  difficultyColor: string;
  targetScore: number;
  payoutAmount: number;
  compact?: boolean;
  className?: string;
};

export function RoundInfo({
  subtitle,
  iconSrc,
  difficultyColor,
  targetScore,
  payoutAmount,
  compact = false,
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
          <p
            className={[
              "-mb-2 text-center leading-snug text-black xl:text-xl pt-2 px-2 ",
              compact ? "text-[12px]" : "text-sm lg:text-base xl:text-xl",
            ].join(" ")}
          >
            {subtitle}
          </p>
        ) : null}

        <div
          className={[
            "flex flex-1 items-stretch",
            compact ? "gap-1 p-1.5" : "gap-1 p-2 lg:gap-1.5 lg:p-3 xl:gap-2 xl:p-4",
          ].join(" ")}
        >
          <div
            className={[
              "flex shrink-0 items-center justify-center",
              compact ? "w-1/5" : "w-1/4",
            ].join(" ")}
          >
            <div
              className={[
                "aspect-square w-full rounded-full border-2 border-black bg-black/10",
                compact ? "max-w-5" : "max-w-8 lg:max-w-10 xl:max-w-16",
              ].join(" ")}
            >
              {iconSrc ? (
                <img src={iconSrc} alt="" className="size-full rounded-full object-cover" />
              ) : null}
            </div>
          </div>

          <div
            className={[
              "flex min-w-0 flex-col items-center justify-center",
              compact
                ? "w-4/5 gap-0.5 px-0.5 py-1"
                : "w-3/4 gap-0.5 px-1 py-1 lg:gap-1 lg:px-1.5 lg:py-1.5 xl:px-2 xl:py-2.5",
            ].join(" ")}
          >
            <p
              className={[
                "text-center leading-none text-black xl:text-xl",
                compact ? "text-[10px]" : "text-sm lg:text-base xl:text-xl",
              ].join(" ")}
            >
              Score at least
            </p>

            <div className="flex items-center justify-center gap-1 xl:gap-2">
              <span
                className={[
                  "shrink-0 rounded-full border border-black/30",
                  compact ? "size-2" : "size-3 lg:size-4 xl:size-4",
                ].join(" ")}
                style={{ backgroundColor: difficultyColor }}
                aria-hidden
              />
              <p
                className={[
                  "font-header leading-none text-primary tabular-nums xl:text-3xl",
                  compact ? "text-base" : "text-xl lg:text-2xl xl:text-3xl",
                ].join(" ")}
              >
                {formattedScore}
              </p>
            </div>

            <p
              className={[
                "text-center leading-none xl:text-xl",
                compact ? "text-[10px]" : "text-sm lg:text-base xl:text-xl",
              ].join(" ")}
            >
              <span className="text-black">payout </span>
              <span className="font-header text-primary">{formattedPayout}</span>
            </p>
          </div>
        </div>
      </NeoSurface>
    </div>
  );
}
