import { useTick } from "@pixi/react";
import { use, useCallback, useRef } from "react";

import {
  DraggableItem,
  type DraggableItemHandle,
} from "@/ui/components/DraggableItem/DraggableItem";
import { Die, DEFAULT_DIE_SIZE, type DieHandle } from "@/ui/components/Dice/Die";
import { texturesReady } from "@/assets/dice/textures";
import { DICE_COUNT } from "@/data/dice";
import { gameFacade } from "@/game/facade";
import { rollSpinFrame, useRunStore } from "@/game/store/runStore";
import {
  useReorderableRow,
  type ReorderableRowLayout,
} from "@/ui/interaction/useReorderableRow";

const ROLL_MS = 1400;

export type DiceRowProps = {
  layout: ReorderableRowLayout;
};

type ActiveRoll = {
  targets: number[];
  startedAt: number;
};

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

  const { onPointerDown, tickLayout, slotHome } = useReorderableRow({
    layout,
    order,
    onOrderChange: setDiceOrder,
    disabled: isRolling,
    swing: { factor: 0.1, maxRadians: 0.95, follow: 0.32, velocitySmoothing: 0.5 },
    dragSnapLerp: 0.42,
  });

  const onTick = useCallback(() => {
    tickLayout((slotIndex, itemId, visual) => {
      dragRefs.current[itemId]?.setTransform(
        visual.x,
        visual.y,
        visual.rotation,
        visual.zIndex,
      );
      dieRefs.current[itemId]?.setSquishScale(visual.scaleX, visual.scaleY);
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
  }, [isRolling, rollTargets, tickLayout]);

  useTick(onTick);

  return (
    <pixiContainer sortableChildren eventMode="passive">
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
              effect="arcane"
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
