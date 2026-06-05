import { useMemo } from 'react';

import { DiceRow } from '@/ui/components/DiceRow/DiceRow';
import { computeGameLayout } from '@/ui/layout/gameLayout';

export type GameSceneProps = {
  contentW: number;
  contentH: number;
};

export function GameScene({ contentW, contentH }: GameSceneProps) {
  const layout = useMemo(() => computeGameLayout(contentW, contentH), [contentH, contentW]);

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <DiceRow layout={layout.dice} />
    </pixiContainer>
  );
}
