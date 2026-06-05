import { useApplication } from '@pixi/react';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playSfx } from '@/ui/audio/sfx';
import { easeOutBack, easeOutQuad } from '@/ui/interaction/easing';
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
  alpha: number;
};

export type RowDragSession<ItemId extends string | number = number> = {
  itemId: ItemId;
  fromSlot: number;
};

export type RowLayoutMeta<ItemId extends string | number = number> = {
  dragSession: RowDragSession<ItemId> | null;
  dropSettlingItemId: ItemId | null;
};

export type ApplyOrderOptions = {
  animated?: boolean;
  durationMs?: number;
};

export type HandFlyInOptions<ItemId extends string | number> = {
  order: ItemId[];
  newItemIds: ItemId[];
  launchPoint: { x: number; y: number };
  /** Row metrics for the full target hand — must match `order.length`. */
  targetLayout: ReorderableRowLayout;
  onComplete?: () => void;
};

type DragSession<ItemId extends string | number> = {
  pointerId: number;
  itemId: ItemId;
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
  targetSwing: number;
  swing: number;
  x: number;
  y: number;
  rotation: number;
  previewSlot: number;
};

type ProgrammaticMove<ItemId extends string | number> = {
  startedAt: number;
  durationMs: number;
  starts: Map<ItemId, { x: number; y: number }>;
  targets: Map<ItemId, { x: number; y: number }>;
};

type FlyInDie<ItemId extends string | number> = {
  itemId: ItemId;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delayMs: number;
  durationMs: number;
};

type FlyInSession<ItemId extends string | number> = {
  startedAt: number;
  items: FlyInDie<ItemId>[];
  onComplete?: () => void;
};

const DEFAULT_DRAG_THRESHOLD = 8;
const DROP_SETTLE_MAX_MS = 600;
const DROP_SETTLE_POSITION_EPS = 1.5;
const DEFAULT_SORT_DURATION_MS = 250;
const FLYIN_DURATION_MS = 320;
const FLYIN_STAGGER_MS = 90;
const FLYIN_START_SCALE = 0.2;
const CARRYOVER_REPOSITION_MS = 250;
const REPOSITION_EPS = 1.5;

export type RowReorderMove<ItemId extends string | number = number> = {
  itemId: ItemId;
  fromSlot: number;
  toSlot: number;
  /** Item id that occupied the destination slot before the drag. */
  targetId: ItemId;
};

export type UseReorderableRowOptions<ItemId extends string | number = number> = {
  layout: ReorderableRowLayout;
  order: ItemId[];
  onOrderChange: (order: ItemId[], move?: RowReorderMove<ItemId>) => void;
  /** When this changes, cached drag positions reset (e.g. store revision after reorder). */
  orderRevision?: string;
  disabled?: boolean;
  swing?: DragSwingConfig;
  snapLerp?: number;
  dragSnapLerp?: number;
  dragThreshold?: number;
  onItemTap?: (slotIndex: number, itemId: ItemId, event: FederatedPointerEvent) => void;
  squishGrab?: SquishTargets;
  squishDrag?: SquishTargets;
};

