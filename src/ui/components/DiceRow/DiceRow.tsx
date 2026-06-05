import { useTick } from '@pixi/react';
import { use, useCallback, useRef } from 'react';

import { DraggableItem, type DraggableItemHandle } from '@/ui/components/DraggableItem/DraggableItem';
import { Die, DEFAULT_DIE_SIZE, type DieHandle } from '@/ui/components/Dice/Die';
import { dieShadowDragStateFromFloor } from '@/ui/components/Dice/dieGroundShadow';
import { DICE_DRAG_Z_INDEX } from '@/ui/components/Dice/config';
import { texturesReady } from '@/assets/dice/textures';
import { DICE_COUNT } from '@/data/dice';
import { gameFacade } from '@/game/facade';
import { rollSpinFrame, useRunStore } from '@/game/store/runStore';
import { rowArcPose } from '@/ui/interaction/rowArcPose';
import { useReorderableRow, type ReorderableRowLayout, type RowLayoutMeta } from '@/ui/interaction/useReorderableRow';

const ROLL_MS = 1400;

export type DiceRowProps = {
  layout: ReorderableRowLayout;
};

type ActiveRoll = {
  targets: number[];
  startedAt: number;
};

function dieShadowFloorLineY(
  itemId: number,
  homeY: number,
  count: number,
  meta: RowLayoutMeta,
  slotHomeY: (slotIndex: number) => number,
): number | null {
  if (meta.dragSession?.itemId === itemId) {
    const fromSlot = meta.dragSession.fromSlot;
    const y = slotHomeY(fromSlot);
    // Drag container is flat (no arc); pin shadow to this slot's arced rest Y.
    return y + rowArcPose(fromSlot, count, 1).yOffset;
  }
  if (meta.dropSettlingItemId === itemId) {
    // Settling applies arc on the container; flat home.y + visual.y pin is correct.
    return homeY;
  }
  return null;
}

export function DiceRow({ layout }: DiceRowProps) {
  use(texturesReady);

  const diceType = useRunStore((state) => state.diceType);
  const dieValues = useRunStore((state) => state.dieValues);
  const order = useRunStore((state) => state.diceOrder);
  const isRolling = useRunStore((state) => state.isRolling);
  const rollTargets = useRunStore((state) => state.rollTargets);
  const setDiceOrder = useRunStore((state) => state.setDiceOrder);

  const dragRefs = useRef<(DraggableItemHandle | null)[]>([]);
  const dieRefs = useRef<(DieHandle | null)[]>([]);
  const rollRef = useRef<ActiveRoll | null>(null);

  const { onPointerDown, tickLayout, slotHome, draggingSlot, pressingItemId } = useReorderableRow({
    layout,
    order,
    onOrderChange: setDiceOrder,
    disabled: isRolling,
    swing: { factor: 0.1, maxRadians: 0.95, follow: 0.32, velocitySmoothing: 0.5 },
    dragSnapLerp: 0.42,
  });

  const draggingDieId = draggingSlot !== null ? pressingItemId : null;

  const onTick = useCallback(() => {
    tickLayout((slotIndex, itemId, visual, meta) => {
      const isDragging = draggingDieId === itemId;
      const pose = rowArcPose(slotIndex, layout.count, isDragging ? 0 : 1);
      const containerY = visual.y + pose.yOffset;
      const home = slotHome(slotIndex);

      dragRefs.current[itemId]?.setTransform(visual.x, containerY, visual.rotation, visual.zIndex);
      dieRefs.current[itemId]?.setSquishScale(visual.scaleX * pose.scale, visual.scaleY * pose.scale);

      const shadowFloorY = dieShadowFloorLineY(itemId, home.y, layout.count, meta, (fromSlot) => slotHome(fromSlot).y);
      dieRefs.current[itemId]?.setShadowDragState(dieShadowDragStateFromFloor(shadowFloorY, visual.y));
    });

    if (isRolling && rollTargets && !rollRef.current) {
      rollRef.current = { targets: rollTargets, startedAt: performance.now() };
    }

    const active = rollRef.current;
    if (!active) {
      return;
    }

    const progress = Math.min((performance.now() - active.startedAt) / ROLL_MS, 1);
    const easeOut = 1 - (1 - progress) ** 3;
    const spinning = progress < 1;
    const bounce = 1 + Math.sin(progress * Math.PI * 6) * 0.1 * (1 - progress);

    for (let itemId = 0; itemId < DICE_COUNT; itemId++) {
      dieRefs.current[itemId]?.setFrame({
        rotation: easeOut * Math.PI * 10,
        scale: bounce,
        value: spinning ? rollSpinFrame() : active.targets[itemId]!,
      });
    }

    if (spinning) {
      return;
    }

    for (let itemId = 0; itemId < DICE_COUNT; itemId++) {
      dieRefs.current[itemId]?.reset();
    }

    rollRef.current = null;
    gameFacade.dice.completeRoll(active.targets);
  }, [draggingDieId, isRolling, layout.count, rollTargets, slotHome, tickLayout]);

  useTick(onTick);

  return (
    <pixiContainer
      sortableChildren
      eventMode="passive"
      // Elevate the whole row so dragged dice paint above CardContainer (cards use per-item zIndex).
      zIndex={draggingDieId !== null ? DICE_DRAG_Z_INDEX : 0}
    >
      {order.map((itemId, slotIndex) => {
        const home = slotHome(slotIndex);
        return (
          <DraggableItem
            key={itemId}
            ref={(node) => {
              dragRefs.current[itemId] = node;
            }}
            x={home.x}
            y={home.y}
            hitSize={DEFAULT_DIE_SIZE}
            disabled={isRolling}
            onPointerDown={(event) => onPointerDown(slotIndex, event)}
          >
            <Die
              ref={(node) => {
                dieRefs.current[itemId] = node;
              }}
              diceType={diceType}
              value={dieValues[itemId] ?? 1}
              effect="none"
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
