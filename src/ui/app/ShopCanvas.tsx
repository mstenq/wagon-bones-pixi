import { memo } from 'react';

import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { ShopScene } from '@/ui/scenes/ShopScene';

export const ShopCanvas = memo(function ShopCanvas() {
  return (
    <PixiStageCanvas>
      <GameScenePixiLayout>
        {(contentSize) => <ShopScene contentW={contentSize.w} contentH={contentSize.h} />}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
