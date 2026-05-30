import { useTick } from "@pixi/react";
import type { Container, FederatedPointerEvent } from "pixi.js";
import { use, useCallback, useMemo, useRef, useState } from "react";

import {
  DraggableItem,
  type DraggableItemHandle,
} from "@/ui/components/DraggableItem/DraggableItem";
import { Card, DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH, type CardHandle } from "@/ui/components/Card/Card";
import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import {
  CARD_COUNT,
  CARD_SELECTED_Z_INDEX,
  cardHandHitArea,
} from "@/ui/components/Card/config";
import {
  useReorderableRow,
  type ReorderableRowLayout,
} from "@/ui/interaction/useReorderableRow";

import "@/ui/pixi/extend";

const initialOrder = () => Array.from({ length: CARD_COUNT }, (_, cardId) => cardId);

export type CardsHandProps = {
  layout: ReorderableRowLayout;
};

export function CardsHand({ layout }: CardsHandProps) {
  use(itemTexturesReady);

  const handHitArea = useMemo(
    () => cardHandHitArea(DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT),
    [],
  );

  const [order, setOrder] = useState(initialOrder);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(() => new Set());
  const dragRefs = useRef<(DraggableItemHandle | null)[]>([]);
  const cardRefs = useRef<(CardHandle | null)[]>([]);

  const { onPointerDown, tickLayout, slotHome, draggingSlot } = useReorderableRow({
    layout,
    order,
    onOrderChange: setOrder,
    swing: { factor: 0.07, maxRadians: 0.42, follow: 0.18, velocitySmoothing: 0.28 },
    dragSnapLerp: 0.42,
    onItemTap: (_slotIndex, cardId, event) => {
      const card = cardRefs.current[cardId];
      if (!card) {
        return;
      }
      if (card.hitsSellTabAtGlobal(event.global.x, event.global.y)) {
        card.triggerSell();
        return;
      }
      card.toggleOwned();
    },
  });

  const draggingCardId = draggingSlot !== null ? order[draggingSlot] : null;

  const onCardPointerMove = useCallback((cardId: number, event: FederatedPointerEvent) => {
    if (draggingCardId !== null) {
      return;
    }
    const target = event.currentTarget as Container;
    const local = target.toLocal(event.global);
    cardRefs.current[cardId]?.setPointerLocal(local.x, local.y);
  }, [draggingCardId]);

  const onCardPointerOver = useCallback((cardId: number) => {
    if (draggingCardId !== null) {
      return;
    }
    setHoveredCardId(cardId);
  }, [draggingCardId]);

  const onCardPointerOut = useCallback((cardId: number) => {
    setHoveredCardId((current) => (current === cardId ? null : current));
  }, []);

  const onTick = useCallback(() => {
    tickLayout((slotIndex, cardId, visual) => {
      const zIndex = selectedCardIds.has(cardId) ? CARD_SELECTED_Z_INDEX : visual.zIndex;
      dragRefs.current[cardId]?.setTransform(
        visual.x,
        visual.y,
        visual.rotation,
        zIndex,
      );
      cardRefs.current[cardId]?.setSquishScale(visual.scaleX, visual.scaleY);
    });
  }, [selectedCardIds, tickLayout]);

  const onCardSelectedChange = useCallback((cardId: number, selected: boolean) => {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(cardId);
      } else {
        next.delete(cardId);
      }
      return next;
    });
  }, []);

  useTick(onTick);

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {order.map((cardId, slotIndex) => {
        const home = slotHome(slotIndex);
        return (
          <DraggableItem
            key={cardId}
            ref={(node) => {
              dragRefs.current[cardId] = node;
            }}
            x={home.x}
            y={home.y}
            hitArea={handHitArea}
            interactiveChildren
            onPointerDown={(event) => onPointerDown(slotIndex, event)}
            onPointerMove={(event) => onCardPointerMove(cardId, event)}
            onPointerOver={() => onCardPointerOver(cardId)}
            onPointerOut={() => onCardPointerOut(cardId)}
          >
            <Card
              ref={(node) => {
                cardRefs.current[cardId] = node;
              }}
              texture={getCardTexture(cardId)}
              phase={cardId * 1.35}
              hovered={hoveredCardId === cardId}
              dragging={draggingCardId === cardId}
              displayMode="owned"
              embedded
              onSell={()=>console.log("sell")}
              onSelectedChange={(selected) => onCardSelectedChange(cardId, selected)}
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
