import { useApplication } from "@pixi/react";
import type { Container, FederatedPointerEvent } from "pixi.js";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSquishState,
  isSquishSettled,
  setSquishTarget,
  SQUISH_DRAG,
  SQUISH_GRAB,
  SQUISH_IDLE,
  stepSquish,
  type SquishState,
} from "@/ui/interaction/dragSquish";
import {
  decaySwing,
  smoothVelocity,
  stepSwing,
  swingFromVelocity,
  type DragSwingConfig,
} from "@/ui/interaction/dragSwing";
import {
  moveInArray,
  rowSlotCenter,
  slotIndexFromX,
  type rowMetrics,
} from "@/ui/interaction/rowLayout";

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

type DragSession = {
  pointerId: number;
  dieId: number;
  fromSlot: number;
  target: Container;
  parent: Container;
  offsetX: number;
  offsetY: number;
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

export type UseReorderableRowOptions = {
  layout: ReorderableRowLayout;
  order: number[];
  onOrderChange: (order: number[]) => void;
  disabled?: boolean;
  swing?: DragSwingConfig;
  snapLerp?: number;
  dragSnapLerp?: number;
};

export function useReorderableRow({
  layout,
  order,
  onOrderChange,
  disabled = false,
  swing,
  snapLerp = 0.22,
  dragSnapLerp = 0.38,
}: UseReorderableRowOptions) {
  const { app } = useApplication();
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const coastRef = useRef<Map<number, number>>(new Map());
  const squishRef = useRef<Map<number, SquishState>>(new Map());
  const positionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  // After drop, we keep lerping for a short moment so the dragged die
  // doesn't teleport to its final slot instantly.
  const dropSettlingUntilRef = useRef<number>(0);
  /** Layout order — updated on drop before React; do not overwrite from stale `order` prop. */
  const orderRef = useRef(order);

  useEffect(() => {
    if (!dragRef.current) {
      orderRef.current = order;
    }
  }, [order]);

  const slotHome = useCallback(
    (slotIndex: number) =>
      rowSlotCenter(slotIndex, layout.pitch, layout.originX, layout.rowY),
    [layout.originX, layout.pitch, layout.rowY],
  );

  const getPreviewOrder = useCallback((fromSlot: number, hoverSlot: number) => {
    const base = orderRef.current;
    return fromSlot === hoverSlot ? base : moveInArray(base, fromSlot, hoverSlot);
  }, []);

  // NOTE: we intentionally do not snap `positionsRef` to slot homes on drop.
  // During the short post-drop settling window we lerp from the last dragged
  // position to avoid "instant teleport" feel.

  const getPosition = useCallback((dieId: number, home: { x: number; y: number }) => {
    const cached = positionsRef.current.get(dieId);
    if (cached) {
      return cached;
    }
    positionsRef.current.set(dieId, home);
    return home;
  }, []);

  const endDrag = useCallback(
    (session: DragSession) => {
      const newOrder = getPreviewOrder(session.fromSlot, session.previewSlot);
      const orderChanged = session.fromSlot !== session.previewSlot;

      orderRef.current = newOrder;
      dropSettlingUntilRef.current = performance.now() + 180;

      coastRef.current.set(session.dieId, session.swing);
      const squish = squishRef.current.get(session.dieId);
      if (squish) {
        setSquishTarget(squish, SQUISH_IDLE);
      }
      dragRef.current = null;

      flushSync(() => {
        setDraggingSlot(null);
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

      const dieId = orderRef.current[slotIndex]!;
      const local = parent.toLocal(event.global);

      const session: DragSession = {
        pointerId: event.pointerId,
        dieId,
        fromSlot: slotIndex,
        target,
        parent,
        offsetX: local.x - target.x,
        offsetY: local.y - target.y,
        lastGlobalX: event.globalX,
        smoothVx: 0,
        targetSwing: 0,
        swing: coastRef.current.get(dieId) ?? 0,
        x: target.x,
        y: target.y,
        rotation: coastRef.current.get(dieId) ?? 0,
        previewSlot: slotIndex,
      };

      const squish = createSquishState(SQUISH_GRAB);
      squishRef.current.set(dieId, squish);
      setSquishTarget(squish, SQUISH_GRAB);

      dragRef.current = session;
      setDraggingSlot(slotIndex);
      target.cursor = "grabbing";

      let lifted = false;

      const liftTimer = window.setTimeout(() => {
        if (dragRef.current !== session) {
          return;
        }
        const state = squishRef.current.get(dieId);
        if (state) {
          setSquishTarget(state, SQUISH_DRAG);
          lifted = true;
        }
      }, 70);

      const onMove = (moveEvent: FederatedPointerEvent) => {
        if (
          moveEvent.pointerId !== session.pointerId ||
          dragRef.current !== session
        ) {
          return;
        }

        const moveLocal = parent.toLocal(moveEvent.global);
        const sampleVx = moveEvent.globalX - session.lastGlobalX;
        session.smoothVx = smoothVelocity(session.smoothVx, sampleVx, swing);
        session.lastGlobalX = moveEvent.globalX;
        session.targetSwing = swingFromVelocity(session.smoothVx, swing);

        session.x = moveLocal.x - session.offsetX;
        session.y = moveLocal.y - session.offsetY;

        session.previewSlot = slotIndexFromX(
          session.x,
          layout.count,
          layout.pitch,
          layout.originX,
        );

        if (!lifted) {
          lifted = true;
          const state = squishRef.current.get(session.dieId);
          if (state) {
            setSquishTarget(state, SQUISH_DRAG);
          }
        }

        positionsRef.current.set(session.dieId, { x: session.x, y: session.y });
      };

      const onUp = (upEvent: FederatedPointerEvent) => {
        if (
          upEvent.pointerId !== session.pointerId ||
          dragRef.current !== session
        ) {
          return;
        }

        window.clearTimeout(liftTimer);
        app.stage.off("globalpointermove", onMove);
        app.stage.off("pointerup", onUp);
        app.stage.off("pointerupoutside", onUp);
        target.off("globalpointermove", onMove);
        target.off("pointerup", onUp);
        target.off("pointerupoutside", onUp);
        target.cursor = "grab";
        endDrag(session);
      };

      app.stage.on("globalpointermove", onMove);
      app.stage.on("pointerup", onUp);
      app.stage.on("pointerupoutside", onUp);
      target.on("globalpointermove", onMove);
      target.on("pointerup", onUp);
      target.on("pointerupoutside", onUp);
    },
    [app.stage, disabled, endDrag, layout.count, layout.originX, layout.pitch, swing],
  );

  const tickLayout = useCallback(
    (apply: (slotIndex: number, dieId: number, visual: ItemVisual) => void) => {
      const session = dragRef.current;
      const activeOrder = session
        ? getPreviewOrder(session.fromSlot, session.previewSlot)
        : orderRef.current;
      const settling = !session && performance.now() < dropSettlingUntilRef.current;
      const lerp = session || settling ? dragSnapLerp : snapLerp;
      const isSettled = !session && !settling;
      const dt = 1 / 60;

      if (session) {
        session.swing = stepSwing(session.swing, session.targetSwing, swing);
        session.rotation = session.swing;
      }

      for (let slotIndex = 0; slotIndex < layout.count; slotIndex++) {
        const dieId = activeOrder[slotIndex]!;
        const home = slotHome(slotIndex);

        let squish = squishRef.current.get(dieId);
        if (squish) {
          stepSquish(squish, dt);
          if (!session && isSquishSettled(squish)) {
            squishRef.current.delete(dieId);
            squish = undefined;
          }
        }

        const scaleX = squish?.scaleX ?? 1;
        const scaleY = squish?.scaleY ?? 1;

        if (session?.dieId === dieId) {
          apply(slotIndex, dieId, {
            x: session.x,
            y: session.y,
            rotation: session.rotation,
            zIndex: 1000,
            scaleX,
            scaleY,
          });
          continue;
        }

        const current = getPosition(dieId, home);
        let rotation = coastRef.current.get(dieId) ?? 0;

        if (Math.abs(rotation) > 0.002) {
          rotation = decaySwing(rotation, swing);
          coastRef.current.set(dieId, rotation);
        } else {
          coastRef.current.delete(dieId);
          rotation = 0;
        }

        const x = isSettled
          ? home.x
          : current.x + (home.x - current.x) * lerp;
        const y = isSettled
          ? home.y
          : current.y + (home.y - current.y) * lerp;

        positionsRef.current.set(dieId, { x, y });

        if (!isSettled && Math.abs(home.x - x) < 0.4 && Math.abs(home.y - y) < 0.4) {
          positionsRef.current.set(dieId, home);
        }

        apply(slotIndex, dieId, {
          x,
          y,
          rotation,
          zIndex: slotIndex,
          scaleX,
          scaleY,
        });
      }
    },
    [
      dragSnapLerp,
      getPosition,
      getPreviewOrder,
      layout.count,
      slotHome,
      snapLerp,
      swing,
    ],
  );

  const slotHomeForOrder = useCallback(
    (slotIndex: number) => slotHome(slotIndex),
    [slotHome],
  );

  return {
    onPointerDown,
    tickLayout,
    slotHome: slotHomeForOrder,
    draggingSlot,
  };
}
