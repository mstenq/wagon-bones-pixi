import { useCallback, useRef } from 'react';

import { useDiceRowController } from '@/ui/components/DiceRow/DiceRowController';
import { orderKey, selectDisplayOrder } from '@/ui/components/DiceRow/diceRowOrder';
import { gameFacade } from '@/game/facade';
import type { PhaseState } from '@/game/types';

export type DiceRowPhaseResetKind = 'none' | 'hand' | 'roll-entry';

export type UseDiceRowPhaseStateOptions = {
  handDiceIds: readonly string[];
  phase: PhaseState | null;
  scoredIds?: readonly string[];
};

export function useDiceRowPhaseState({ handDiceIds, phase, scoredIds = [] }: UseDiceRowPhaseStateOptions) {
  const controller = useDiceRowController();

  const prevHandKeyRef = useRef(orderKey(handDiceIds));
  const prevPhaseRef = useRef<PhaseState | null>(phase);
  const pendingExternalResetRef = useRef<DiceRowPhaseResetKind>('none');
  const handDiceIdsRef = useRef(handDiceIds);
  handDiceIdsRef.current = handDiceIds;

  const handKey = orderKey(handDiceIds);
  const visualOrder = controller.visualOrder;

  if (visualOrder.length === 0 && handDiceIds.length > 0 && !controller.isDeferHandReset()) {
    pendingExternalResetRef.current = 'hand';
  }

  if (handKey !== prevHandKeyRef.current) {
    prevHandKeyRef.current = handKey;
    controller.clearRerollLocks();
    if (!controller.isDeferHandReset()) {
      pendingExternalResetRef.current = 'hand';
    }
  }

  if (prevPhaseRef.current === 'SELECT' && phase === 'ROLL') {
    controller.clearRerollLocks();
    const snapshot = visualOrder.length > 0 ? visualOrder : handDiceIds;
    if (orderKey(visualOrder) !== orderKey(snapshot)) {
      controller.setVisualOrder([...snapshot]);
    }
    pendingExternalResetRef.current = 'roll-entry';
  }

  prevPhaseRef.current = phase;

  const displayOrder = selectDisplayOrder(visualOrder, handDiceIds, { phase, scoredIds });

  const flushExternalReset = useCallback(() => {
    const externalReset = pendingExternalResetRef.current;
    if (externalReset === 'none') {
      return;
    }

    pendingExternalResetRef.current = 'none';
    controller.clearRerollLocks();
    gameFacade.round.setSelectedForScoreDice([]);
    gameFacade.round.clearHandPreviewOverlay();

    if (externalReset === 'hand' && !controller.isDeferHandReset()) {
      controller.setVisualOrder([...handDiceIdsRef.current]);
    }
  }, [controller]);

  return {
    displayOrder,
    flushExternalReset,
  };
}
