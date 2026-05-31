import { useApplication } from "@pixi/react";
import {
  DEG_TO_RAD,
  Rectangle,
  type Container,
  type FederatedPointerEvent,
  type Filter,
  type Graphics,
  type PerspectiveMesh,
  type Sprite,
  type Text,
  type Texture,
} from "pixi.js";
import { useTick } from "@pixi/react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ACTION_TAB_HEIGHT,
  ACTION_TAB_VISIBLE_HEIGHT,
  CARD_HOVER_SCALE,
  CARD_LIFT_PX,
  CARD_OWNED_ENLARGED_SCALE,
  CARD_SELECTED_Z_INDEX,
  SELL_TAB_HEIGHT,
  SELL_TAB_WIDTH,
  TAB_WIDTH,
  type CardDisplayMode,
} from "@/ui/components/Card/config";
import {
  ACTION_TAB_TEXT_Y,
  actionTabAnchorY,
  drawBottomActionTab,
  drawBottomActionTabShadow,
  drawPriceTab,
  drawSellTab,
  drawSellTabShadow,
  formatPrice,
  formatSellLabel,
  priceTabAnchorY,
  priceTabTextStyle,
  sellTabAnchorX,
  sellTabInnerX,
  SELL_TAB_TEXT_X,
  sellTabTextStyle,
  tabTextStyle,
} from "@/ui/components/Card/cardTab";
import {
  createScalarSpring,
  createSquishState,
  setScalarTarget,
  setSquishTarget,
  snapSquish,
  SQUISH_IDLE,
  SQUISH_LIFT,
  stepScalarSpring,
  stepSquish,
  type ScalarSpringState,
  type SquishState,
} from "@/ui/interaction/spring";
import {
  applyTiltToMesh,
  createUnitCorners,
  pointerToTiltAngles,
  resetMeshCorners,
  type PerspectiveTiltConfig,
} from "@/ui/pixi/perspectiveTilt";
import { getEffectTexture } from "@/assets/effects/textures";
import {
  burnDestroyDissolveAt,
  createBurnDissolveFilter,
  BURN_DESTROY,
  type BurnDissolveFilter,
} from "@/ui/actionEffects/burnDissolveFilter";
import type { ActionEffectComplete } from "@/ui/actionEffects/types";
import { EffectMount } from "@/ui/effects/EffectMount";
import { createDefaultEffectFrame } from "@/ui/effects/context";
import type { EffectFrameContext, EffectId } from "@/ui/effects/types";

export const DEFAULT_CARD_WIDTH = 150;
export const DEFAULT_CARD_HEIGHT = 210;

const IDLE_DEGREES = 1.5;
const IDLE_SPEED = 1.05;
/** Subtle perspective-mesh sway when not hovered (degrees, same space as pointer tilt). */
const IDLE_MESH_TILT_DEGREES = 0.5;
const IDLE_MESH_TILT_SPEED = 0.52;
const IDLE_MESH_TILT_LERP = 0.1;
const TILT_LERP = 0.18;
const IDLE_RETURN_LERP = 0.12;
const CLICK_SQUISH_MS = 140;

export type CardProps = {
  texture: Texture | null;
  width?: number;
  height?: number;
  /** Phase offset for idle sway (radians). */
  phase?: number;
  hovered?: boolean;
  dragging?: boolean;
  tiltConfig?: PerspectiveTiltConfig;
  displayMode?: CardDisplayMode;
  price?: number;
  sellPrice?: number;
  onBuy?: () => void;
  onSelect?: () => void;
  onSell?: () => void;
  /** Parent handles pointer events (e.g. inside `DraggableItem`). */
  embedded?: boolean;
  /** When embedded, parent can drive owned selection (e.g. from game store). */
  selected?: boolean;
  /** Called when shop/pack raised or owned enlarged toggles. */
  onSelectedChange?: (selected: boolean) => void;
  effect?: EffectId;
};

