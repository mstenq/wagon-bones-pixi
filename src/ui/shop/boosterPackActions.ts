import { getPackDefById } from '@/game/BoosterPackSystem';
import { gameFacade } from '@/game/facade/gameFacade';
import { serializePackItem } from '@/game/SaveLoad';
import type { ActiveSceneKey } from '@/game/store/types';
import { getSceneState, sceneActions } from '@/game/store/sceneStore';

export function exitBoosterPackFlow(): void {
  const pack = getSceneState().boosterPack;
  if (!pack) {
    return;
  }

  const returnScene = pack.returnScene as ActiveSceneKey;
  const queued = [...pack.queuedPackDefIds];
  sceneActions.clearBoosterPack();

  if (queued.length > 0) {
    const nextId = queued[0]!;
    const packDef = getPackDefById(nextId);
    if (packDef) {
      const opened = gameFacade.pack.openPack(packDef);
      sceneActions.enterBoosterPack({
        packDefId: packDef.id,
        returnScene: pack.returnScene,
        queuedPackDefIds: queued.slice(1),
        contents: opened.contents.map(serializePackItem),
        picksRemaining: opened.picksRemaining,
        effectivePickCount: opened.effectivePickCount,
        usedCardIndices: [],
      });
      return;
    }
  }

  sceneActions.setActiveScene(returnScene);
}

export function skipBoosterPack(): void {
  gameFacade.pack.skipPack();
  exitBoosterPackFlow();
}
