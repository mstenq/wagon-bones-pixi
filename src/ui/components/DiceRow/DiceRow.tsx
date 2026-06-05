import { useTick } from '@pixi/react';
import type { FederatedPointerEvent } from 'pixi.js';
import { use, useCallback, useMemo, useRef } from 'react';

import {
  DraggableItem,
  type DraggableItemHandle,
} from '@/ui/components/DraggableItem/DraggableItem';
import { Die, DEFAULT_DIE_SIZE, type DieHandle } from '@/ui/components/Dice/Die';
import { DICE_DRAG_Z_INDEX, diceTypeFromEnhancement } from '@/ui/components/Dice/config';
import { dieShadowDragStateFromFloor } from '@/ui/components/Dice/dieGroundShadow';
import { useDiceRowController } from '@/ui/components/DiceRow/DiceRowController';
import {
  dieModeForDie,
  dieShadowFloorLineY,
  layoutForDiceCount,
} from '@/ui/components/DiceRow/diceRowDisplay';
import { sortDieIdsForRound } from '@/ui/components/DiceRow/diceRowInteraction';
import { useDiceRowPhaseState } from '@/ui/components/DiceRow/useDiceRowPhaseState';
import { useDiceRowHandRefill, type PouchLaunchPoint } from '@/ui/components/DiceRow/useDiceRowHandRefill';
import { useDiceRowRollAnimation } from '@/ui/components/DiceRow/useDiceRowRollAnimation';
import { useDiceRowRollTap } from '@/ui/components/DiceRow/useDiceRowRollTap';
import { texturesReady } from '@/assets/dice/textures';
import { gameFacade } from '@/game/facade';
import { useGameRunStore, useGameRoundStore } from '@/game/store/reactHooks';
import { getRunState } from '@/game/store/runStore';
import { getRoundState } from '@/game/store/roundStore';
import { dieValueInRound, resolveDiceByIds } from '@/game/store/roundResolve';
import { rowArcPose } from '@/ui/interaction/rowArcPose';
import {
  useReorderableRow,
  type ApplyOrderOptions,
  type ReorderableRowLayout,
} from '@/ui/interaction/useReorderableRow';

export type DiceRowProps = {
  layout: ReorderableRowLayout;
  pouchLaunch?: PouchLaunchPoint | null;
};

const EMPTY_IDS: readonly string[] = [];

