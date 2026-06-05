import { useApplication } from '@pixi/react';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createSquishState,
  isSquishSettled,
  setSquishTarget,
  snapSquish,
  SQUISH_DRAG,
  SQUISH_GRAB,
  SQUISH_IDLE,
  stepSquish,
  type SquishState,
  type SquishTargets,
} from '@/ui/interaction/spring';
import {
  decaySwing,
  smoothVelocity,
  stepSwing,
  swingFromVelocity,
  type DragSwingConfig,
} from '@/ui/interaction/dragSwing';
import { moveInArray, rowSlotCenter, slotIndexFromX, type rowMetrics } from '@/ui/interaction/rowLayout';

export type ReorderableRowLayout = ReturnType<typeof rowMetrics> & {
  rowY: number;
  count: number;
};

export type ItemVisual = {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  scaleX: number;
  scaleY: number;
};

export type RowDragSession = {
  itemId: number;
  fromSlot: number;
};

export type RowLayoutMeta = {
  dragSession: RowDragSession | null;
  dropSettlingItemId: number | null;
};

type DragSession = {
  pointerId: number;
  itemId: number;
  fromSlot: number;
  target: Container;
  parent: Container;
  offsetX: number;
  offsetY: number;
  downGlobalX: number;
  downGlobalY: number;
  activated: boolean;
  lastGlobalX: number;
  smoothVx: number;
  /** Swing target from pointer velocity — stepped toward each frame in `tickLayout`. */
  targetSwing: number;
  swing: number;
  x: number;
  y: number;
  rotation: number;
  previewSlot: number;
};

const DEFAULT_DRAG_THRESHOLD = 8;
/** Safety cap for post-drop lerp; settling ends when position is within epsilon. */
const DROP_SETTLE_MAX_MS = 600;
const DROP_SETTLE_POSITION_EPS = 1.5;

export type UseReorderableRowOptions = {
  layout: ReorderableRowLayout;
  order: number[];
  onOrderChange: (order: number[]) => void;
  disabled?: boolean;
  swing?: DragSwingConfig;
  snapLerp?: number;
  dragSnapLerp?: number;
  /** Pixels before pointer movement counts as drag instead of tap. */
  dragThreshold?: number;
  /** Fired on pointer up when movement stayed below `dragThreshold`. */
  onItemTap?: (slotIndex: number, itemId: number, event: FederatedPointerEvent) => void;
  squishGrab?: SquishTargets;
  squishDrag?: SquishTargets;
};

