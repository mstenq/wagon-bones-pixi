import { memo } from 'react';

import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { PayoutScene } from '@/ui/scenes/PayoutScene';

export const PayoutCanvas = memo(function PayoutCanvas() {
  return (
    <PixiStageCanvas>
      <GameScenePixiLayout>
        {(contentSize) => <PayoutScene contentW={contentSize.w} contentH={contentSize.h} />}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
