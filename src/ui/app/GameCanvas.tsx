import { memo, useCallback } from 'react';

import type { ConsumableDef } from '@/game/ConsumablesSystem';
import { useGameRoundStore } from '@/game/store/reactHooks';
import { selectRolledDice } from '@/game/store/selectors/roundSelectors';
import { PixiStageCanvas } from '@/ui/app/PixiStageCanvas';
import { GameScenePixiLayout } from '@/ui/layout/GameScenePixiLayout';
import { GameScene } from '@/ui/scenes/GameScene';

export const GameCanvas = memo(function GameCanvas() {
  const round = useGameRoundStore((state) => state);

  const canUseConsumable = useCallback(
    (def: ConsumableDef) => {
      if (def.id === 'raid') {
        return selectRolledDice(round).length > 0;
      }
      return true;
    },
    [round],
  );

  return (
    <PixiStageCanvas>
      <GameScenePixiLayout canUseConsumable={canUseConsumable}>
        {(contentSize, chrome) => (
          <GameScene contentW={contentSize.w} contentH={contentSize.h} pouchLaunch={chrome.pouchLaunch} />
        )}
      </GameScenePixiLayout>
    </PixiStageCanvas>
  );
});
