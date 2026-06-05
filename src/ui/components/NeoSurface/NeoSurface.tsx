import type { ReactNode } from 'react';

export type NeoSurfaceFaceTone = 'panel' | 'primary' | 'none';

export type NeoSurfaceProps = {
  children: ReactNode;
  /** Layout classes on the outer shell (flex, h-full, etc.) — never overrides neo grid. */
  className?: string;
  faceClassName?: string;
  /** Face fill before custom `faceClassName` utilities. */
  faceTone?: NeoSurfaceFaceTone;
  fullWidth?: boolean;
};

function faceToneClass(tone: NeoSurfaceFaceTone): string {
  if (tone === 'primary') {
    return 'bg-primary';
  }
  if (tone === 'panel') {
    return 'bg-ui-panel text-ui-panel-text';
  }
  return '';
}

/** Panel surfaces — shadow hidden below xl where layouts pack tightly. */
const panelShadowClass = 'neo-surface-shadow hidden xl:block';

export function NeoSurface({
  children,
  className,
  faceClassName,
  faceTone = 'panel',
  fullWidth = false,
}: NeoSurfaceProps) {
  const shellClassName = ['min-h-0 min-w-0', fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');

  const neoRootClassName = ['neo-surface-root w-full min-h-0', className?.includes('h-full') ? 'h-full' : '']
    .filter(Boolean)
    .join(' ');

  const faceClasses = ['neo-surface-face', faceToneClass(faceTone), faceClassName].filter(Boolean).join(' ');

  return (
    <div className={shellClassName}>
      <div className={neoRootClassName}>
        <span className={panelShadowClass} aria-hidden="true" />
        <div className={faceClasses}>{children}</div>
      </div>
    </div>
  );
}

export type NeoSurfacePrimaryHeaderProps = {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  fullWidth?: boolean;
};

/** Panel with primary-colored header band and white neo body inside one face. */
export function NeoSurfacePrimaryHeader({
  header,
  children,
  className,
  headerClassName,
  bodyClassName,
  fullWidth = false,
}: NeoSurfacePrimaryHeaderProps) {
  const shellClassName = ['min-h-0 min-w-0', fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');

  const neoRootClassName = ['neo-surface-root w-full min-h-0', className?.includes('h-full') ? 'h-full' : '']
    .filter(Boolean)
    .join(' ');

  const headerClasses = ['bg-primary px-4 py-4 text-white font-header md:px-5', headerClassName]
    .filter(Boolean)
    .join(' ');

  const bodyClasses = ['font-body', bodyClassName].filter(Boolean).join(' ');

  return (
    <div className={shellClassName}>
      <div className={neoRootClassName}>
        <span className={panelShadowClass} aria-hidden="true" />
        <div className="neo-surface-face flex min-h-0 w-full flex-col overflow-hidden bg-primary-50">
          <div className={headerClasses}>{header}</div>
          <div className={bodyClasses}>{children}</div>
        </div>
      </div>
    </div>
  );
}
