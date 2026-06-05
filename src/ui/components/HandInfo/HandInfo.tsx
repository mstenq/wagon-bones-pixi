import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';
import { ScoreBox } from '@/ui/components/ScoreBox/ScoreBox';
import { WaveBounceChars } from '@/ui/components/WaveBounce/WaveBounceChars';

export type HandInfoProps = {
  handName: string;
  level: number;
  /** Base / running chip value (blue score box). */
  chips: number;
  /** Base / running multiplier (red score box). */
  mult: number;
  /** 0–1 flame strength on both score boxes. */
  flameIntensity?: number;
  compact?: boolean;
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
  compact = false,
  className,
}: HandInfoProps) {
  const displayLevel = formatLevel(level);

  const faceClassName = compact
    ? 'flex min-h-[4.5rem] flex-col justify-between gap-1.5 overflow-visible p-2'
    : 'flex h-full min-h-0 flex-col justify-between gap-1 overflow-visible p-2 lg:gap-1.5 lg:p-3 xl:gap-3 xl:p-5';

  const articleGapClass = compact
    ? 'flex min-h-0 flex-1 flex-col justify-between gap-1.5'
    : 'flex min-h-0 flex-1 flex-col justify-between gap-1 lg:gap-1.5 xl:gap-3';

  const handNameClass = compact
    ? 'min-w-0 text-sm leading-none font-header tracking-wide text-ui-panel-text'
    : 'min-w-0 text-base leading-none font-header tracking-wide text-ui-panel-text lg:text-lg xl:text-2xl';

  const levelClass = compact
    ? 'shrink-0 text-xs leading-none font-body text-ui-panel-muted'
    : 'shrink-0 text-sm leading-none font-body text-ui-panel-muted lg:text-base xl:text-lg';

  const multSymbolClass = compact
    ? 'shrink-0 text-sm leading-none font-header text-ui-panel-text'
    : 'shrink-0 text-lg leading-none font-header text-ui-panel-text lg:text-xl xl:text-2xl';

  return (
    <NeoSurface fullWidth className={className} faceClassName={faceClassName}>
      <article className={articleGapClass} aria-label={`${handName} level ${displayLevel}, ${chips} by ${mult}`}>
        <div className="flex shrink-0 items-baseline justify-center gap-1 xl:gap-2">
          <WaveBounceChars
            text={handName}
            className={handNameClass}
            renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
          />
          <span className={levelClass}>lvl.{displayLevel}</span>
        </div>

        <div
          className={[
            'flex w-full min-h-0 shrink-0 items-center overflow-visible xl:gap-2.5',
            compact ? 'gap-1' : 'gap-0.5',
          ].join(' ')}
        >
          <ScoreBox fill compact={compact} variant="points" value={chips} flameIntensity={flameIntensity} />
          <span className={multSymbolClass} aria-hidden>
            x
          </span>
          <ScoreBox fill compact={compact} variant="mult" value={mult} flameIntensity={flameIntensity} />
        </div>
      </article>
    </NeoSurface>
  );
}
