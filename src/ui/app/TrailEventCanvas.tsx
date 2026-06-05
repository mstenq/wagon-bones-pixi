import { memo } from 'react';

import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { TrailEventScene } from '@/ui/scenes/TrailEventScene';

export const TrailEventCanvas = memo(function TrailEventCanvas() {
  return (
    <PixiStageCanvas>
      <GameScenePixiLayout>
        {(contentSize) => <TrailEventScene contentW={contentSize.w} contentH={contentSize.h} />}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
