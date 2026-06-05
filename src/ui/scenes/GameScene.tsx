import { useMemo } from 'react';

import { DiceRow } from '@/ui/components/DiceRow/DiceRow';
import type { PouchLaunchPoint } from '@/ui/components/DiceRow/useDiceRowHandRefill';
import { computeGameLayout } from '@/ui/layout/gameLayout';

export type GameSceneProps = {
  contentW: number;
  contentH: number;
  pouchLaunch?: PouchLaunchPoint | null;
};

export function GameScene({ contentW, contentH, pouchLaunch = null }: GameSceneProps) {
  const layout = useMemo(() => computeGameLayout(contentW, contentH), [contentH, contentW]);

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <DiceRow layout={layout.dice} pouchLaunch={pouchLaunch} />
    </pixiContainer>
  );
}