export type CardHandle = {
  setSquishScale: (scaleX: number, scaleY: number) => void;
  setPointerLocal: (x: number, y: number) => void;
  toggleOwned: () => void;
  /** Collapse raised/enlarged selection; skip callback when parent already updated selection. */
  deselect: (silent?: boolean) => void;
  /** For embedded container: tap on sell tab while drag wrapper owns the pointer. */
  hitsSellTabAtGlobal: (globalX: number, globalY: number) => boolean;
  triggerSell: () => void;
  /** Burn-away destroy animation; runs on top of the card's visual effect. */
  destroy: (onComplete?: ActionEffectComplete) => void;
  /** Whether a destroy animation is currently playing. */
  isDestroying: () => boolean;
};

type DestroyAnimState = {
  progress: number;
  duration: number;
  onComplete?: ActionEffectComplete;
};

/** Visual card — position via parent `DraggableItem`, or self-interactive when `displayMode` is set. */
export const Card = forwardRef<CardHandle, CardProps>(function Card(
  {
    texture,
    width = DEFAULT_CARD_WIDTH,
    height = DEFAULT_CARD_HEIGHT,
    phase = 0,
    hovered = false,
    dragging = false,
    tiltConfig,
    displayMode,
    price = 5,
    sellPrice = 4,
    onBuy,
    onSelect,
    onSell,
    embedded = false,
    selected,
    onSelectedChange,
    effect = "none",
  },
  ref,
) {
  const { app } = useApplication();
  const interactive = displayMode !== undefined;
  const selfInteractive = interactive && !embedded;

  const rootRef = useRef<Container | null>(null);
  const liftRef = useRef<Container | null>(null);
  const squishRef = useRef<Container | null>(null);
  const idleRef = useRef<Container | null>(null);
  const meshRef = useRef<PerspectiveMesh | null>(null);
  const flatSpriteRef = useRef<Sprite | null>(null);
  const pendingArtFiltersRef = useRef<Filter[] | null>(null);
  const pointerNormRef = useRef({ x: 0.5, y: 0.5 });
  const effectFrameRef = useRef<EffectFrameContext>(
    createDefaultEffectFrame("card", width, height, phase),
  );

  const applyArtFilters = useCallback((filters: Filter[] | null) => {
    pendingArtFiltersRef.current = filters;
    const target = flatSpriteRef.current ?? meshRef.current;
    if (target) {
      target.filters = filters;
    }
  }, []);

  const bindFlatSprite = useCallback((node: Sprite | null) => {
    flatSpriteRef.current = node;
    if (node && pendingArtFiltersRef.current) {
      node.filters = pendingArtFiltersRef.current;
    }
  }, []);

  const effectArtRef = useRef<{
    applyFilters: (filters: Filter[] | null) => void;
    setJitter: (dx: number, dy: number) => void;
  }>({
    applyFilters: () => { },
    setJitter() { },
  });
  effectArtRef.current.applyFilters = applyArtFilters;
  const actionTabRef = useRef<Container | null>(null);
  const actionTabInnerRef = useRef<Container | null>(null);
  const actionTabShadowRef = useRef<Graphics | null>(null);
  const actionTabGfxRef = useRef<Graphics | null>(null);
  const priceTabRef = useRef<Container | null>(null);
  const priceTabGfxRef = useRef<Graphics | null>(null);
  const sellTabRef = useRef<Container | null>(null);
  const sellTabInnerRef = useRef<Container | null>(null);
  const sellTabShadowRef = useRef<Graphics | null>(null);
  const sellTabGfxRef = useRef<Graphics | null>(null);
  const sellTabTextRef = useRef<Text | null>(null);
  const cardHitRef = useRef<Container | null>(null);

  const cornersRef = useRef(createUnitCorners());
  const angleXRef = useRef(0);
  const angleYRef = useRef(0);
  const targetAngleXRef = useRef(0);
  const targetAngleYRef = useRef(0);
  const idleRotationRef = useRef(0);
  const hoveredRef = useRef(hovered);
  const draggingRef = useRef(dragging);
  const prevDragSquishRef = useRef(false);
  const clickSquishUntilRef = useRef(0);

  const squishSpringRef = useRef<SquishState>(createSquishState());
  const externalSquishRef = useRef({ scaleX: 1, scaleY: 1 });
  const liftSpringRef = useRef<ScalarSpringState>(createScalarSpring(0, 0));
  const ownedScaleSpringRef = useRef<ScalarSpringState>(createScalarSpring(1, 1));
  const sellTabSpringRef = useRef<ScalarSpringState>(createScalarSpring(0, 0));
  const onSellRef = useRef(onSell);
  onSellRef.current = onSell;

  const burnDissolveRef = useRef<BurnDissolveFilter | null>(null);
  const destroyAnimRef = useRef<DestroyAnimState | null>(null);
  const destroyingRef = useRef(false);

  const [raised, setRaised] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const [hoveredInternal, setHoveredInternal] = useState(false);
  const [prevDisplayMode, setPrevDisplayMode] = useState(displayMode);
  const [prevSelectedProp, setPrevSelectedProp] = useState(selected);

  if (displayMode !== prevDisplayMode) {
    setPrevDisplayMode(displayMode);
    if (displayMode !== undefined) {
      setRaised(false);
      setEnlarged(false);
      setHoveredInternal(false);
      setScalarTarget(liftSpringRef.current, 0);
      setScalarTarget(ownedScaleSpringRef.current, 1);
      setScalarTarget(sellTabSpringRef.current, 0);
      setSquishTarget(squishSpringRef.current, SQUISH_IDLE);
    }
  }

  if (embedded && selected !== undefined && selected !== prevSelectedProp) {
    setPrevSelectedProp(selected);
    if (displayMode === "owned") {
      setEnlarged(selected);
      setScalarTarget(
        ownedScaleSpringRef.current,
        selected ? CARD_OWNED_ENLARGED_SCALE : 1,
      );
      setScalarTarget(sellTabSpringRef.current, selected ? 1 : 0);
    }
  }

  const raisedRef = useRef(raised);
  const enlargedRef = useRef(enlarged);
  const isSelectedRef = useRef(false);
  raisedRef.current = raised;
  enlargedRef.current = enlarged;

  const isSelected =
    interactive &&
    (((displayMode === "shop" || displayMode === "pack") && raised) ||
      (displayMode === "owned" && enlarged));
  isSelectedRef.current = isSelected;

  const effectiveHovered = hovered || hoveredInternal;
  hoveredRef.current = effectiveHovered;
  draggingRef.current = dragging;

  const cardBodyHitArea = useMemo(
    () => new Rectangle(-width / 2, -height / 2, width, height),
    [height, width],
  );

  const notifySelectedChange = useCallback(
    (selected: boolean) => {
      if (displayMode !== undefined) {
        onSelectedChange?.(selected);
      }
    },
    [displayMode, onSelectedChange],
  );

  const applyOwnedEnlargedTargets = useCallback((nextEnlarged: boolean) => {
    setScalarTarget(
      ownedScaleSpringRef.current,
      nextEnlarged ? CARD_OWNED_ENLARGED_SCALE : 1,
    );
    setScalarTarget(sellTabSpringRef.current, nextEnlarged ? 1 : 0);
  }, []);

  const corners = useMemo(() => {
    const next = createUnitCorners();
    cornersRef.current = next;
    return next;
  }, [width, height]);

  const triggerClickSquish = useCallback(() => {
    setSquishTarget(squishSpringRef.current, SQUISH_LIFT);
    clickSquishUntilRef.current = performance.now() + CLICK_SQUISH_MS;
  }, []);

  const hitsSellTabAtGlobal = useCallback((globalX: number, globalY: number) => {
    if (displayMode !== "owned" || !enlargedRef.current) {
      return false;
    }
    if (sellTabSpringRef.current.value < 0.15) {
      return false;
    }
    const inner = sellTabInnerRef.current;
    if (!inner) {
      return false;
    }
    if (!embedded && inner.eventMode === "none") {
      return false;
    }
    const local = inner.toLocal({ x: globalX, y: globalY });
    const hit = inner.hitArea;
    return hit instanceof Rectangle && hit.contains(local.x, local.y);
  }, [displayMode, embedded]);

  const triggerSell = useCallback(() => {
    onSellRef.current?.();
  }, []);

  const hideCardChrome = useCallback(() => {
    const actionTab = actionTabRef.current;
    const priceTab = priceTabRef.current;
    const sellTab = sellTabRef.current;
    if (actionTab) {
      actionTab.alpha = 0;
    }
    if (priceTab) {
      priceTab.alpha = 0;
    }
    if (sellTab) {
      sellTab.alpha = 0;
    }
  }, []);

  const deselect = useCallback(
    (silent = false) => {
      if (!interactive) {
        return;
      }
      if (displayMode === "owned") {
        if (!enlargedRef.current) {
          return;
        }
        setEnlarged(false);
        applyOwnedEnlargedTargets(false);
        if (!silent) {
          notifySelectedChange(false);
        }
        return;
      }
      if (displayMode === "shop" || displayMode === "pack") {
        if (!raisedRef.current) {
          return;
        }
        setRaised(false);
        setScalarTarget(liftSpringRef.current, 0);
        if (!silent) {
          notifySelectedChange(false);
        }
      }
    },
    [applyOwnedEnlargedTargets, displayMode, interactive, notifySelectedChange],
  );

  const startDestroy = useCallback((onComplete?: ActionEffectComplete) => {
    if (destroyingRef.current) {
      return;
    }

    const burnTex = getEffectTexture("burn");
    if (!burnTex) {
      rootRef.current && (rootRef.current.visible = false);
      onComplete?.();
      return;
    }

    destroyingRef.current = true;
    deselect(true);
    hideCardChrome();

    if (!burnDissolveRef.current) {
      burnDissolveRef.current = createBurnDissolveFilter(burnTex);
    }

    burnDissolveRef.current.setDissolve(0);

    const squish = squishRef.current;
    if (squish) {
      squish.filters = [burnDissolveRef.current.filter];
    }

    destroyAnimRef.current = {
      progress: 0,
      duration: BURN_DESTROY.duration,
      onComplete,
    };
  }, [deselect, hideCardChrome]);

  useImperativeHandle(
    ref,
    () => ({
      setSquishScale(scaleX, scaleY) {
        if (interactive && !embedded) {
          return;
        }
        if (embedded) {
          externalSquishRef.current = { scaleX, scaleY };
          return;
        }
        squishRef.current?.scale.set(scaleX, scaleY);
      },
      setPointerLocal(localX, localY) {
        const { angleX, angleY } = pointerToTiltAngles(localX, localY, tiltConfig);
        targetAngleXRef.current = angleX;
        targetAngleYRef.current = angleY;
      },
      toggleOwned() {
        if (!interactive || displayMode !== "owned" || draggingRef.current) {
          return;
        }
        const next = !enlargedRef.current;
        setEnlarged(next);
        applyOwnedEnlargedTargets(next);
        notifySelectedChange(next);
        triggerClickSquish();
      },
      deselect,
      hitsSellTabAtGlobal,
      triggerSell,
      destroy: startDestroy,
      isDestroying: () => destroyingRef.current,
    }),
    [
      applyOwnedEnlargedTargets,
      deselect,
      displayMode,
      embedded,
      hitsSellTabAtGlobal,
      interactive,
      notifySelectedChange,
      startDestroy,
      tiltConfig,
      triggerClickSquish,
      triggerSell,
    ],
  );

  const bindMesh = useCallback(
    (node: PerspectiveMesh | null) => {
      meshRef.current = node;
      if (node && texture) {
        resetMeshCorners(node, corners, texture.width, texture.height);
      }
      if (node && pendingArtFiltersRef.current) {
        node.filters = pendingArtFiltersRef.current;
      }
    },
    [corners, texture],
  );

  const bindRoot = useCallback(
    (node: Container | null) => {
      rootRef.current = node;
    },
    [],
  );

  const onCardPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (destroyingRef.current || !interactive || draggingRef.current) {
        return;
      }
      event.stopPropagation();

      if (displayMode === "shop" || displayMode === "pack") {
        const nextRaised = !raisedRef.current;
        setRaised(nextRaised);
        setScalarTarget(liftSpringRef.current, nextRaised ? CARD_LIFT_PX : 0);
        notifySelectedChange(nextRaised);
        triggerClickSquish();
        return;
      }

      if (displayMode === "owned") {
        const next = !enlargedRef.current;
        setEnlarged(next);
        applyOwnedEnlargedTargets(next);
        notifySelectedChange(next);
        triggerClickSquish();
      }
    },
    [
      applyOwnedEnlargedTargets,
      displayMode,
      interactive,
      notifySelectedChange,
      triggerClickSquish,
    ],
  );

  const onCardPointerOver = useCallback(() => {
    if (destroyingRef.current || !interactive || draggingRef.current) {
      return;
    }
    if (interactive && !draggingRef.current) {
      setHoveredInternal(true);
    }
  }, [interactive]);

  const onCardPointerOut = useCallback(() => {
    if (destroyingRef.current) {
      return;
    }
    if (interactive) {
      setHoveredInternal(false);
    }
  }, [interactive]);

  const onCardPointerMove = useCallback(
    (event: FederatedPointerEvent) => {
      if (
        destroyingRef.current ||
        !interactive ||
        draggingRef.current ||
        !hoveredRef.current ||
        isSelectedRef.current ||
        displayMode === "shop"
      ) {
        return;
      }
      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      const { angleX, angleY } = pointerToTiltAngles(local.x, local.y, tiltConfig);
      targetAngleXRef.current = angleX;
      targetAngleYRef.current = angleY;
      pointerNormRef.current = {
        x: (local.x + width / 2) / width,
        y: (local.y + height / 2) / height,
      };
    },
    [interactive, tiltConfig, width, height],
  );

  const onBuyPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      event.stopPropagation();
      onBuy?.();
    },
    [onBuy],
  );

  const onSelectPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      event.stopPropagation();
      onSelect?.();
    },
    [onSelect],
  );

  const onSellPointerTap = useCallback(
    (event: FederatedPointerEvent) => {
      event.stopPropagation();
      triggerSell();
    },
    [triggerSell],
  );

  const texWidth = texture?.width ?? width;
  const texHeight = texture?.height ?? height;
  const artScaleX = width / texWidth;
  const artScaleY = height / texHeight;

  const useFlatArt = displayMode === "shop";
  const tiltEnabled = !useFlatArt;
  const idleEnabled =
    !dragging &&
    !isSelected &&
    tiltEnabled &&
    (displayMode === undefined || displayMode === "owned" || displayMode === "pack");

  const showActionTab =
    interactive && raised && (displayMode === "shop" || displayMode === "pack");
  const actionTabLabel = displayMode === "shop" ? "BUY" : "SELECT";
  const actionTabHandler = displayMode === "shop" ? onBuyPointerDown : onSelectPointerDown;

  useTick(() => {
    const dt = app.ticker.deltaMS / 1000;
    const destroyAnim = destroyAnimRef.current;
    if (destroyAnim) {
      destroyAnim.progress += dt / destroyAnim.duration;
      const linear = Math.min(1, destroyAnim.progress);
      burnDissolveRef.current?.setDissolve(burnDestroyDissolveAt(linear));
      if (linear >= 1) {
        const onComplete = destroyAnim.onComplete;
        destroyAnimRef.current = null;
        destroyingRef.current = false;
        const root = rootRef.current;
        if (root) {
          root.visible = false;
        }
        const squish = squishRef.current;
        if (squish) {
          squish.filters = null;
        }
        onComplete?.();
      }
      return;
    }

    const frame = effectFrameRef.current;
    frame.dt = dt;
    frame.time = performance.now() / 1000;
    frame.width = width;
    frame.height = height;
    frame.hostKind = "card";
    frame.hovered = effectiveHovered;
    frame.dragging = draggingRef.current;
    frame.activated = isSelectedRef.current;
    frame.tiltX = angleXRef.current;
    frame.tiltY = angleYRef.current;
    frame.pointerNormX = pointerNormRef.current.x;
    frame.pointerNormY = pointerNormRef.current.y;
    frame.phase = phase;
    const mesh = meshRef.current;
    const idle = idleRef.current;
    const lift = liftRef.current;
    const squishNode = squishRef.current;
    const actionTab = actionTabRef.current;
    const priceTab = priceTabRef.current;
    const sellTab = sellTabRef.current;
    const isDragging = draggingRef.current;
    const isHovered = hoveredRef.current && !isDragging;
    const isSelectedNow = isSelectedRef.current;

    if (isSelectedNow || !tiltEnabled) {
      targetAngleXRef.current += (0 - targetAngleXRef.current) * IDLE_RETURN_LERP;
      targetAngleYRef.current += (0 - targetAngleYRef.current) * IDLE_RETURN_LERP;
    } else if (!isHovered && idleEnabled) {
      const idleT = performance.now() / 1000;
      const idleTargetX =
        Math.sin(idleT * IDLE_MESH_TILT_SPEED + phase) * IDLE_MESH_TILT_DEGREES;
      const idleTargetY =
        Math.cos(idleT * IDLE_MESH_TILT_SPEED * 0.86 + phase * 1.21) * IDLE_MESH_TILT_DEGREES;
      targetAngleXRef.current +=
        (idleTargetX - targetAngleXRef.current) * IDLE_MESH_TILT_LERP;
      targetAngleYRef.current +=
        (idleTargetY - targetAngleYRef.current) * IDLE_MESH_TILT_LERP;
    } else if (!isHovered) {
      targetAngleXRef.current += (0 - targetAngleXRef.current) * IDLE_RETURN_LERP;
      targetAngleYRef.current += (0 - targetAngleYRef.current) * IDLE_RETURN_LERP;
    }

    if (isSelectedNow || !tiltEnabled) {
      angleXRef.current = 0;
      angleYRef.current = 0;
      targetAngleXRef.current = 0;
      targetAngleYRef.current = 0;
    } else {
      angleXRef.current += (targetAngleXRef.current - angleXRef.current) * TILT_LERP;
      angleYRef.current += (targetAngleYRef.current - angleYRef.current) * TILT_LERP;
    }

    if (idleEnabled && !isHovered && !isSelectedNow && tiltEnabled) {
      const sensitivity = tiltConfig?.sensitivity ?? 35;
      pointerNormRef.current = {
        x: Math.max(0.22, Math.min(0.78, 0.5 - angleYRef.current / sensitivity)),
        y: Math.max(0.22, Math.min(0.78, 0.5 - angleXRef.current / sensitivity)),
      };
    }

    if (idleEnabled && !isHovered) {
      const t = performance.now() / 1000;
      const targetIdle = Math.sin(t * IDLE_SPEED + phase) * IDLE_DEGREES * DEG_TO_RAD;
      idleRotationRef.current += (targetIdle - idleRotationRef.current) * 0.14;
    } else if (isDragging || isSelectedNow || displayMode === "shop") {
      idleRotationRef.current = 0;
    } else {
      idleRotationRef.current += (0 - idleRotationRef.current) * 0.16;
    }

    if (idle) {
      idle.rotation = isDragging || isSelectedNow ? 0 : idleRotationRef.current;
    }

    if (isSelectedNow || !tiltEnabled) {
      resetMeshCorners(mesh, corners, texWidth, texHeight);
    } else {
      applyTiltToMesh(
        mesh,
        corners,
        angleXRef.current,
        angleYRef.current,
        texWidth,
        texHeight,
        tiltConfig,
      );
    }

    if (interactive) {
      const root = rootRef.current;
      if (root && selfInteractive) {
        root.zIndex = isSelectedNow ? CARD_SELECTED_Z_INDEX : 0;
      }

      const squishSpring = squishSpringRef.current;
      const clickSquishActive = performance.now() < clickSquishUntilRef.current;
      const isDragging = draggingRef.current;
      const keepHoverScale = isSelectedNow || isHovered;
      const hoverTarget = keepHoverScale
        ? { scaleX: CARD_HOVER_SCALE, scaleY: CARD_HOVER_SCALE }
        : SQUISH_IDLE;
      const externalSquish = embedded ? externalSquishRef.current : { scaleX: 1, scaleY: 1 };
      const externalSquishActive =
        embedded &&
        (Math.abs(externalSquish.scaleX - 1) > 0.008 ||
          Math.abs(externalSquish.scaleY - 1) > 0.008);
      const useExternalSquish = embedded && (isDragging || externalSquishActive);

      if (isDragging && !prevDragSquishRef.current) {
        snapSquish(squishSpring, SQUISH_IDLE);
      }
      prevDragSquishRef.current = isDragging;

      if (!clickSquishActive && !useExternalSquish) {
        setSquishTarget(squishSpring, hoverTarget);
      } else if (useExternalSquish) {
        setSquishTarget(squishSpring, SQUISH_IDLE);
      }

      stepSquish(squishSpring, dt);
      stepScalarSpring(liftSpringRef.current, dt);
      stepScalarSpring(ownedScaleSpringRef.current, dt);
      stepScalarSpring(sellTabSpringRef.current, dt);

      const ownedScale = displayMode === "owned" ? ownedScaleSpringRef.current.value : 1;
      const scaleX = useExternalSquish
        ? externalSquish.scaleX * ownedScale
        : squishSpring.scaleX * ownedScale;
      const scaleY = useExternalSquish
        ? externalSquish.scaleY * ownedScale
        : squishSpring.scaleY * ownedScale;

      if (squishNode) {
        squishNode.scale.set(scaleX, scaleY);
      }

      if (lift) {
        lift.y = -liftSpringRef.current.value;
      }

      const liftProgress = CARD_LIFT_PX > 0 ? liftSpringRef.current.value / CARD_LIFT_PX : 0;

      if (priceTab) {
        priceTab.y = priceTabAnchorY(height, scaleY);
      }

      if (actionTab) {
        const liftY = liftSpringRef.current.value;
        actionTab.y = actionTabAnchorY(height, scaleY) + liftY;
        const inner = actionTabInnerRef.current;
        if (inner) {
          inner.y = -ACTION_TAB_HEIGHT + liftProgress * ACTION_TAB_HEIGHT;
        }
        actionTab.alpha = showActionTab && liftProgress > 0 ? 1 : 0;
      }

      if (sellTab) {
        const reveal = sellTabSpringRef.current.value;
        sellTab.x = sellTabAnchorX(width, ownedScale);
        const inner = sellTabInnerRef.current;
        const sellVisible = displayMode === "owned" && reveal > 0;
        const sellFade = sellVisible ? reveal : 0;
        if (inner) {
          inner.x = sellTabInnerX(reveal);
          if (!embedded) {
            inner.eventMode =
              enlargedRef.current && displayMode === "owned" && reveal > 0.15
                ? "static"
                : "none";
          }
        }
        sellTab.alpha = 1;
        const sellShadow = sellTabShadowRef.current;
        const sellGfx = sellTabGfxRef.current;
        const sellText = sellTabTextRef.current;
        if (sellShadow) {
          sellShadow.alpha = sellFade;
        }
        if (sellGfx) {
          sellGfx.alpha = sellFade;
        }
        if (sellText) {
          sellText.alpha = sellFade;
        }
      }
    }
  });

  return (
    <pixiContainer
      ref={bindRoot}
      sortableChildren
      eventMode={interactive ? "passive" : "none"}
    >
      <pixiContainer ref={liftRef} sortableChildren eventMode="passive">
        {interactive && (displayMode === "shop" || displayMode === "pack") ? (
          <pixiContainer ref={actionTabRef} zIndex={0} eventMode="passive">
            <pixiContainer
              ref={actionTabInnerRef}
              y={-ACTION_TAB_HEIGHT}
              eventMode={showActionTab ? "static" : "none"}
              cursor="pointer"
              hitArea={new Rectangle(
                -TAB_WIDTH / 2,
                ACTION_TAB_HEIGHT / 2 - ACTION_TAB_VISIBLE_HEIGHT,
                TAB_WIDTH,
                ACTION_TAB_VISIBLE_HEIGHT,
              )}
              onPointerDown={actionTabHandler}
            >
              <pixiGraphics ref={actionTabShadowRef} draw={drawBottomActionTabShadow} eventMode="none" />
              <pixiGraphics ref={actionTabGfxRef} draw={drawBottomActionTab} eventMode="none" />
              <pixiText
                text={actionTabLabel}
                x={0}
                y={ACTION_TAB_TEXT_Y}
                anchor={0.5}
                style={tabTextStyle}
                eventMode="none"
              />
            </pixiContainer>
          </pixiContainer>
        ) : null}

        {displayMode === "shop" ? (
          <pixiContainer ref={priceTabRef} eventMode="passive">
            <pixiGraphics ref={priceTabGfxRef} draw={drawPriceTab} eventMode="none" />
            <pixiText
              text={formatPrice(price)}
              anchor={0.5}
              y={-2}
              style={priceTabTextStyle}
              eventMode="none"
            />
          </pixiContainer>
        ) : null}

        {displayMode === "owned" ? (
          <pixiContainer ref={sellTabRef} zIndex={0} eventMode="passive">
            <pixiContainer
              ref={sellTabInnerRef}
              x={-SELL_TAB_WIDTH}
              eventMode="none"
              cursor="pointer"
              hitArea={new Rectangle(0, -SELL_TAB_HEIGHT / 2, SELL_TAB_WIDTH, SELL_TAB_HEIGHT)}
              onPointerTap={embedded ? undefined : onSellPointerTap}
            >
              <pixiGraphics ref={sellTabShadowRef} draw={drawSellTabShadow} eventMode="none" />
              <pixiGraphics ref={sellTabGfxRef} draw={drawSellTab} eventMode="none" />
              <pixiText
                ref={sellTabTextRef}
                text={formatSellLabel(sellPrice)}
                x={SELL_TAB_TEXT_X}
                anchor={0.5}
                style={sellTabTextStyle}
                eventMode="none"
              />
            </pixiContainer>
          </pixiContainer>
        ) : null}

        <pixiContainer ref={squishRef} zIndex={2} sortableChildren eventMode="passive">
          {selfInteractive ? (
            <pixiContainer
              ref={cardHitRef}
              zIndex={4}
              eventMode="static"
              cursor="pointer"
              hitArea={cardBodyHitArea}
              onPointerDown={onCardPointerDown}
              onPointerOver={onCardPointerOver}
              onPointerOut={onCardPointerOut}
              onPointerMove={onCardPointerMove}
            />
          ) : null}

          <EffectMount
            effect={effect}
            hostKind="card"
            width={width}
            height={height}
            frameRef={effectFrameRef}
            artRef={effectArtRef}
          >
            <pixiContainer ref={idleRef} eventMode="none">
              {texture ? (
                useFlatArt ? (
                  <pixiSprite
                    ref={bindFlatSprite}
                    texture={texture}
                    x={-width / 2}
                    y={-height / 2}
                    width={width}
                    height={height}
                    eventMode="none"
                  />
                ) : (
                  <pixiPerspectiveMesh
                    ref={bindMesh}
                    texture={texture}
                    x={-width / 2}
                    y={-height / 2}
                    pivot={{ x: 0, y: 0 }}
                    scale={{ x: artScaleX, y: artScaleY }}
                    eventMode="none"
                  />
                )
              ) : null}
            </pixiContainer>
          </EffectMount>
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
});
