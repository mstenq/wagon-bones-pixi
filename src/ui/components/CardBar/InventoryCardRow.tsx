import { useTick } from '@pixi/react';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import type { CardBarTheme } from '@/ui/components/CardBar/cardBarTheme';
import { buildCardBarRowLayout } from '@/ui/components/CardBar/cardBarLayout';
import type { CardHandle } from '@/ui/components/Card/Card';
import { CARD_DRAG_Z_INDEX, CARD_SELECTED_Z_INDEX } from '@/ui/components/Card/config';
import { cardContainerHitArea } from '@/ui/components/Card/containerHitArea';
import { DraggableItem, type DraggableItemHandle } from '@/ui/components/DraggableItem/DraggableItem';
import {
  useReorderableRow,
  type RowReorderMove,
} from '@/ui/interaction/useReorderableRow';
import { SQUISH_DRAG_CARD, SQUISH_GRAB_CARD } from '@/ui/interaction/spring';

export type InventoryCardSlotRenderProps<ItemId extends string = string> = {
  itemId: ItemId;
  slotIndex: number;
  cardRef: (node: CardHandle | null) => void;
  hovered: boolean;
  dragging: boolean;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
};

export type InventoryCardRowProps<ItemId extends string = string> = {
  bar: { w: number; h: number };
  theme: CardBarTheme;
  itemIds: ItemId[];
  /** Store revision — clears stale drag positions when inventory content changes. */
  orderRevision: string;
  getItemKey: (itemId: ItemId) => string;
  onPersistReorder: (move: RowReorderMove<ItemId>) => void;
  renderCard: (props: InventoryCardSlotRenderProps<ItemId>) => ReactNode;
};

function cardRowZIndex<ItemId extends string>(
  itemId: ItemId,
  draggingItemId: ItemId | null,
  selectedItemId: ItemId | null,
  visualZIndex: number,
): number {
  if (draggingItemId === itemId) {
    return CARD_DRAG_Z_INDEX;
  }
  if (selectedItemId === itemId) {
    return CARD_SELECTED_Z_INDEX;
  }
  return visualZIndex;
}

export function InventoryCardRow<ItemId extends string = string>({
  bar,
  theme,
  itemIds,
  orderRevision,
  getItemKey,
  onPersistReorder,
  renderCard,
}: InventoryCardRowProps<ItemId>) {
  const layout = useMemo(
    () => buildCardBarRowLayout(bar, itemIds.length, theme),
    [bar, itemIds.length, theme],
  );

  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<ItemId | null>(null);

  const containerHitArea = useMemo(
    () => cardContainerHitArea(theme.cardWidth, theme.cardHeight),
    [theme.cardHeight, theme.cardWidth],
  );

  const dragRefs = useRef<Map<ItemId, DraggableItemHandle | null>>(new Map());
  const cardRefs = useRef<Map<ItemId, CardHandle | null>>(new Map());

  const onOrderChange = useCallback(
    (_nextOrder: ItemId[], move?: RowReorderMove<ItemId>) => {
      if (!move) {
        return;
      }
      onPersistReorder(move);
    },
    [onPersistReorder],
  );

  const { onPointerDown, tickLayout, slotHome, draggingSlot, pressingItemId } = useReorderableRow({
    layout,
    order: itemIds,
    orderRevision,
    onOrderChange,
    swing: { factor: 0.07, maxRadians: 0.42, follow: 0.18, velocitySmoothing: 0.28 },
    dragSnapLerp: 0.42,
    squishGrab: SQUISH_GRAB_CARD,
    squishDrag: SQUISH_DRAG_CARD,
    onItemTap: (_slotIndex, itemId, event) => {
      const card = cardRefs.current.get(itemId);
      if (!card) {
        return;
      }
      if (card.hitsUseTabAtGlobal(event.globalX, event.globalY)) {
        card.triggerUse();
        card.deselect(true);
        setSelectedItemId(null);
        return;
      }
      if (card.hitsSellTabAtGlobal(event.globalX, event.globalY)) {
        card.triggerSell();
        card.deselect(true);
        setSelectedItemId(null);
        return;
      }
      card.toggleOwned();
    },
  });

  const draggingItemId = draggingSlot !== null ? pressingItemId : null;

  const onCardPointerMove = useCallback(
    (itemId: ItemId, event: FederatedPointerEvent) => {
      if (draggingItemId !== null) {
        return;
      }
      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      cardRefs.current.get(itemId)?.setPointerLocal(local.x, local.y);
    },
    [draggingItemId],
  );

  const onCardPointerOver = useCallback(
    (itemId: ItemId) => {
      if (draggingItemId !== null) {
        return;
      }
      setHoveredItemId(itemId);
    },
    [draggingItemId],
  );

  const onCardPointerOut = useCallback((itemId: ItemId) => {
    setHoveredItemId((current) => (current === itemId ? null : current));
  }, []);

  const onCardSelectedChange = useCallback(
    (itemId: ItemId, selected: boolean) => {
      if (selected) {
        if (selectedItemId !== null && selectedItemId !== itemId) {
          cardRefs.current.get(selectedItemId)?.deselect(true);
        }
        setSelectedItemId(itemId);
        return;
      }
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    },
    [selectedItemId],
  );

  const onTick = useCallback(() => {
    tickLayout((_slotIndex, itemId, visual) => {
      const zIndex = cardRowZIndex(itemId, draggingItemId, selectedItemId, visual.zIndex);
      dragRefs.current.get(itemId)?.setTransform(visual.x, visual.y, visual.rotation, zIndex);
      cardRefs.current.get(itemId)?.setSquishScale(visual.scaleX, visual.scaleY);
    });
  }, [draggingItemId, selectedItemId, tickLayout]);

  useTick(onTick);

  return (
    <pixiContainer sortableChildren eventMode="passive" zIndex={draggingItemId !== null ? CARD_DRAG_Z_INDEX : 1}>
      {itemIds.map((itemId, slotIndex) => (
        <DraggableItem
          key={getItemKey(itemId)}
          ref={(node) => {
            if (node) {
              dragRefs.current.set(itemId, node);
              const home = slotHome(slotIndex);
              node.setTransform(home.x, home.y, 0, slotIndex);
            } else {
              dragRefs.current.delete(itemId);
            }
          }}
          x={0}
          y={0}
          drivePositionImperatively
          hitArea={containerHitArea}
          interactiveChildren
          onPointerDown={(event) => onPointerDown(slotIndex, event)}
          onPointerMove={(event) => onCardPointerMove(itemId, event)}
          onPointerOver={() => onCardPointerOver(itemId)}
          onPointerOut={() => onCardPointerOut(itemId)}
        >
          {renderCard({
            itemId,
            slotIndex,
            cardRef: (node) => {
              if (node) {
                cardRefs.current.set(itemId, node);
              } else {
                cardRefs.current.delete(itemId);
              }
            },
            hovered: hoveredItemId === itemId,
            dragging: draggingItemId === itemId,
            selected: selectedItemId === itemId,
            onSelectedChange: (selected) => onCardSelectedChange(itemId, selected),
          })}
        </DraggableItem>
      ))}
    </pixiContainer>
  );
}
