import { useTick } from '@pixi/react';
import { use, useCallback, useMemo, useRef, useState } from 'react';

import {
  DraggableItem,
  type DraggableItemHandle,
} from '@/ui/components/DraggableItem/DraggableItem';
import { Die, DEFAULT_DIE_SIZE, type DieHandle } from '@/ui/components/Dice/Die';
import { DICE_DRAG_Z_INDEX, diceTypeFromEnhancement } from '@/ui/components/Dice/config';
import { dieShadowDragStateFromFloor } from '@/ui/components/Dice/dieGroundShadow';
import { createRollSession, stepRollAnimation, type ActiveRollSession } from '@/ui/components/DiceRow/diceRollAnimation';
import { setDiceRowVisualOrder } from '@/ui/components/DiceRow/diceRowUi';
import { texturesReady } from '@/assets/dice/textures';
import type { RoundRuntimeState } from '@/game/store/types';
import type { Die as GameDie, PhaseState } from '@/game/types';
import { useGameRunStore, useGameRoundStore } from '@/game/store/reactHooks';
import { dieValueInRound, resolveDiceByIds } from '@/game/store/roundResolve';
import { rowArcPose } from '@/ui/interaction/rowArcPose';
import { rowMetrics } from '@/ui/interaction/rowLayout';
import {
  useReorderableRow,
  type ReorderableRowLayout,
  type RowLayoutMeta,
} from '@/ui/interaction/useReorderableRow';

export type DiceRowProps = {
  layout: ReorderableRowLayout;
};

function layoutForDiceCount(layout: ReorderableRowLayout, diceCount: number): ReorderableRowLayout {
  if (diceCount <= 0 || diceCount === layout.count) {
    return layout;
  }

  const gap = layout.pitch - DEFAULT_DIE_SIZE;
  const contentW = 2 * (layout.originX - DEFAULT_DIE_SIZE / 2) + layout.rowWidth;
  const metrics = rowMetrics(diceCount, DEFAULT_DIE_SIZE, gap, contentW);

  return { ...layout, ...metrics, count: diceCount };
}

function orderKey(ids: string[]): string {
  return ids.join('|');
}

function dieShadowFloorLineY(
  dieId: string,
  homeY: number,
  meta: RowLayoutMeta<string>,
  slotHomeY: (slotIndex: number) => number,
): number | null {
  if (meta.dragSession?.itemId === dieId) {
    return slotHomeY(meta.dragSession.fromSlot);
  }
  if (meta.dropSettlingItemId === dieId) {
    return homeY;
  }
  return null;
}

function buildRollFinalValues(dice: GameDie[], round: RoundRuntimeState): Record<string, number> {
  const values: Record<string, number> = {};
  for (const die of dice) {
    values[die.id] = dieValueInRound(die.id, round) ?? die.value;
  }
  return values;
}

function selectDisplayOrder(
  phase: PhaseState | null,
  visualOrder: string[],
  rolledDisplayOrder: string[],
  handDiceIds: string[],
): string[] {
  if (phase === 'SELECT') {
    return visualOrder;
  }
  if (rolledDisplayOrder.length > 0) {
    return rolledDisplayOrder;
  }
  if (visualOrder.length > 0) {
    return visualOrder;
  }
  return handDiceIds;
}

function buildRollEnhancements(dice: GameDie[]): Record<string, GameDie['enhancement']> {
  const enhancements: Record<string, GameDie['enhancement']> = {};
  for (const die of dice) {
    enhancements[die.id] = die.enhancement;
  }
  return enhancements;
}

