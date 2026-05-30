import { useTick } from "@pixi/react";
import type { Container, FederatedPointerEvent } from "pixi.js";
import { use, useCallback, useMemo, useRef, useState } from "react";

import {
  DraggableItem,
  type DraggableItemHandle,
} from "@/ui/components/DraggableItem/DraggableItem";
import { Card, DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH, type CardHandle } from "@/ui/components/Card/Card";
import { getCardTexture, itemTexturesReady } from "@/assets/items/textures";
import { CARD_SELECTED_Z_INDEX } from "@/ui/components/Card/config";
import { cardContainerHitArea } from "@/ui/components/Card/containerHitArea";
import { gameFacade } from "@/game/facade";
import { useRunStore } from "@/game/store/runStore";
import {
  useReorderableRow,
  type ReorderableRowLayout,
} from "@/ui/interaction/useReorderableRow";
import { SQUISH_DRAG_CARD, SQUISH_GRAB_CARD } from "@/ui/interaction/spring";

export type CardContainerProps = {
  layout: ReorderableRowLayout;
};

export function CardContainer({ layout }: CardContainerProps) {
  use(itemTexturesReady);

  const order = useRunStore((state) => state.cardOrder);
  const selectedCardId = useRunStore((state) => state.selectedCardId);
  const setCardOrder = useRunStore((state) => state.setCardOrder);
  const selectCard = useRunStore((state) => state.selectCard);

  const containerHitArea = useMemo(
    () => cardContainerHitArea(DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT),
    [],
  );

  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const dragRefs = useRef<(DraggableItemHandle | null)[]>([]);
  const cardRefs = useRef<(CardHandle | null)[]>([]);

  const { onPointerDown, tickLayout, slotHome, draggingSlot } = useReorderableRow({
    layout,
    order,
    onOrderChange: setCardOrder,
    swing: { factor: 0.07, maxRadians: 0.42, follow: 0.18, velocitySmoothing: 0.28 },
    dragSnapLerp: 0.42,
    squishGrab: SQUISH_GRAB_CARD,
    squishDrag: SQUISH_DRAG_CARD,
    onItemTap: (_slotIndex, cardId, event) => {
      const card = cardRefs.current[cardId];
      if (!card) {
        return;
      }
      if (card.hitsSellTabAtGlobal(event.global.x, event.global.y)) {
        gameFacade.cards.sellCard(cardId);
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
      const zIndex = selectedCardId === cardId ? CARD_SELECTED_Z_INDEX : visual.zIndex;
      dragRefs.current[cardId]?.setTransform(
        visual.x,
        visual.y,
        visual.rotation,
        zIndex,
      );
      cardRefs.current[cardId]?.setSquishScale(visual.scaleX, visual.scaleY);
    });
  }, [selectedCardId, tickLayout]);

  const onCardSelectedChange = useCallback((cardId: number, selected: boolean) => {
    if (selected) {
      const previous = gameFacade.cards.getSelectedId();
      if (previous !== null && previous !== cardId) {
        cardRefs.current[previous]?.deselect(true);
      }
      selectCard(cardId);
      return;
    }
    if (gameFacade.cards.getSelectedId() === cardId) {
      selectCard(null);
    }
  }, [selectCard]);

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
            hitArea={containerHitArea}
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
              effect="foil"
              phase={cardId * 1.35}
              hovered={hoveredCardId === cardId}
              dragging={draggingCardId === cardId}
              displayMode="owned"
              embedded
              selected={selectedCardId === cardId}
              onSelectedChange={(selected) => onCardSelectedChange(cardId, selected)}
            />
          </DraggableItem>
        );
      })}
    </pixiContainer>
  );
}
