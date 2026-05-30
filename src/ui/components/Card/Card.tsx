import { useApplication } from "@pixi/react";
import {
  DEG_TO_RAD,
  Rectangle,
  type Container,
  type FederatedPointerEvent,
  type Graphics,
  type PerspectiveMesh,
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

import "@/ui/pixi/extend";

export const DEFAULT_CARD_WIDTH = 150;
export const DEFAULT_CARD_HEIGHT = 210;

const IDLE_DEGREES = 1.5;
const IDLE_SPEED = 1.05;
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
  /** Called when shop/pack raised or owned enlarged toggles. */
  onSelectedChange?: (selected: boolean) => void;
};

export type CardHandle = {
  setSquishScale: (scaleX: number, scaleY: number) => void;
  setPointerLocal: (x: number, y: number) => void;
  toggleOwned: () => void;
  /** For embedded hand: tap on sell tab while drag wrapper owns the pointer. */
  hitsSellTabAtGlobal: (globalX: number, globalY: number) => boolean;
  triggerSell: () => void;
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
    onSelectedChange,
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
  const clickSquishUntilRef = useRef(0);

  const squishSpringRef = useRef<SquishState>(createSquishState());
  const externalSquishRef = useRef({ scaleX: 1, scaleY: 1 });
  const liftSpringRef = useRef<ScalarSpringState>(createScalarSpring(0, 0));
  const ownedScaleSpringRef = useRef<ScalarSpringState>(createScalarSpring(1, 1));
  const sellTabSpringRef = useRef<ScalarSpringState>(createScalarSpring(0, 0));
  const pendingSelectedNotifyRef = useRef<boolean | null>(null);
  const onSelectedChangeRef = useRef(onSelectedChange);
  const onSellRef = useRef(onSell);
  onSelectedChangeRef.current = onSelectedChange;
  onSellRef.current = onSell;

  const [raised, setRaised] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const [hoveredInternal, setHoveredInternal] = useState(false);
  const [prevDisplayMode, setPrevDisplayMode] = useState(displayMode);

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
      pendingSelectedNotifyRef.current = false;
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
    if (!inner || inner.eventMode === "none") {
      return false;
    }
    const local = inner.toLocal({ x: globalX, y: globalY });
    const hit = inner.hitArea;
    return hit instanceof Rectangle && hit.contains(local.x, local.y);
  }, [displayMode]);

  const triggerSell = useCallback(() => {
    onSellRef.current?.();
  }, []);

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
      hitsSellTabAtGlobal,
      triggerSell,
    }),
    [
      applyOwnedEnlargedTargets,
      displayMode,
      embedded,
      hitsSellTabAtGlobal,
      interactive,
      notifySelectedChange,
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
      if (!interactive || draggingRef.current) {
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
    if (interactive && !draggingRef.current) {
      setHoveredInternal(true);
    }
  }, [interactive]);

  const onCardPointerOut = useCallback(() => {
    if (interactive) {
      setHoveredInternal(false);
    }
  }, [interactive]);

  const onCardPointerMove = useCallback(
    (event: FederatedPointerEvent) => {
      if (!interactive || draggingRef.current || !hoveredRef.current || isSelectedRef.current || displayMode === "shop") {
        return;
      }
      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      const { angleX, angleY } = pointerToTiltAngles(local.x, local.y, tiltConfig);
      targetAngleXRef.current = angleX;
      targetAngleYRef.current = angleY;
    },
    [interactive, tiltConfig],
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
  const showSellTab = interactive && displayMode === "owned" && enlarged;
  const actionTabLabel = displayMode === "shop" ? "BUY" : "SELECT";
  const actionTabHandler = displayMode === "shop" ? onBuyPointerDown : onSelectPointerDown;

  useTick(() => {
    if (pendingSelectedNotifyRef.current !== null) {
      const selected = pendingSelectedNotifyRef.current;
      pendingSelectedNotifyRef.current = null;
      if (displayMode !== undefined) {
        onSelectedChangeRef.current?.(selected);
      }
    }

    const dt = app.ticker.deltaMS / 1000;
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

    if (isSelectedNow || !isHovered || !tiltEnabled) {
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
      const keepHoverScale = isSelectedNow || isHovered;
      const hoverTarget = keepHoverScale
        ? { scaleX: CARD_HOVER_SCALE, scaleY: CARD_HOVER_SCALE }
        : SQUISH_IDLE;

      if (!clickSquishActive) {
        setSquishTarget(squishSpring, hoverTarget);
      }

      stepSquish(squishSpring, dt);
      stepScalarSpring(liftSpringRef.current, dt);
      stepScalarSpring(ownedScaleSpringRef.current, dt);
      stepScalarSpring(sellTabSpringRef.current, dt);

      const ownedScale = displayMode === "owned" ? ownedScaleSpringRef.current.value : 1;
      const externalSquish = embedded ? externalSquishRef.current : { scaleX: 1, scaleY: 1 };
      const scaleX = squishSpring.scaleX * ownedScale * externalSquish.scaleX;
      const scaleY = squishSpring.scaleY * ownedScale * externalSquish.scaleY;

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
          inner.eventMode =
            enlargedRef.current && displayMode === "owned" && reveal > 0.15
              ? "static"
              : "none";
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
              onPointerTap={onSellPointerTap}
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
              zIndex={2}
              eventMode="static"
              cursor="pointer"
              hitArea={cardBodyHitArea}
              onPointerDown={onCardPointerDown}
              onPointerOver={onCardPointerOver}
              onPointerOut={onCardPointerOut}
              onPointerMove={onCardPointerMove}
            />
          ) : null}

          <pixiContainer ref={idleRef} zIndex={1} eventMode="none">
            {texture ? (
              useFlatArt ? (
                <pixiSprite
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
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
});