export function useReorderableRow<ItemId extends string | number = number>({
  layout,
  order,
  onOrderChange,
  orderRevision,
  disabled = false,
  swing,
  snapLerp = 0.22,
  dragSnapLerp = 0.38,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  onItemTap,
  squishGrab = SQUISH_GRAB,
  squishDrag = SQUISH_DRAG,
}: UseReorderableRowOptions<ItemId>) {
  const { app } = useApplication();
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [pressingItemId, setPressingItemId] = useState<ItemId | null>(null);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const dragRef = useRef<DragSession<ItemId> | null>(null);
  const coastRef = useRef<Map<ItemId, number>>(new Map());
  const squishRef = useRef<Map<ItemId, SquishState>>(new Map());
  const positionsRef = useRef<Map<ItemId, { x: number; y: number }>>(new Map());
  const alphaRef = useRef<Map<ItemId, number>>(new Map());
  const flyInScaleRef = useRef<Map<ItemId, number>>(new Map());
  const dropSettlingUntilRef = useRef<number>(0);
  const dropSettlingItemIdRef = useRef<ItemId | null>(null);
  const orderRef = useRef(order);
  const orderKeyRef = useRef(order.join('|'));
  const programmaticMoveRef = useRef<ProgrammaticMove<ItemId> | null>(null);
  const flyInSessionRef = useRef<FlyInSession<ItemId> | null>(null);
  const pendingFlyInRef = useRef<FlyInSession<ItemId> | null>(null);
  const handRefillLayoutRef = useRef<ReorderableRowLayout | null>(null);
  const flyInSoundsPlayedRef = useRef<Set<ItemId>>(new Set());
  const skipOrderSyncClearRef = useRef(false);
  const orderRevisionRef = useRef(orderRevision);

  const clearDragCaches = useCallback(() => {
    positionsRef.current.clear();
    coastRef.current.clear();
    dropSettlingItemIdRef.current = null;
    dropSettlingUntilRef.current = 0;
  }, []);

  const slotHome = useCallback(
    (slotIndex: number) => rowSlotCenter(slotIndex, layout.pitch, layout.originX, layout.rowY),
    [layout.originX, layout.pitch, layout.rowY],
  );

  const slotHomeForLayout = useCallback((slotIndex: number, rowLayout: ReorderableRowLayout) => {
    return rowSlotCenter(slotIndex, rowLayout.pitch, rowLayout.originX, rowLayout.rowY);
  }, []);

  const activeRowLayout = useCallback((): ReorderableRowLayout => {
    return handRefillLayoutRef.current ?? layout;
  }, [layout]);

  const updateRepositioningState = useCallback(() => {
    const active =
      programmaticMoveRef.current !== null ||
      flyInSessionRef.current !== null ||
      pendingFlyInRef.current !== null;
    setIsRepositioning(active);
  }, []);

  const applyOrder = useCallback(
    (nextOrder: ItemId[], options: ApplyOrderOptions = {}) => {
      if (dragRef.current) {
        return;
      }

      const nextKey = nextOrder.join('|');
      if (nextKey === orderKeyRef.current) {
        return;
      }

      const oldOrder = orderRef.current;
      orderKeyRef.current = nextKey;
      orderRef.current = nextOrder;
      skipOrderSyncClearRef.current = true;
      onOrderChange(nextOrder);

      if (!options.animated) {
        positionsRef.current.clear();
        coastRef.current.clear();
        dropSettlingItemIdRef.current = null;
        dropSettlingUntilRef.current = 0;
        return;
      }

      const durationMs = options.durationMs ?? DEFAULT_SORT_DURATION_MS;
      const starts = new Map<ItemId, { x: number; y: number }>();
      const targets = new Map<ItemId, { x: number; y: number }>();

      for (let slotIndex = 0; slotIndex < nextOrder.length; slotIndex++) {
        const itemId = nextOrder[slotIndex]!;
        const target = slotHome(slotIndex);
        targets.set(itemId, target);

        const cached = positionsRef.current.get(itemId);
        if (cached) {
          starts.set(itemId, cached);
        } else {
          const oldSlot = oldOrder.indexOf(itemId);
          const start = oldSlot >= 0 ? slotHome(oldSlot) : target;
          starts.set(itemId, start);
          positionsRef.current.set(itemId, start);
        }
      }

      programmaticMoveRef.current = {
        startedAt: performance.now(),
        durationMs,
        starts,
        targets,
      };
      updateRepositioningState();
    },
    [onOrderChange, slotHome, updateRepositioningState],
  );

  /** Pouch fly-in for replacement dice — call from playback runner via `requestHandRefillFlyIn`. */
  const beginHandFlyIn = useCallback(
    ({ order: nextOrder, newItemIds, launchPoint, targetLayout, onComplete }: HandFlyInOptions<ItemId>) => {
      if (dragRef.current) {
        onComplete?.();
        return;
      }

      const newIdSet = new Set(newItemIds);
      const nextKey = nextOrder.join('|');
      orderKeyRef.current = nextKey;
      orderRef.current = nextOrder;
      skipOrderSyncClearRef.current = true;
      handRefillLayoutRef.current = targetLayout;
      flushSync(() => onOrderChange(nextOrder));

      if (newItemIds.length === 0) {
        handRefillLayoutRef.current = null;
        onComplete?.();
        return;
      }

      const slotAt = (slotIndex: number) => slotHomeForLayout(slotIndex, targetLayout);
      const flyItems: FlyInDie<ItemId>[] = [];
      const carryoverStarts = new Map<ItemId, { x: number; y: number }>();
      const carryoverTargets = new Map<ItemId, { x: number; y: number }>();
      let needsCarryoverMove = false;

      for (let slotIndex = 0; slotIndex < nextOrder.length; slotIndex++) {
        const itemId = nextOrder[slotIndex]!;
        const target = slotAt(slotIndex);

        if (newIdSet.has(itemId)) {
          positionsRef.current.set(itemId, { x: launchPoint.x, y: launchPoint.y });
          alphaRef.current.set(itemId, 0);
          flyInScaleRef.current.set(itemId, FLYIN_START_SCALE);
          flyItems.push({
            itemId,
            fromX: launchPoint.x,
            fromY: launchPoint.y,
            toX: target.x,
            toY: target.y,
            delayMs: 0,
            durationMs: FLYIN_DURATION_MS,
          });
          continue;
        }

        const cached = positionsRef.current.get(itemId) ?? target;
        positionsRef.current.set(itemId, cached);
        alphaRef.current.set(itemId, 1);
        const dist = Math.hypot(cached.x - target.x, cached.y - target.y);
        if (dist > REPOSITION_EPS) {
          needsCarryoverMove = true;
          carryoverStarts.set(itemId, cached);
          carryoverTargets.set(itemId, target);
        } else {
          positionsRef.current.set(itemId, target);
        }
      }

      const flyInBaseDelay = needsCarryoverMove ? CARRYOVER_REPOSITION_MS : 0;
      for (let i = 0; i < flyItems.length; i++) {
        flyItems[i]!.delayMs = flyInBaseDelay + i * FLYIN_STAGGER_MS;
      }

      flyInSoundsPlayedRef.current = new Set();
      pendingFlyInRef.current = null;

      const flyInSession: FlyInSession<ItemId> = {
        startedAt: performance.now(),
        items: flyItems,
        onComplete: () => {
          handRefillLayoutRef.current = null;
          onComplete?.();
        },
      };

      if (needsCarryoverMove) {
        programmaticMoveRef.current = {
          startedAt: performance.now(),
          durationMs: CARRYOVER_REPOSITION_MS,
          starts: carryoverStarts,
          targets: carryoverTargets,
        };
        pendingFlyInRef.current = flyInSession;
      } else {
        flyInSessionRef.current = flyInSession;
      }

      updateRepositioningState();
    },
    [onOrderChange, slotHomeForLayout, updateRepositioningState],
  );

  useEffect(() => {
    if (orderRevision === undefined || orderRevisionRef.current === orderRevision) {
      return;
    }
    orderRevisionRef.current = orderRevision;
    if (dragRef.current) {
      return;
    }
    orderKeyRef.current = order.join('|');
    orderRef.current = order;
    clearDragCaches();
  }, [clearDragCaches, order, orderRevision]);

  useEffect(() => {
    if (dragRef.current || skipOrderSyncClearRef.current) {
      skipOrderSyncClearRef.current = false;
      return;
    }

    const nextKey = order.join('|');
    if (nextKey === orderKeyRef.current) {
      return;
    }

    orderKeyRef.current = nextKey;
    orderRef.current = order;
    clearDragCaches();
  }, [clearDragCaches, order]);

  const getPreviewOrder = useCallback((fromSlot: number, hoverSlot: number) => {
    const base = orderRef.current;
    return fromSlot === hoverSlot ? base : moveInArray(base, fromSlot, hoverSlot);
  }, []);

  const getPosition = useCallback((itemId: ItemId, home: { x: number; y: number }) => {
    const cached = positionsRef.current.get(itemId);
    if (cached) {
      return cached;
    }
    positionsRef.current.set(itemId, home);
    return home;
  }, []);

  const getItemAlpha = useCallback((itemId: ItemId): number => {
    return alphaRef.current.get(itemId) ?? 1;
  }, []);

  const endDrag = useCallback(
    (session: DragSession<ItemId>) => {
      const oldOrder = orderRef.current;
      const newOrder = getPreviewOrder(session.fromSlot, session.previewSlot);
      const orderChanged = session.fromSlot !== session.previewSlot;

      orderKeyRef.current = newOrder.join('|');
      orderRef.current = newOrder;
      dropSettlingUntilRef.current = performance.now() + DROP_SETTLE_MAX_MS;
      dropSettlingItemIdRef.current = session.itemId;

      if (orderChanged) {
        playSfx('diceRoll', { volume: 0.2 });
      }

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
          const targetId = oldOrder[session.previewSlot]!;
          onOrderChange(newOrder, {
            itemId: session.itemId,
            fromSlot: session.fromSlot,
            toSlot: session.previewSlot,
            targetId,
          });
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

      const session: DragSession<ItemId> = {
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

  const stepProgrammaticMove = useCallback(() => {
    const move = programmaticMoveRef.current;
    if (!move) {
      return false;
    }

    const elapsed = performance.now() - move.startedAt;
    const progress = Math.min(elapsed / move.durationMs, 1);
    const eased = easeOutQuad(progress);

    for (const [itemId, target] of move.targets) {
      const start = move.starts.get(itemId) ?? target;
      const x = start.x + (target.x - start.x) * eased;
      const y = start.y + (target.y - start.y) * eased;
      positionsRef.current.set(itemId, { x, y });
    }

    if (progress >= 1) {
      for (const [itemId, target] of move.targets) {
        positionsRef.current.set(itemId, target);
      }
      programmaticMoveRef.current = null;

      const pendingFlyIn = pendingFlyInRef.current;
      if (pendingFlyIn) {
        pendingFlyInRef.current = null;
        pendingFlyIn.startedAt = performance.now();
        flyInSessionRef.current = pendingFlyIn;
      }

      updateRepositioningState();
      return false;
    }

    return true;
  }, [updateRepositioningState]);

  const tickLayout = useCallback(
    (apply: (slotIndex: number, itemId: ItemId, visual: ItemVisual, meta: RowLayoutMeta<ItemId>) => void) => {
      stepProgrammaticMove();

      const flySession = flyInSessionRef.current;
      if (flySession) {
        const now = performance.now();
        let allComplete = true;

        for (const item of flySession.items) {
          const itemElapsed = now - flySession.startedAt - item.delayMs;
          if (itemElapsed < 0) {
            allComplete = false;
            positionsRef.current.set(item.itemId, { x: item.fromX, y: item.fromY });
            alphaRef.current.set(item.itemId, 0);
            flyInScaleRef.current.set(item.itemId, FLYIN_START_SCALE);
            continue;
          }

          if (!flyInSoundsPlayedRef.current.has(item.itemId)) {
            flyInSoundsPlayedRef.current.add(item.itemId);
            playSfx('card1', { volume: 0.35 });
          }

          const progress = Math.min(itemElapsed / item.durationMs, 1);
          const eased = easeOutBack(progress);
          const x = item.fromX + (item.toX - item.fromX) * eased;
          const y = item.fromY + (item.toY - item.fromY) * eased;
          positionsRef.current.set(item.itemId, { x, y });
          alphaRef.current.set(item.itemId, eased);
          flyInScaleRef.current.set(item.itemId, FLYIN_START_SCALE + (1 - FLYIN_START_SCALE) * eased);

          if (progress < 1) {
            allComplete = false;
          } else {
            alphaRef.current.set(item.itemId, 1);
            flyInScaleRef.current.delete(item.itemId);
          }
        }

        if (allComplete) {
          const onComplete = flySession.onComplete;
          flyInSessionRef.current = null;
          updateRepositioningState();
          onComplete?.();
        }
      }

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

      const rowLayout = activeRowLayout();
      const slotHomeActive = (slotIndex: number) => slotHomeForLayout(slotIndex, rowLayout);

      const programmaticActive = programmaticMoveRef.current !== null;
      const flyInActive = flyInSessionRef.current !== null;
      const pendingFlyInActive = pendingFlyInRef.current !== null;
      const settling =
        session !== null ||
        timeSettling ||
        dropPositionSettling ||
        programmaticActive ||
        flyInActive ||
        pendingFlyInActive;
      const lerp = settling ? dragSnapLerp : snapLerp;
      const isSettled = !settling;
      const dt = 1 / 60;

      if (session) {
        session.swing = stepSwing(session.swing, session.targetSwing, swing);
        session.rotation = session.swing;
      }

      const layoutMeta: RowLayoutMeta<ItemId> = {
        dragSession: session ? { itemId: session.itemId, fromSlot: session.fromSlot } : null,
        dropSettlingItemId: dropSettlingItemIdRef.current,
      };

      const slotCount = Math.max(rowLayout.count, activeOrder.length);
      for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
        const itemId = activeOrder[slotIndex];
        if (itemId === undefined) {
          continue;
        }
        const home = slotHomeActive(slotIndex);

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

        const flyScale = flyInScaleRef.current.get(itemId);
        const scaleX = (squish?.scaleX ?? 1) * (flyScale ?? 1);
        const scaleY = (squish?.scaleY ?? 1) * (flyScale ?? 1);
        const alpha = getItemAlpha(itemId);

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
              alpha,
            },
            layoutMeta,
          );
          continue;
        }

        if (programmaticActive || flyInActive || pendingFlyInActive) {
          const pos = getPosition(itemId, home);
          apply(
            slotIndex,
            itemId,
            {
              x: pos.x,
              y: pos.y,
              rotation: 0,
              zIndex: slotIndex,
              scaleX,
              scaleY,
              alpha,
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
            alpha,
          },
          layoutMeta,
        );
      }
    },
    [
      dragSnapLerp,
      getItemAlpha,
      getPosition,
      getPreviewOrder,
      activeRowLayout,
      layout.count,
      slotHome,
      slotHomeForLayout,
      snapLerp,
      stepProgrammaticMove,
      swing,
      updateRepositioningState,
    ],
  );

  const slotHomeForOrder = useCallback((slotIndex: number) => slotHome(slotIndex), [slotHome]);

  return {
    onPointerDown,
    tickLayout,
    slotHome: slotHomeForOrder,
    draggingSlot,
    pressingItemId,
    applyOrder,
    beginHandFlyIn,
    isRepositioning,
  };
}
