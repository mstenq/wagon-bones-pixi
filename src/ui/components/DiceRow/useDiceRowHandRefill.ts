import { useCallback, useState } from 'react';

import { useDiceRowController, type HandRefillFlyInRequest } from '@/ui/components/DiceRow/DiceRowController';
import { layoutForDiceCount } from '@/ui/components/DiceRow/diceRowDisplay';
import { partitionHandRefill } from '@/ui/components/DiceRow/diceRowOrder';
import type { HandFlyInOptions, ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';

export type PouchLaunchPoint = {
  x: number;
  y: number;
};

export type UseDiceRowHandRefillOptions = {
  baseLayout: ReorderableRowLayout;
  pouchLaunch: PouchLaunchPoint | null;
  beginHandFlyIn: (options: HandFlyInOptions<string>) => void;
  applyInstantOrder: (order: readonly string[]) => void;
};

/**
 * Post-score hand refill fly-in (Phaser: `enterDrawPhase(true, carryover)`).
 *
 * Intentionally does **not** watch round phase — that raced ahead of score playback
 * and fought `visualOrder` updates. Fly-in must be triggered by the Pixi playback
 * runner after the `score` command completes and `endDay` has refreshed `handDiceIds`.
 *
 * @see src/ui/playback/gameSceneRunner.ts
 */
export function useDiceRowHandRefill({
  baseLayout,
  pouchLaunch,
  beginHandFlyIn,
  applyInstantOrder,
}: UseDiceRowHandRefillOptions) {
  const controller = useDiceRowController();
  const [isHandRefillFlying, setIsHandRefillFlying] = useState(false);

  const runHandRefillFlyIn = useCallback(
    (request: HandRefillFlyInRequest) => {
      const nextHand = [...request.nextHandIds];
      const prevHand = request.previousRowIds;
      const { newIds } = partitionHandRefill(prevHand, nextHand);

      const finish = () => {
        controller.setVisualOrder(nextHand);
        controller.setDeferHandReset(false);
        request.onComplete?.();
      };

      controller.setDeferHandReset(true);

      if (newIds.length > 0 && pouchLaunch) {
        setIsHandRefillFlying(true);
        beginHandFlyIn({
          order: nextHand,
          newItemIds: newIds,
          launchPoint: pouchLaunch,
          targetLayout: layoutForDiceCount(baseLayout, nextHand.length),
          onComplete: () => {
            setIsHandRefillFlying(false);
            finish();
          },
        });
        return;
      }

      applyInstantOrder(nextHand);
      finish();
    },
    [applyInstantOrder, baseLayout, beginHandFlyIn, controller, pouchLaunch],
  );

  return {
    isHandRefillFlying,
    runHandRefillFlyIn,
  };
}
