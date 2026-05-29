import { useTick } from "@pixi/react";
import { use, useCallback, useRef } from "react";

import {
  DraggableItem,
  type DraggableItemHandle,
} from "@/ui/components/DraggableItem/DraggableItem";
import { Die, DEFAULT_DIE_SIZE, type DieHandle } from "@/ui/components/Dice/Die";
import { getDiceTexture, texturesReady } from "@/assets/dice/textures";
import { DICE_COUNT, rollD12, rollMany } from "@/ui/components/Dice/config";
import { useDice } from "@/ui/store/DiceContext";
import {
  useReorderableRow,
  type ReorderableRowLayout,
} from "@/ui/interaction/useReorderableRow";

import "@/ui/pixi/extend";

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

  const { diceType, results, order, setOrder, isRolling, startRollRef, finishRoll } =
    useDice();
  const texture = getDiceTexture(diceType);

  const dragRefs = useRef<(DraggableItemHandle | null)[]>([]);
  const dieRefs = useRef<(DieHandle | null)[]>([]);
  const rollingRef = useRef(false);
  const rollRef = useRef<ActiveRoll | null>(null);
  const finishRollRef = useRef(finishRoll);

  finishRollRef.current = finishRoll;

  const { onPointerDown, tickLayout, slotHome } = useReorderableRow({
    layout,
    order,
    onOrderChange: setOrder,
    disabled: isRolling,
    swing: { factor: 0.1, maxRadians: 0.95, follow: 0.32, velocitySmoothing: 0.5 },
    dragSnapLerp: 0.42,
  });

  startRollRef.current = () => {
    rollRef.current = { targets: rollMany(DICE_COUNT), startedAt: performance.now() };
    rollingRef.current = true;
  };

  const onTick = useCallback(() => {
    tickLayout((slotIndex, dieId, visual) => {
      dragRefs.current[dieId]?.setTransform(
        visual.x,
        visual.y,
        visual.rotation,
        visual.zIndex,
      );
      dieRefs.current[dieId]?.setSquishScale(visual.scaleX, visual.scaleY);
    });

    const active = rollRef.current;
    if (!rollingRef.current || !active) {
      return;
    }

    const progress = Math.min((performance.now() - active.startedAt) / ROLL_MS, 1);
    const easeOut = 1 - (1 - progress) ** 3;
    const spinning = progress < 1;
    const bounce = 1 + Math.sin(progress * Math.PI * 6) * 0.1 * (1 - progress);

    for (let dieId = 0; dieId < DICE_COUNT; dieId++) {
      dieRefs.current[dieId]?.setFrame({
        rotation: easeOut * Math.PI * 10,
        scale: bounce,
        value: spinning ? rollD12() : active.targets[dieId]!,
      });
    }

    if (spinning) {
      return;
    }

    for (let dieId = 0; dieId < DICE_COUNT; dieId++) {
      dieRefs.current[dieId]?.reset();
    }

    rollingRef.current = false;
    rollRef.current = null;
    finishRollRef.current(active.targets);
  }, [tickLayout]);

  useTick(onTick);

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {order.map((dieId, slotIndex) => {
        const home = slotHome(slotIndex);
        return (
          <DraggableItem
            key={dieId}
            ref={(node) => {
              dragRefs.current[dieId] = node;
            }}
            x={home.x}
            y={home.y}
            hitSize={DEFAULT_DIE_SIZE}
            disabled={isRolling}
            onPointerDown={(event) => onPointerDown(slotIndex, event)}
          >
            <Die
              ref={(node) => {
                dieRefs.current[dieId] = node;
              }}
              texture={texture}
              value={results[dieId]}
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
