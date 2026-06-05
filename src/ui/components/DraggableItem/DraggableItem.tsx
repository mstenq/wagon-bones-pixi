import { Rectangle, type Container } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';

export type DraggableItemHandle = {
  setTransform: (x: number, y: number, rotation: number, zIndex?: number) => void;
  setAlpha: (alpha: number) => void;
};

export type DraggableItemProps = {
  x: number;
  y: number;
  rotation?: number;
  zIndex?: number;
  /** Square hit box; ignored when `hitArea` is set. */
  hitSize?: number;
  /** Custom hit shape (e.g. card body rect — protruding children use their own targets). */
  hitArea?: Rectangle;
  disabled?: boolean;
  /** When true, interactive children (e.g. card sell tab) are hit-tested before this wrapper. */
  interactiveChildren?: boolean;
  /** When true, position/rotation/zIndex come only from `setTransform` (drag row tick). */
  drivePositionImperatively?: boolean;
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
export const DraggableItem = forwardRef<DraggableItemHandle, DraggableItemProps>(function DraggableItem(
  {
    x,
    y,
    rotation = 0,
    zIndex = 0,
    hitSize,
    hitArea: hitAreaProp,
    disabled = false,
    interactiveChildren = false,
    drivePositionImperatively = false,
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
    if (hitAreaProp) {
      return hitAreaProp;
    }
    const size = hitSize ?? 0;
    const half = size / 2;
    return new Rectangle(-half, -half, size, size);
  }, [hitAreaProp, hitSize]);

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
      setAlpha(alpha: number) {
        const node = containerRef.current;
        if (!node) {
          return;
        }
        node.alpha = alpha;
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
      if (!node) {
        return;
      }
      if (!drivePositionImperatively) {
        node.position.set(x, y);
        node.rotation = rotation;
        node.zIndex = zIndex;
      }
      node.hitArea = hitArea;
      node.interactiveChildren = interactiveChildren;
      node.eventMode = disabled ? 'none' : 'static';
      node.cursor = disabled ? 'default' : 'grab';
    },
    [disabled, drivePositionImperatively, hitArea, interactiveChildren, rotation, x, y, zIndex],
  );

  const containerX = drivePositionImperatively ? 0 : x;
  const containerY = drivePositionImperatively ? 0 : y;
  const containerRotation = drivePositionImperatively ? 0 : rotation;
  const containerZIndex = drivePositionImperatively ? 0 : zIndex;

  return (
    <pixiContainer
      ref={bindContainer}
      x={containerX}
      y={containerY}
      rotation={containerRotation}
      zIndex={containerZIndex}
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerMove={disabled ? undefined : onPointerMove}
      onPointerOver={disabled ? undefined : onPointerOver}
      onPointerOut={disabled ? undefined : onPointerOut}
    >
      {children}
    </pixiContainer>
  );
});