export function useReorderableRow({
  layout,
  order,
  onOrderChange,
  disabled = false,
  swing,
  snapLerp = 0.22,
  dragSnapLerp = 0.38,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  onItemTap,
  squishGrab = SQUISH_GRAB,
  squishDrag = SQUISH_DRAG,
}: UseReorderableRowOptions) {
  const { app } = useApplication();
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [pressingItemId, setPressingItemId] = useState<number | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const coastRef = useRef<Map<number, number>>(new Map());
  const squishRef = useRef<Map<number, SquishState>>(new Map());
  const positionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  // After drop, we keep lerping for a short moment so the dragged die
  // doesn't teleport to its final slot instantly.
  const dropSettlingUntilRef = useRef<number>(0);
  const dropSettlingItemIdRef = useRef<number | null>(null);
  /** Layout order — updated on drop before React; do not overwrite from stale `order` prop. */
  const orderRef = useRef(order);

  useEffect(() => {
    if (!dragRef.current) {
      orderRef.current = order;
    }
  }, [order]);

  const slotHome = useCallback(
    (slotIndex: number) => rowSlotCenter(slotIndex, layout.pitch, layout.originX, layout.rowY),
    [layout.originX, layout.pitch, layout.rowY],
  );

  const getPreviewOrder = useCallback((fromSlot: number, hoverSlot: number) => {
    const base = orderRef.current;
    return fromSlot === hoverSlot ? base : moveInArray(base, fromSlot, hoverSlot);
  }, []);

  // NOTE: we intentionally do not snap `positionsRef` to slot homes on drop.
  // During the short post-drop settling window we lerp from the last dragged
  // position to avoid "instant teleport" feel.

  const getPosition = useCallback((itemId: number, home: { x: number; y: number }) => {
    const cached = positionsRef.current.get(itemId);
    if (cached) {
      return cached;
    }
    positionsRef.current.set(itemId, home);
    return home;
  }, []);

  const endDrag = useCallback(
    (session: DragSession) => {
      const newOrder = getPreviewOrder(session.fromSlot, session.previewSlot);
      const orderChanged = session.fromSlot !== session.previewSlot;

      orderRef.current = newOrder;
      dropSettlingUntilRef.current = performance.now() + DROP_SETTLE_MAX_MS;
      dropSettlingItemIdRef.current = session.itemId;

      coastRef.current.set(session.itemId, session.swing);
      const squish = squishRef.current.get(session.itemId);
      if (squish) {
        setSquishTarget(squish, SQUISH_IDLE);
      }
      dragRef.current = null;

      flushSync(() => {
        setDraggingSlot(null);
        setPressingItemId(null);
        if (orderChanged) {
          onOrderChange(newOrder);
        }
      });
    },
    [getPreviewOrder, onOrderChange],
  );

  const onPointerDown = useCallback(
    (slotIndex: number, event: FederatedPointerEvent) => {
      if (disabled || dragRef.current) {
        return;
      }

      event.stopPropagation();

      const target = event.currentTarget as Container;
      const parent = target.parent as Container | null;
      if (!parent) {
        return;
      }

      const itemId = orderRef.current[slotIndex]!;
      const local = parent.toLocal(event.global);

      const session: DragSession = {
        pointerId: event.pointerId,
        itemId,
        fromSlot: slotIndex,
        target,
        parent,
        offsetX: local.x - target.x,
        offsetY: local.y - target.y,
        downGlobalX: event.globalX,
        downGlobalY: event.globalY,
        activated: false,
        lastGlobalX: event.globalX,
        smoothVx: 0,
        targetSwing: 0,
        swing: coastRef.current.get(itemId) ?? 0,
        x: target.x,
        y: target.y,
        rotation: coastRef.current.get(itemId) ?? 0,
        previewSlot: slotIndex,
      };

      dragRef.current = session;
      setPressingItemId(itemId);

      const squish = createSquishState(squishGrab);
      snapSquish(squish, squishGrab);
      squishRef.current.set(itemId, squish);

      let lifted = false;
      let liftTimer: number | undefined;

      liftTimer = window.setTimeout(() => {
        if (dragRef.current !== session) {
          return;
        }
        const state = squishRef.current.get(itemId);
        if (state) {
          setSquishTarget(state, squishDrag);
          lifted = true;
        }
      }, 70);

      const activateDrag = () => {
        if (session.activated) {
          return;
        }
        session.activated = true;
        setDraggingSlot(slotIndex);
        target.cursor = 'grabbing';

        if (!lifted) {
          const state = squishRef.current.get(itemId);
          if (state) {
            setSquishTarget(state, squishDrag);
            lifted = true;
          }
        }
      };

      const onMove = (moveEvent: FederatedPointerEvent) => {
        if (moveEvent.pointerId !== session.pointerId || dragRef.current !== session) {
          return;
        }

        if (!session.activated) {
          const dx = moveEvent.globalX - session.downGlobalX;
          const dy = moveEvent.globalY - session.downGlobalY;
          if (dx * dx + dy * dy < dragThreshold * dragThreshold) {
            return;
          }
          activateDrag();
        }

        const moveLocal = parent.toLocal(moveEvent.global);
        const sampleVx = moveEvent.globalX - session.lastGlobalX;
        session.smoothVx = smoothVelocity(session.smoothVx, sampleVx, swing);
        session.lastGlobalX = moveEvent.globalX;
        session.targetSwing = swingFromVelocity(session.smoothVx, swing);

        session.x = moveLocal.x - session.offsetX;
        session.y = moveLocal.y - session.offsetY;

        session.previewSlot = slotIndexFromX(session.x, layout.count, layout.pitch, layout.originX);

        if (!lifted) {
          lifted = true;
          const state = squishRef.current.get(session.itemId);
          if (state) {
            setSquishTarget(state, squishDrag);
          }
        }

        positionsRef.current.set(session.itemId, { x: session.x, y: session.y });
      };

      const cleanupListeners = () => {
        if (liftTimer !== undefined) {
          window.clearTimeout(liftTimer);
        }
        app.stage.off('globalpointermove', onMove);
        app.stage.off('pointerup', onUp);
        app.stage.off('pointerupoutside', onUp);
        target.off('globalpointermove', onMove);
        target.off('pointerup', onUp);
        target.off('pointerupoutside', onUp);
      };

      const onUp = (upEvent: FederatedPointerEvent) => {
        if (upEvent.pointerId !== session.pointerId || dragRef.current !== session) {
          return;
        }

        cleanupListeners();

        if (!session.activated) {
          const squish = squishRef.current.get(session.itemId);
          if (squish) {
            setSquishTarget(squish, SQUISH_IDLE);
          }
          onItemTap?.(session.fromSlot, session.itemId, upEvent);
          dragRef.current = null;
          setPressingItemId(null);
          return;
        }

        target.cursor = 'grab';
        endDrag(session);
      };

      app.stage.on('globalpointermove', onMove);
      app.stage.on('pointerup', onUp);
      app.stage.on('pointerupoutside', onUp);
      target.on('globalpointermove', onMove);
      target.on('pointerup', onUp);
      target.on('pointerupoutside', onUp);
    },
    [
      app.stage,
      disabled,
      dragThreshold,
      endDrag,
      layout.count,
      layout.originX,
      layout.pitch,
      onItemTap,
      squishDrag,
      squishGrab,
      swing,
    ],
  );

  const tickLayout = useCallback(
    (apply: (slotIndex: number, itemId: number, visual: ItemVisual, meta: RowLayoutMeta) => void) => {
      const session = dragRef.current?.activated ? dragRef.current : null;
      const activeOrder = session ? getPreviewOrder(session.fromSlot, session.previewSlot) : orderRef.current;
      const timeSettling = !session && performance.now() < dropSettlingUntilRef.current;

      let dropPositionSettling = false;
      const settlingItemId = dropSettlingItemIdRef.current;
      if (!session && settlingItemId !== null) {
        const settlingSlot = activeOrder.indexOf(settlingItemId);
        if (settlingSlot < 0) {
          dropSettlingItemIdRef.current = null;
        } else {
          const settleHome = slotHome(settlingSlot);
          const settlePos = getPosition(settlingItemId, settleHome);
          const settleDist = Math.hypot(settlePos.x - settleHome.x, settlePos.y - settleHome.y);
          if (settleDist < DROP_SETTLE_POSITION_EPS) {
            dropSettlingItemIdRef.current = null;
            positionsRef.current.set(settlingItemId, settleHome);
          } else {
            dropPositionSettling = true;
          }
        }
      }

      const settling = session !== null || timeSettling || dropPositionSettling;
      const lerp = settling ? dragSnapLerp : snapLerp;
      const isSettled = !settling;
      const dt = 1 / 60;

      if (session) {
        session.swing = stepSwing(session.swing, session.targetSwing, swing);
        session.rotation = session.swing;
      }

      const layoutMeta: RowLayoutMeta = {
        dragSession: session ? { itemId: session.itemId, fromSlot: session.fromSlot } : null,
        dropSettlingItemId: dropSettlingItemIdRef.current,
      };

      for (let slotIndex = 0; slotIndex < layout.count; slotIndex++) {
        const itemId = activeOrder[slotIndex]!;
        const home = slotHome(slotIndex);

        let squish = squishRef.current.get(itemId);
        if (squish) {
          stepSquish(squish, dt);
          const settledToIdle =
            isSquishSettled(squish) && squish.targetX === SQUISH_IDLE.scaleX && squish.targetY === SQUISH_IDLE.scaleY;
          if (!session && settledToIdle) {
            squishRef.current.delete(itemId);
            squish = undefined;
          }
        }

        const scaleX = squish?.scaleX ?? 1;
        const scaleY = squish?.scaleY ?? 1;

        if (session?.itemId === itemId) {
          apply(
            slotIndex,
            itemId,
            {
              x: session.x,
              y: session.y,
              rotation: session.rotation,
              zIndex: 1000,
              scaleX,
              scaleY,
            },
            layoutMeta,
          );
          continue;
        }

        const current = getPosition(itemId, home);
        let rotation = coastRef.current.get(itemId) ?? 0;

        if (Math.abs(rotation) > 0.002) {
          rotation = decaySwing(rotation, swing);
          coastRef.current.set(itemId, rotation);
        } else {
          coastRef.current.delete(itemId);
          rotation = 0;
        }

        const x = isSettled ? home.x : current.x + (home.x - current.x) * lerp;
        const y = isSettled ? home.y : current.y + (home.y - current.y) * lerp;

        positionsRef.current.set(itemId, { x, y });

        if (!isSettled && Math.abs(home.x - x) < 0.4 && Math.abs(home.y - y) < 0.4) {
          positionsRef.current.set(itemId, home);
        }

        apply(
          slotIndex,
          itemId,
          {
            x,
            y,
            rotation,
            zIndex: slotIndex,
            scaleX,
            scaleY,
          },
          layoutMeta,
        );
      }
    },
    [dragSnapLerp, getPosition, getPreviewOrder, layout.count, slotHome, snapLerp, swing],
  );

  const slotHomeForOrder = useCallback((slotIndex: number) => slotHome(slotIndex), [slotHome]);

  return {
    onPointerDown,
    tickLayout,
    slotHome: slotHomeForOrder,
    draggingSlot,
    pressingItemId,
  };
}
