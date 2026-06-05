import type { ReactNode } from 'react';

export type MenuScreenLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function MenuScreenLayout({ children, footer, className }: MenuScreenLayoutProps) {
  const rootClass = ['flex h-full min-h-0 w-full flex-col bg-background', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer ? (
        <footer className="shrink-0 border-t-[length:var(--border-width-ui)] border-black bg-background px-4 py-4">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
