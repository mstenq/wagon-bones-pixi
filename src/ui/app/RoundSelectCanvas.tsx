import { memo } from 'react';

import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { RoundSelectScene } from '@/ui/scenes/RoundSelectScene';

export const RoundSelectCanvas = memo(function RoundSelectCanvas() {
  return (
    <PixiStageCanvas>
      <GameScenePixiLayout>
        {(contentSize) => (
          <RoundSelectScene contentW={contentSize.w} contentH={contentSize.h} />
        )}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
