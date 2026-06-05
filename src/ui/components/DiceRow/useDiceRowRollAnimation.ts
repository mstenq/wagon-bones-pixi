import { useCallback, useRef, useState, type RefObject } from 'react';

import type { DieHandle } from '@/ui/components/Dice/Die';
import { buildRollEnhancements, buildRollFinalValues } from '@/ui/components/DiceRow/diceRowDisplay';
import { orderKey } from '@/ui/components/DiceRow/diceRowOrder';
import { createRollSession, stepRollAnimation } from '@/ui/components/DiceRow/diceRollAnimation';
import { playSfx } from '@/ui/audio/sfx';
import type { ApplyOrderOptions } from '@/ui/interaction/useReorderableRow';
import type { RoundRuntimeState, RunState } from '@/game/store/types';
import type { PhaseState } from '@/game/types';
import { dieValueInRound, resolveDiceByIds } from '@/game/store/roundResolve';
import { getRunState } from '@/game/store/runStore';
import { getRoundState } from '@/game/store/roundStore';

const POST_ROLL_SORT_DELAY_MS = 200;

export type UseDiceRowRollAnimationOptions = {
  handDiceIds: readonly string[];
  round: RoundRuntimeState | null;
  run: RunState | null;
  phase: PhaseState | null;
  displayOrder: readonly string[];
  dieRefs: RefObject<Map<string, DieHandle | null>>;
  applySortedOrder: (order: readonly string[], options?: ApplyOrderOptions) => void;
  applyBossLocksAndSort: () => void;
};

export function useDiceRowRollAnimation({
  handDiceIds,
  round,
  run,
  phase,
  displayOrder,
  dieRefs,
  applySortedOrder,
  applyBossLocksAndSort,
}: UseDiceRowRollAnimationOptions) {
  const [isRolling, setIsRolling] = useState(false);
  const [isPostRollDelay, setIsPostRollDelay] = useState(false);

  const rollSessionRef = useRef<ReturnType<typeof createRollSession> | null>(null);
  const rollAnimDoneRef = useRef(false);
  const pendingPartialRollRef = useRef<string[] | null>(null);
  const pendingRollStopRef = useRef(false);
  const pendingSortAtRef = useRef<number | null>(null);
  const pendingSortKindRef = useRef<'boss' | 'reroll' | null>(null);
  const prevHandKeyRef = useRef(orderKey(handDiceIds));
  const prevPhaseRef = useRef<PhaseState | null>(phase);
  const displayOrderRef = useRef(displayOrder);
  displayOrderRef.current = displayOrder;

  const clearRollSessionRefs = useCallback(() => {
    rollSessionRef.current = null;
    rollAnimDoneRef.current = false;
    pendingPartialRollRef.current = null;
    pendingRollStopRef.current = true;
    pendingSortAtRef.current = null;
    pendingSortKindRef.current = null;
    setIsPostRollDelay(false);
  }, []);

  const handKey = orderKey(handDiceIds);
  if (handKey !== prevHandKeyRef.current) {
    prevHandKeyRef.current = handKey;
    clearRollSessionRefs();
  }

  if (prevPhaseRef.current === 'SELECT' && phase === 'ROLL') {
    rollAnimDoneRef.current = false;
    pendingPartialRollRef.current = null;
  }

  if (prevPhaseRef.current === 'ROLL' && phase === 'SELECT') {
    clearRollSessionRefs();
  }

  prevPhaseRef.current = phase;

  const onSortRequest = useCallback(() => {
    applySortedOrder(displayOrderRef.current, { animated: true });
  }, [applySortedOrder]);

  const onRerollRequest = useCallback((ids: string[]) => {
    pendingPartialRollRef.current = ids;
    rollAnimDoneRef.current = true;
  }, []);

  const syncDieFacesFromStore = useCallback(
    (ids: readonly string[]) => {
      const liveRound = getRoundState();
      if (!liveRound) {
        return;
      }

      const runState = run ?? getRunState();
      for (const id of ids) {
        const face = dieValueInRound(id, liveRound, runState) ?? 1;
        dieRefs.current.get(id)?.setFrame({ rotation: 0, scale: 1, value: face });
        dieRefs.current.get(id)?.reset();
      }
    },
    [dieRefs, run],
  );

  const schedulePostRollSort = useCallback((kind: 'boss' | 'reroll') => {
    pendingSortAtRef.current = performance.now() + POST_ROLL_SORT_DELAY_MS;
    pendingSortKindRef.current = kind;
    setIsPostRollDelay(true);
  }, []);

  const tickRollAnimation = useCallback(() => {
    if (pendingRollStopRef.current) {
      pendingRollStopRef.current = false;
      setIsRolling(false);
    }

    const sortAt = pendingSortAtRef.current;
    if (sortAt !== null && performance.now() >= sortAt) {
      pendingSortAtRef.current = null;
      const kind = pendingSortKindRef.current;
      pendingSortKindRef.current = null;
      setIsPostRollDelay(false);

      if (kind === 'boss') {
        applyBossLocksAndSort();
      } else if (kind === 'reroll') {
        applySortedOrder(displayOrderRef.current, { animated: true });
      }
    }

    const liveRound = getRoundState();
    if (liveRound && phase === 'ROLL' && !rollSessionRef.current && pendingSortAtRef.current === null) {
      const runState = run ?? getRunState();
      const partialIds = pendingPartialRollRef.current;
      if (partialIds && partialIds.length > 0) {
        pendingPartialRollRef.current = null;
        const dice = resolveDiceByIds([...partialIds], liveRound, runState);
        rollSessionRef.current = createRollSession(
          [...partialIds],
          buildRollFinalValues(dice, liveRound),
          buildRollEnhancements(dice),
        );
        playSfx('diceRattleAndRoll', { volume: 0.6 });
        setIsRolling(true);
      } else if (!rollAnimDoneRef.current && displayOrder.length > 0) {
        const dice = resolveDiceByIds([...displayOrder], liveRound, runState);
        rollSessionRef.current = createRollSession(
          [...displayOrder],
          buildRollFinalValues(dice, liveRound),
          buildRollEnhancements(dice),
        );
        playSfx('diceRattleAndRoll', { volume: 0.6 });
        setIsRolling(true);
      }
    }

    const session = rollSessionRef.current;
    if (!session) {
      return;
    }

    const wasBouncing = session.phase === 'bouncing';
    const phaseResult = stepRollAnimation(session, dieRefs.current);

    if (!wasBouncing && session.phase === 'bouncing' && !session.landSoundPlayed) {
      session.landSoundPlayed = true;
      playSfx('diceRoll', { volume: 0.5 });
    }

    if (phaseResult !== 'done') {
      return;
    }

    rollSessionRef.current = null;
    setIsRolling(false);
    syncDieFacesFromStore(session.dieIds);

    if (!rollAnimDoneRef.current) {
      rollAnimDoneRef.current = true;
      schedulePostRollSort('boss');
      return;
    }

    schedulePostRollSort('reroll');
  }, [
    applyBossLocksAndSort,
    applySortedOrder,
    displayOrder,
    dieRefs,
    phase,
    run,
    schedulePostRollSort,
    syncDieFacesFromStore,
  ]);

  return {
    isRolling: isRolling || isPostRollDelay,
    tickRollAnimation,
    onSortRequest,
    onRerollRequest,
  };
}