export function DiceRow({ layout, pouchLaunch = null }: DiceRowProps) {
  use(texturesReady);

  const controller = useDiceRowController();
  const run = useGameRunStore((state) => state);
  const round = useGameRoundStore((state) => state);
  const phase = round?.phase ?? null;
  const handDiceIds = round?.handDiceIds ?? EMPTY_IDS;
  const selectedForScoreIds = useGameRoundStore((state) => state?.selectedForScoreIds ?? EMPTY_IDS);

  const dragRefs = useRef<Map<string, DraggableItemHandle | null>>(new Map());
  const dieRefs = useRef<Map<string, DieHandle | null>>(new Map());
  const displayOrderRef = useRef<string[]>([]);
  const rollRowSnapshotRef = useRef<string[]>([]);
  const applyOrderRef = useRef<(order: string[], options?: ApplyOrderOptions) => void>(() => {});
  const onItemTapRef = useRef<
    ((slotIndex: number, dieId: string, event: FederatedPointerEvent) => void) | undefined
  >(undefined);

  const { displayOrder, flushExternalReset } = useDiceRowPhaseState({
    handDiceIds,
    phase,
    scoredIds: selectedForScoreIds,
  });
  displayOrderRef.current = [...displayOrder];

  const displayDice = useMemo(() => {
    if (!round || displayOrder.length === 0) {
      return [];
    }
    return resolveDiceByIds([...displayOrder], round, run ?? undefined);
  }, [displayOrder, round, run]);

  const bossLockedIds = useMemo(() => {
    if (phase !== 'ROLL' || displayDice.length === 0) {
      return new Set<string>();
    }
    return new Set(gameFacade.boss.getRollUiState(displayDice).lockedDieIds);
  }, [displayDice, phase]);

  const selectedSet = useMemo(() => new Set(selectedForScoreIds), [selectedForScoreIds]);
  const rerollLockedSet = useMemo(() => new Set(controller.rerollLockedIds), [controller.rerollLockedIds]);

  const effectiveLayout = useMemo(
    () => layoutForDiceCount(layout, displayOrder.length),
    [displayOrder.length, layout],
  );

  const onOrderChange = useCallback(
    (nextOrder: string[]) => {
      controller.setVisualOrder(nextOrder);

      const currentRound = getRoundState();
      if (currentRound?.phase === 'ROLL') {
        gameFacade.round.syncRolledDiceFromFaces(
          resolveDiceByIds(nextOrder, currentRound, run ?? getRunState()),
        );
      }
    },
    [controller, run],
  );

  const applySortedOrder = useCallback(
    (order: readonly string[], options?: ApplyOrderOptions) => {
      const currentRound = getRoundState();
      if (!currentRound) {
        return;
      }

      const sorted = sortDieIdsForRound(order, currentRound, run ?? getRunState());
      applyOrderRef.current(sorted, options);
    },
    [run],
  );

  const applyInstantOrder = useCallback(
    (order: readonly string[]) => {
      applyOrderRef.current([...order]);
    },
    [],
  );

  const applyBossLocksAndSort = useCallback(() => {
    if (!round || phase !== 'ROLL') {
      return;
    }

    const bossState = gameFacade.boss.getRollUiState(displayDice);
    controller.setRerollLockedIds([...bossState.lockedDieIds]);
    applySortedOrder(displayOrderRef.current, { animated: true });
  }, [applySortedOrder, controller, displayDice, phase, round]);

  const { isRolling, tickRollAnimation, onSortRequest, onRerollRequest } = useDiceRowRollAnimation({
    handDiceIds,
    round,
    run,
    phase,
    displayOrder,
    dieRefs,
    applySortedOrder,
    applyBossLocksAndSort,
  });

  const onItemTap = useDiceRowRollTap({
    phase,
    isRolling,
    round,
    run,
    selectedForScoreIds,
    bossLockedIds,
  });
  onItemTapRef.current = phase === 'ROLL' ? onItemTap : undefined;

  const dragDisabled = (phase !== 'SELECT' && phase !== 'ROLL') || isRolling;

  const { onPointerDown, tickLayout, slotHome, draggingSlot, pressingItemId, applyOrder, beginHandFlyIn, isRepositioning } =
    useReorderableRow<string>({
      layout: effectiveLayout,
      order: displayOrder,
      onOrderChange,
      disabled: dragDisabled,
      swing: { factor: 0.1, maxRadians: 0.95, follow: 0.32, velocitySmoothing: 0.5 },
      dragSnapLerp: 0.42,
      onItemTap: (slotIndex, dieId, event) => {
        onItemTapRef.current?.(slotIndex, dieId, event);
      },
    });
  applyOrderRef.current = applyOrder;

  const { isHandRefillFlying, runHandRefillFlyIn } = useDiceRowHandRefill({
    baseLayout: layout,
    pouchLaunch,
    beginHandFlyIn,
    applyInstantOrder,
  });

  const onSortRequestRef = useRef(onSortRequest);
  onSortRequestRef.current = onSortRequest;
  const onRerollRequestRef = useRef(onRerollRequest);
  onRerollRequestRef.current = onRerollRequest;
  const runHandRefillFlyInRef = useRef(runHandRefillFlyIn);
  runHandRefillFlyInRef.current = runHandRefillFlyIn;

  controller.bindHandlers({
    sort: () => onSortRequestRef.current(),
    reroll: (ids) => onRerollRequestRef.current(ids),
    handRefill: (request) => runHandRefillFlyInRef.current(request),
    getRollRowSnapshot: () => rollRowSnapshotRef.current,
  });

  const dragDisabledEffective = dragDisabled || isHandRefillFlying || isRepositioning;

  const draggingDieId = draggingSlot !== null ? pressingItemId : null;

  const onTick = useCallback(() => {
    const animating = isRolling || isHandRefillFlying || isRepositioning;
    controller.setAnimating(animating);

    if (phase === 'ROLL') {
      rollRowSnapshotRef.current = [...displayOrderRef.current];
    }

    flushExternalReset();
    tickRollAnimation();

    tickLayout((slotIndex, dieId, visual, meta) => {
      const isDragging = draggingDieId === dieId;
      const pose = rowArcPose(slotIndex, effectiveLayout.count, isDragging ? 0 : 1);
      const containerY = visual.y + pose.yOffset;
      const home = slotHome(slotIndex);

      dragRefs.current.get(dieId)?.setTransform(visual.x, containerY, visual.rotation, visual.zIndex);
      dragRefs.current.get(dieId)?.setAlpha(visual.alpha);
      dieRefs.current.get(dieId)?.setSquishScale(visual.scaleX * pose.scale, visual.scaleY * pose.scale);

      const shadowFloorY = dieShadowFloorLineY(dieId, home.y, meta, (fromSlot) => slotHome(fromSlot).y);
      dieRefs.current.get(dieId)?.setShadowDragState(dieShadowDragStateFromFloor(shadowFloorY, visual.y));
    });
  }, [
    controller,
    draggingDieId,
    effectiveLayout.count,
    flushExternalReset,
    isHandRefillFlying,
    isRepositioning,
    isRolling,
    phase,
    slotHome,
    tickLayout,
    tickRollAnimation,
  ]);

  useTick(onTick);

  if (!round) {
    return null;
  }

  return (
    <pixiContainer
      sortableChildren
      eventMode="passive"
      zIndex={draggingDieId !== null ? DICE_DRAG_Z_INDEX : 0}
    >
      {displayOrder.map((dieId, slotIndex) => {
        const die = displayDice.find((d) => d.id === dieId);
        if (!die) {
          return null;
        }

        const home = slotHome(slotIndex);
        const value = dieValueInRound(die.id, round, run) ?? die.value;
        const mode = dieModeForDie(dieId, die, selectedSet, rerollLockedSet, bossLockedIds);

        return (
          <DraggableItem
            key={dieId}
            ref={(node) => {
              dragRefs.current.set(dieId, node);
            }}
            x={home.x}
            y={home.y}
            hitSize={DEFAULT_DIE_SIZE}
            disabled={dragDisabledEffective}
            onPointerDown={(event) => onPointerDown(slotIndex, event)}
          >
            <Die
              ref={(node) => {
                dieRefs.current.set(dieId, node);
              }}
              diceType={diceTypeFromEnhancement(die.enhancement)}
              value={value}
              effect="none"
              phase={slotIndex * 1.35}
              mode={mode}
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