export function DiceRow({ layout }: DiceRowProps) {
  use(texturesReady);

  const run = useGameRunStore((state) => state);
  const round = useGameRoundStore((state) => state);
  const phase = round?.phase ?? null;
  const handDiceIds = round?.handDiceIds ?? [];

  const [visualOrder, setVisualOrder] = useState<string[]>(handDiceIds);
  const [rolledDisplayOrder, setRolledDisplayOrder] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const prevHandKeyRef = useRef(orderKey(handDiceIds));
  const prevPhaseRef = useRef<PhaseState | null>(phase);
  const rollSessionRef = useRef<ActiveRollSession | null>(null);
  /** Prevents restarting the roll animation every frame after the current one completes. */
  const rollAnimDoneRef = useRef(false);

  const handKey = orderKey(handDiceIds);
  if (handKey !== prevHandKeyRef.current) {
    prevHandKeyRef.current = handKey;
    if (orderKey(visualOrder) !== handKey) {
      setVisualOrder(handDiceIds);
      setDiceRowVisualOrder(handDiceIds);
    }
    setRolledDisplayOrder([]);
    rollSessionRef.current = null;
    rollAnimDoneRef.current = false;
    setIsRolling(false);
  }

  if (prevPhaseRef.current === 'SELECT' && phase === 'ROLL') {
    rollAnimDoneRef.current = false;
    const snapshot = visualOrder.length > 0 ? visualOrder : handDiceIds;
    if (orderKey(rolledDisplayOrder) !== orderKey(snapshot)) {
      setRolledDisplayOrder(snapshot);
    }
  }

  if (phase === 'SELECT' && rolledDisplayOrder.length > 0) {
    setRolledDisplayOrder([]);
    rollSessionRef.current = null;
    rollAnimDoneRef.current = false;
    setIsRolling(false);
  }

  prevPhaseRef.current = phase;

  const displayOrder = selectDisplayOrder(phase, visualOrder, rolledDisplayOrder, handDiceIds);

  const displayDice = useMemo(() => {
    if (!round || displayOrder.length === 0) {
      return [];
    }
    return resolveDiceByIds(displayOrder, round, run);
  }, [displayOrder, round, run]);

  const effectiveLayout = useMemo(
    () => layoutForDiceCount(layout, displayOrder.length),
    [displayOrder.length, layout],
  );

  const dragRefs = useRef<Map<string, DraggableItemHandle | null>>(new Map());
  const dieRefs = useRef<Map<string, DieHandle | null>>(new Map());

  const onVisualOrderChange = useCallback((nextOrder: string[]) => {
    setVisualOrder(nextOrder);
    setDiceRowVisualOrder(nextOrder);
  }, []);

  const dragDisabled = phase !== 'SELECT' || isRolling;

  const { onPointerDown, tickLayout, slotHome, draggingSlot, pressingItemId } = useReorderableRow<string>({
    layout: effectiveLayout,
    order: displayOrder,
    onOrderChange: onVisualOrderChange,
    disabled: dragDisabled,
    swing: { factor: 0.1, maxRadians: 0.95, follow: 0.32, velocitySmoothing: 0.5 },
    dragSnapLerp: 0.42,
  });

  const draggingDieId = draggingSlot !== null ? pressingItemId : null;

  const onTick = useCallback(() => {
    if (round && phase === 'ROLL' && !rollSessionRef.current && !rollAnimDoneRef.current && displayOrder.length > 0) {
      const dice = resolveDiceByIds(displayOrder, round, run);
      rollSessionRef.current = createRollSession(
        displayOrder,
        buildRollFinalValues(dice, round),
        buildRollEnhancements(dice),
      );
      setIsRolling(true);
    }

    tickLayout((slotIndex, dieId, visual, meta) => {
      const isDragging = draggingDieId === dieId;
      const pose = rowArcPose(slotIndex, effectiveLayout.count, isDragging ? 0 : 1);
      const containerY = visual.y + pose.yOffset;
      const home = slotHome(slotIndex);

      dragRefs.current.get(dieId)?.setTransform(visual.x, containerY, visual.rotation, visual.zIndex);
      dieRefs.current.get(dieId)?.setSquishScale(visual.scaleX * pose.scale, visual.scaleY * pose.scale);

      const shadowFloorY = dieShadowFloorLineY(dieId, home.y, meta, (fromSlot) => slotHome(fromSlot).y);
      dieRefs.current.get(dieId)?.setShadowDragState(dieShadowDragStateFromFloor(shadowFloorY, visual.y));
    });

    const session = rollSessionRef.current;
    if (!session) {
      return;
    }

    const finished = stepRollAnimation(session, dieRefs.current);
    if (finished) {
      rollSessionRef.current = null;
      rollAnimDoneRef.current = true;
      setIsRolling(false);
    }
  }, [displayOrder, draggingDieId, effectiveLayout.count, phase, round, run, slotHome, tickLayout]);

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

        return (
          <DraggableItem
            key={dieId}
            ref={(node) => {
              dragRefs.current.set(dieId, node);
            }}
            x={home.x}
            y={home.y}
            hitSize={DEFAULT_DIE_SIZE}
            disabled={dragDisabled}
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
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
