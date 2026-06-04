import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";
import { WaveBounceChars } from "@/ui/components/WaveBounce/WaveBounceChars";

export type HandInfoProps = {
  handName: string;
  level: number;
  /** Base / running chip value (blue score box). */
  chips: number;
  /** Base / running multiplier (red score box). */
  mult: number;
  /** 0–1 flame strength on both score boxes. */
  flameIntensity?: number;
  className?: string;
};

function formatLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 1;
  }
  return Math.max(1, Math.floor(level));
}

export function HandInfo({
  handName,
  level,
  chips,
  mult,
  flameIntensity = 0,
  className,
}: HandInfoProps) {
  const displayLevel = formatLevel(level);

  return (
    <NeoSurface
      fullWidth
      className={className}
      faceClassName="flex h-full min-h-0 flex-col justify-between gap-2 overflow-visible p-4 md:gap-3 md:p-5"
    >
      <article
        className="flex min-h-0 flex-1 flex-col justify-between gap-2 md:gap-3"
        aria-label={`${handName} level ${displayLevel}, ${chips} by ${mult}`}
      >
        <div className="flex shrink-0 items-baseline justify-center gap-2">
          <WaveBounceChars
            text={handName}
            className="min-w-0 text-xl leading-none font-header tracking-wide text-black md:text-2xl"
            renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
          />
          <span className="shrink-0 text-base leading-none font-body text-black md:text-lg">
            lvl.{displayLevel}
          </span>
        </div>

        <div className="flex w-full min-h-0 shrink-0 items-center gap-2 overflow-visible md:gap-2.5">
          <ScoreBox
            fill
            variant="points"
            value={chips}
            flameIntensity={flameIntensity}
          />
          <span
            className="shrink-0 text-xl leading-none font-header text-black md:text-2xl"
            aria-hidden
          >
            x
          </span>
          <ScoreBox fill variant="mult" value={mult} flameIntensity={flameIntensity} />
        </div>
      </article>
    </NeoSurface>
  );
}
