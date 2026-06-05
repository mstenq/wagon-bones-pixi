import type { ReactNode } from 'react';

import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';

export type InfoBoxProps = {
  label: string;
  children: ReactNode;
  /** Tighter padding and type for narrow portrait sidebar cells. */
  compact?: boolean;
  className?: string;
};

const labelClass =
  'p-0.5 text-center text-[11px] leading-none font-body text-ui-panel-muted md:text-xs lg:p-0.5 lg:text-sm xl:p-1 xl:text-xl';

const labelCompactClass = 'px-0.5 py-0 text-center text-[9px] leading-none font-body text-ui-panel-muted';

const bodyClass = 'mx-1 mb-1 flex min-h-6 flex-1 items-center justify-center lg:min-h-8 xl:mx-2 xl:mb-2 xl:min-h-12';

const bodyCompactClass = 'mx-0.5 mb-0.5 flex min-h-4 flex-1 items-center justify-center';

export function InfoBox({ label, children, compact = false, className }: InfoBoxProps) {
  return (
    <NeoSurface
      fullWidth
      className={['min-w-0 flex-1', className].filter(Boolean).join(' ')}
      faceClassName={['flex h-full min-h-0 flex-col', compact ? 'py-0.5' : 'py-1 lg:py-1.5 xl:py-2'].join(' ')}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <span className={compact ? labelCompactClass : labelClass}>{label}</span>
        <div className={compact ? bodyCompactClass : bodyClass}>{children}</div>
      </div>
    </NeoSurface>
  );
}

const valueTextClass = 'text-2xl leading-none tabular-nums lg:text-3xl xl:text-5xl';
const valueCompactClass = 'text-base leading-none tabular-nums';

export type InfoBoxRockValueProps = {
  value: number | string;
  compact?: boolean;
};

/** Colored value with subtle back-and-forth rock via `animate-info-rock`. */
export function InfoBoxRockValue({ value, compact = false }: InfoBoxRockValueProps) {
  return (
    <span
      className={[
        'inline-block origin-center animate-info-rock font-header',
        compact ? valueCompactClass : valueTextClass,
      ].join(' ')}
    >
      {value}
    </span>
  );
}

export type InfoBoxLegValueProps = {
  current: number;
  total: number;
  compact?: boolean;
};

/** Leg tracker — current only below md; full `current / total` at md+. */
export function InfoBoxLegValue({ current, total, compact = false }: InfoBoxLegValueProps) {
  const valueClass = compact ? valueCompactClass : valueTextClass;

  return (
    <div className="flex items-center justify-center leading-none" aria-label={`Leg ${current} of ${total}`}>
      <span className={[valueClass, 'font-header text-amber-500'].join(' ')}>{current}</span>
      <span className="hidden text-lg font-body text-ui-panel-muted tabular-nums xl:inline xl:text-2xl">/ {total}</span>
    </div>
  );
}
