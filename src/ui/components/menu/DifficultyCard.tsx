import type { DifficultyDef } from '@/game/types';
import { difficultyLevelToCss } from '@/ui/theme/difficultyColors';

export type DifficultyCardProps = {
  difficulty: DifficultyDef;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
};

export function DifficultyCard({ difficulty, selected, locked, onSelect }: DifficultyCardProps) {
  const accent = difficultyLevelToCss(difficulty.level);

  const faceClass = [
    'neo-surface-face flex h-full min-h-72 w-full flex-col gap-2 p-4 text-left',
    locked
      ? 'cursor-not-allowed bg-ui-disabled/30 opacity-70'
      : 'neo-surface-face--interactive cursor-pointer bg-white',
    !locked && selected ? 'bg-primary-50 shadow-[inset_0_0_0_3px_var(--color-primary)]' : '',
    !locked && !selected ? 'hover:bg-primary-50/60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div
        className="mx-auto flex size-14 shrink-0 items-center justify-center rounded-full border-3 border-black font-header text-lg"
        style={{ backgroundColor: accent }}
      >
        {difficulty.level}
      </div>
      <h3 className="font-header m-0 text-center text-base text-black">
        {difficulty.level}. {difficulty.name}
      </h3>
      <p className="font-body m-0 text-center text-sm text-ui-panel-muted">{difficulty.description}</p>
      <ul className="font-body m-0 mt-1 flex list-none flex-col gap-1 p-0 text-sm">
        {difficulty.effects.length === 0 ? (
          <li className="text-ui-panel-muted">No extra penalties</li>
        ) : (
          difficulty.effects.map((effect, i) => (
            <li key={effect} className={i === difficulty.effects.length - 1 ? 'text-black' : 'text-ui-panel-muted'}>
              • {effect}
            </li>
          ))
        )}
      </ul>
      {locked ? <p className="font-header m-0 mt-auto text-center text-sm text-ui-panel-muted">Locked</p> : null}
    </>
  );

  if (locked) {
    return (
      <span className="neo-surface-root h-full w-full">
        <span className="neo-surface-shadow block" aria-hidden="true" />
        <div className={faceClass}>{content}</div>
      </span>
    );
  }

  return (
    <span className="neo-surface-root h-full w-full">
      <span className="neo-surface-shadow block" aria-hidden="true" />
      <button
        type="button"
        className={faceClass}
        style={selected ? { outlineColor: accent } : undefined}
        onClick={onSelect}
        aria-pressed={selected}
      >
        {content}
      </button>
    </span>
  );
}
