import { memo } from 'react';

import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { GameScene } from '@/ui/scenes/GameScene';

export const GameCanvas = memo(function GameCanvas() {
  return (
    <PixiStageCanvas>
      <GameScenePixiLayout>
        {(contentSize, chrome) => (
          <GameScene contentW={contentSize.w} contentH={contentSize.h} pouchLaunch={chrome.pouchLaunch} />
        )}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
