import { Rectangle, type Container } from "pixi.js";
import type { FederatedPointerEvent } from "pixi.js";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, type ReactNode } from "react";

import "@/ui/pixi/extend";

export type DraggableItemHandle = {
  setTransform: (x: number, y: number, rotation: number, zIndex?: number) => void;
};

export type DraggableItemProps = {
  x: number;
  y: number;
  rotation?: number;
  zIndex?: number;
  hitSize: number;
  disabled?: boolean;
  onPointerDown?: (event: FederatedPointerEvent) => void;
  onPointerMove?: (event: FederatedPointerEvent) => void;
  onPointerOver?: (event: FederatedPointerEvent) => void;
  onPointerOut?: (event: FederatedPointerEvent) => void;
  children: ReactNode;
};

/**
 * Generic Pixi wrapper for drag-reorder rows (dice, cards, shop items, etc.).
 * Pair with `useReorderableRow` for layout + reorder logic.
 */
export const DraggableItem = forwardRef<DraggableItemHandle, DraggableItemProps>(
  function DraggableItem(
    {
      x,
      y,
      rotation = 0,
      zIndex = 0,
      hitSize,
      disabled = false,
      onPointerDown,
      onPointerMove,
      onPointerOver,
      onPointerOut,
      children,
    },
    ref,
  ) {
    const containerRef = useRef<Container | null>(null);
    const hitArea = useMemo(() => {
      const half = hitSize / 2;
      return new Rectangle(-half, -half, hitSize, hitSize);
    }, [hitSize]);

    useImperativeHandle(
      ref,
      () => ({
        setTransform(nextX, nextY, nextRotation, nextZIndex = zIndex) {
          const node = containerRef.current;
          if (!node) {
            return;
          }
          node.position.set(nextX, nextY);
          node.rotation = nextRotation;
          node.zIndex = nextZIndex;
        },
      }),
      [zIndex],
    );

    const bindContainer = useCallback(
      (node: Container | null) => {
        containerRef.current = node;
        if (!node) {
          return;
        }
        node.hitArea = hitArea;
        node.interactiveChildren = false;
        node.eventMode = disabled ? "none" : "static";
        node.cursor = disabled ? "default" : "grab";
      },
      [disabled, hitArea],
    );

    return (
      <pixiContainer
        ref={bindContainer}
        x={x}
        y={y}
        rotation={rotation}
        zIndex={zIndex}
        onPointerDown={disabled ? undefined : onPointerDown}
        onPointerMove={disabled ? undefined : onPointerMove}
        onPointerOver={disabled ? undefined : onPointerOver}
        onPointerOut={disabled ? undefined : onPointerOut}
      >
        {children}
      </pixiContainer>
    );
  },
);
