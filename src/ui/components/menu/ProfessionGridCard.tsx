import type { ProfessionDef } from '@/data/professions';
import { beatIndicatorStyles } from '@/ui/theme/difficultyColors';
import { getHighestDifficultyBeaten } from '@/game/UserStats';

export type ProfessionGridCardProps = {
  profession: ProfessionDef;
  selected: boolean;
  onSelect: () => void;
};

export function ProfessionGridCard({ profession, selected, onSelect }: ProfessionGridCardProps) {
  const beaten = getHighestDifficultyBeaten(profession.id);
  const dot = beatIndicatorStyles(beaten);

  const faceClass = [
    'neo-surface-face neo-surface-face--interactive relative flex w-full cursor-pointer flex-col items-center gap-2 p-3 text-center',
    selected ? 'bg-primary-50 shadow-[inset_0_0_0_3px_var(--color-primary)]' : 'bg-white hover:bg-primary-50/60',
  ].join(' ');

  return (
    <span className="neo-surface-root w-full">
      <span className="neo-surface-shadow" aria-hidden="true" />
      <button type="button" className={faceClass} onClick={onSelect} aria-pressed={selected}>
        <span
          className="absolute right-3 top-3 size-3.5 shrink-0 rounded-full border-2"
          style={{
            backgroundColor: dot.fill ?? 'transparent',
            borderColor: dot.stroke,
          }}
          aria-hidden="true"
        />
        <div className="flex size-20 items-center justify-center rounded-lg border-2 border-black/15 bg-ui-panel/10">
          <span className="font-header text-3xl text-ui-panel-muted" aria-hidden="true">
            {profession.title.charAt(0)}
          </span>
        </div>
        <span className="font-header text-sm leading-tight text-black">{profession.title}</span>
      </button>
    </span>
  );
}
