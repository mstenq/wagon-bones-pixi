import { use, useMemo } from 'react';

import { DraggableItem } from '@/ui/components/DraggableItem/DraggableItem';
import { Die, DEFAULT_DIE_SIZE } from '@/ui/components/Dice/Die';
import { diceTypeFromEnhancement } from '@/ui/components/Dice/config';
import { texturesReady } from '@/assets/dice/textures';
import { useGameRunStore, useGameRoundStore } from '@/game/store/reactHooks';
import { dieValueInRound, resolveDiceByIds } from '@/game/store/roundResolve';
import { rowArcPose } from '@/ui/interaction/rowArcPose';
import { rowMetrics, rowSlotCenter } from '@/ui/interaction/rowLayout';
import type { ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';

export type DiceRowProps = {
  layout: ReorderableRowLayout;
};

function layoutForHandCount(layout: ReorderableRowLayout, handCount: number): ReorderableRowLayout {
  if (handCount <= 0 || handCount === layout.count) {
    return layout;
  }

  const gap = layout.pitch - DEFAULT_DIE_SIZE;
  const contentW = 2 * (layout.originX - DEFAULT_DIE_SIZE / 2) + layout.rowWidth;
  const metrics = rowMetrics(handCount, DEFAULT_DIE_SIZE, gap, contentW);

  return { ...layout, ...metrics, count: handCount };
}

export function DiceRow({ layout }: DiceRowProps) {
  use(texturesReady);

  const run = useGameRunStore((state) => state);
  const round = useGameRoundStore((state) => state);

  const handDice = useMemo(() => {
    if (!round) {
      return [];
    }
    return resolveDiceByIds(round.handDiceIds, round, run);
  }, [round, run]);

  const effectiveLayout = useMemo(() => layoutForHandCount(layout, handDice.length), [handDice.length, layout]);

  if (!round) {
    return null;
  }

  const { count, pitch, originX, rowY } = effectiveLayout;

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {handDice.map((die, index) => {
        const pose = rowArcPose(index, count, 1);
        const home = rowSlotCenter(index, pitch, originX, rowY);
        const value = dieValueInRound(die.id, round, run) ?? die.value;

        return (
          <DraggableItem
            key={die.id}
            x={home.x}
            y={home.y + pose.yOffset}
            hitSize={DEFAULT_DIE_SIZE}
            // Drag reorder is visual-only until a migrated hand-order action exists.
            disabled
            onPointerDown={() => {}}
          >
            <Die diceType={diceTypeFromEnhancement(die.enhancement)} value={value} effect="none" />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
