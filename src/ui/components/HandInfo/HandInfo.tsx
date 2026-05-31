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

  const rootClassName = [
    "font-score flex w-72 max-w-full flex-col gap-3 rounded-xl bg-ui-panel p-3 select-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={rootClassName}
      aria-label={`${handName} level ${displayLevel}, ${chips} by ${mult}`}
    >
      <div className="flex items-baseline justify-center gap-2">
        <WaveBounceChars
          text={handName}
          className="min-w-0 text-2xl leading-none font-bold tracking-wide text-white"
          renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
        />
        <span className="shrink-0 text-lg leading-none text-white">lvl.{displayLevel}</span>
      </div>

      <div className="flex w-full items-center gap-2.5">
        <ScoreBox
          fill
          variant="points"
          value={chips}
          flameIntensity={flameIntensity}
        />
        <span
          className="shrink-0 text-2xl leading-none font-bold text-red-500"
          aria-hidden
        >
          x
        </span>
        <ScoreBox fill variant="mult" value={mult} flameIntensity={flameIntensity} />
      </div>
    </article>
  );
}
