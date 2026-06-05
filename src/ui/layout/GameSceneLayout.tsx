/**
 * DOM shell for in-run screens: sidebar column + main playfield.
 * Shared Pixi chrome (equipment/consumable bars, dice pouch, tag stack) lives in
 * `GameScenePixiLayout` with placement math in `gameScenePixiLayout.ts`.
 */
import type { ReactNode } from 'react';

export type GameSceneLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
};

export function GameSceneLayout({ sidebar, children, className }: GameSceneLayoutProps) {
  const rootClassName = ['box-border flex h-full min-h-0 w-full flex-col landscape:flex-row', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <aside className="w-full shrink-0 bg-ui-dark-background landscape:max-h-none landscape:min-w-0 landscape:w-[clamp(11.5rem,20vw,15rem)] lg:landscape:w-[clamp(16rem,22vw,18rem)] xl:landscape:w-96">
        {sidebar}
      </aside>
      <main className="relative min-h-0 min-w-0 flex-1">{children}</main>
    </div>
  );
}
