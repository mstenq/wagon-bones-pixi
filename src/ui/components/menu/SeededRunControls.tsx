export type SeededRunControlsProps = {
  enabled: boolean;
  seed: string;
  onEnabledChange: (enabled: boolean) => void;
  onSeedChange: (seed: string) => void;
};

export function SeededRunControls({ enabled, seed, onEnabledChange, onSeedChange }: SeededRunControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <label className="font-body flex cursor-pointer items-center gap-2 text-base text-black">
        <span className="neo-surface-root inline-flex">
          <span className="neo-surface-shadow size-5.5" aria-hidden="true" />
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="neo-surface-face size-5.5 cursor-pointer accent-primary"
          />
        </span>
        Seeded run?
      </label>
      {enabled ? (
        <label className="font-body flex items-center gap-2 text-sm text-ui-panel-muted">
          Seed
          <input
            type="text"
            value={seed}
            onChange={(e) => onSeedChange(e.target.value)}
            placeholder="Type a run seed"
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            className="neo-surface-face font-body min-w-48 rounded-[var(--radius-ui)] border-0 bg-white px-3 py-2 text-sm text-black shadow-[inset_0_0_0_var(--border-width-ui)_black]"
          />
        </label>
      ) : null}
    </div>
  );
}
