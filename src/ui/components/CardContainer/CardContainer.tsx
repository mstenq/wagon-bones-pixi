import { useTick } from '@pixi/react';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import { use, useCallback, useMemo, useRef, useState } from 'react';

import { DraggableItem, type DraggableItemHandle } from '@/ui/components/DraggableItem/DraggableItem';
import { Card, DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH, type CardHandle } from '@/ui/components/Card/Card';
import { getItemTexture, itemTexturesReady } from '@/loaders/items/textures';
import { CARD_DRAG_Z_INDEX, CARD_SELECTED_Z_INDEX } from '@/ui/components/Card/config';
import { cardContainerHitArea } from '@/ui/components/Card/containerHitArea';
import { useGameRunStore } from '@/game/store/reactHooks';
import { useReorderableRow, type ReorderableRowLayout } from '@/ui/interaction/useReorderableRow';
import { SQUISH_DRAG_CARD, SQUISH_GRAB_CARD } from '@/ui/interaction/spring';

export type CardContainerProps = {
  layout: ReorderableRowLayout;
};

function cardRowZIndex(
  slotIndex: number,
  draggingSlotIndex: number | null,
  selectedSlotIndex: number | null,
  visualZIndex: number,
): number {
  if (draggingSlotIndex === slotIndex) {
    return CARD_DRAG_Z_INDEX;
  }
  if (selectedSlotIndex === slotIndex) {
    return CARD_SELECTED_Z_INDEX;
  }
  return visualZIndex;
}

export function CardContainer({ layout }: CardContainerProps) {
  use(itemTexturesReady);

  const equipment = useGameRunStore((state) => state.equipment);
  const order = useMemo(() => equipment.map((_, index) => index), [equipment]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const containerHitArea = useMemo(() => cardContainerHitArea(DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT), []);

  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const dragRefs = useRef<(DraggableItemHandle | null)[]>([]);
  const cardRefs = useRef<(CardHandle | null)[]>([]);

  const { onPointerDown, tickLayout, slotHome, draggingSlot, pressingItemId } = useReorderableRow({
    layout,
    order,
    onOrderChange: () => {},
    swing: { factor: 0.07, maxRadians: 0.42, follow: 0.18, velocitySmoothing: 0.28 },
    dragSnapLerp: 0.42,
    squishGrab: SQUISH_GRAB_CARD,
    squishDrag: SQUISH_DRAG_CARD,
    onItemTap: (_slotIndex, slotIndex) => {
      const card = cardRefs.current[slotIndex];
      card?.toggleOwned();
    },
  });

  const draggingSlotIndex = draggingSlot !== null ? pressingItemId : null;

  const onCardPointerMove = useCallback(
    (slotIndex: number, event: FederatedPointerEvent) => {
      if (draggingSlotIndex !== null) {
        return;
      }
      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      cardRefs.current[slotIndex]?.setPointerLocal(local.x, local.y);
    },
    [draggingSlotIndex],
  );

  const onCardPointerOver = useCallback(
    (slotIndex: number) => {
      if (draggingSlotIndex !== null) {
        return;
      }
      setHoveredSlotIndex(slotIndex);
    },
    [draggingSlotIndex],
  );

  const onCardPointerOut = useCallback((slotIndex: number) => {
    setHoveredSlotIndex((current) => (current === slotIndex ? null : current));
  }, []);

  const onTick = useCallback(() => {
    tickLayout((slotIndex, _itemId, visual) => {
      const zIndex = cardRowZIndex(slotIndex, draggingSlotIndex, selectedSlotIndex, visual.zIndex);
      dragRefs.current[slotIndex]?.setTransform(visual.x, visual.y, visual.rotation, zIndex);
      cardRefs.current[slotIndex]?.setSquishScale(visual.scaleX, visual.scaleY);
    });
  }, [draggingSlotIndex, selectedSlotIndex, tickLayout]);

  const onCardSelectedChange = useCallback((slotIndex: number, selected: boolean) => {
    if (selected) {
      if (selectedSlotIndex !== null && selectedSlotIndex !== slotIndex) {
        cardRefs.current[selectedSlotIndex]?.deselect(true);
      }
      setSelectedSlotIndex(slotIndex);
      return;
    }
    if (selectedSlotIndex === slotIndex) {
      setSelectedSlotIndex(null);
    }
  }, [selectedSlotIndex]);

  useTick(onTick);

  return (
    <pixiContainer sortableChildren eventMode="passive" zIndex={draggingSlotIndex !== null ? CARD_DRAG_Z_INDEX : 0}>
      {equipment.map((item, slotIndex) => {
        const home = slotHome(slotIndex);
        return (
          <DraggableItem
            key={`${item.defId}-${slotIndex}`}
            ref={(node) => {
              dragRefs.current[slotIndex] = node;
            }}
            x={home.x}
            y={home.y}
            hitArea={containerHitArea}
            interactiveChildren
            onPointerDown={(event) => onPointerDown(slotIndex, event)}
            onPointerMove={(event) => onCardPointerMove(slotIndex, event)}
            onPointerOver={() => onCardPointerOver(slotIndex)}
            onPointerOut={() => onCardPointerOut(slotIndex)}
          >
            <Card
              ref={(node) => {
                cardRefs.current[slotIndex] = node;
              }}
              texture={getItemTexture(item.defId)}
              effect="none"
              phase={slotIndex * 1.35}
              hovered={hoveredSlotIndex === slotIndex}
              dragging={draggingSlotIndex === slotIndex}
              displayMode="owned"
              embedded
              selected={selectedSlotIndex === slotIndex}
              onSelectedChange={(selected) => onCardSelectedChange(slotIndex, selected)}
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
