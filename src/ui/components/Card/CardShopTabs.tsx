import { useTick } from '@pixi/react';
import type { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Rectangle } from 'pixi.js';
import { useCallback, useMemo, useRef, type RefObject } from 'react';

import {
  ACTION_TAB_HEIGHT,
  ACTION_TAB_VISIBLE_HEIGHT,
  SECONDARY_ACTION_TAB_HEIGHT,
  SECONDARY_ACTION_TAB_WIDTH,
  TAB_WIDTH,
  type CardDisplayMode,
} from '@/ui/components/Card/config';
import type { CardSecondaryAction } from '@/ui/components/Card/Card';
import {
  ACTION_TAB_TEXT_Y,
  actionTabAnchorY,
  drawBottomActionTab,
  drawBottomActionTabShadow,
  drawBottomActionTabStyled,
  drawPriceTab,
  drawRightShopActionTab,
  drawRightShopActionTabShadow,
  formatPrice,
  priceTabAnchorY,
  priceTabTextStyle,
  secondaryActionTabAnchorX,
  secondaryActionTabAnchorY,
  secondaryActionTabInnerX,
  SECONDARY_ACTION_TAB_TEXT_X,
  sellTabTextStyle,
  tabTextStyle,
} from '@/ui/components/Card/cardTab';
import { CARD_LIFT_PX } from '@/ui/components/Card/config';
import type { ScalarSpringState } from '@/ui/interaction/spring';

const PRICE_AFFORDABLE_COLOR = '#F5A02E';
const PRICE_UNAFFORDABLE_COLOR = '#ff4444';

export type CardShopTabsProps = {
  width: number;
  height: number;
  displayMode: CardDisplayMode;
  price: number;
  buyDisabled?: boolean;
  liftSpring: ScalarSpringState;
  scaleRef: RefObject<{ scaleX: number; scaleY: number }>;
  raised: boolean;
  onBuy?: () => void;
  onSelect?: () => void;
  secondaryAction?: CardSecondaryAction;
  primaryActionTabColor?: number;
};

export function CardShopTabs({
  width,
  height,
  displayMode,
  price,
  buyDisabled = false,
  liftSpring,
  scaleRef,
  raised,
  onBuy,
  onSelect,
  secondaryAction,
  primaryActionTabColor,
}: CardShopTabsProps) {
  const actionTabRef = useRef<Container | null>(null);
  const actionTabInnerRef = useRef<Container | null>(null);
  const actionTabShadowRef = useRef<Graphics | null>(null);
  const actionTabGfxRef = useRef<Graphics | null>(null);
  const secondaryActionTabRef = useRef<Container | null>(null);
  const secondaryActionTabInnerRef = useRef<Container | null>(null);
  const secondaryActionTabShadowRef = useRef<Graphics | null>(null);
  const secondaryActionTabGfxRef = useRef<Graphics | null>(null);
  const secondaryActionTabTextRef = useRef<Text | null>(null);
  const priceTabRef = useRef<Container | null>(null);
  const priceTabGfxRef = useRef<Graphics | null>(null);
  const priceTabTextRef = useRef<Text | null>(null);

  const showActionTab = raised && (displayMode === 'shop' || displayMode === 'pack');
  const showSecondaryActionTab = showActionTab && displayMode === 'shop' && secondaryAction != null;
  const actionTabLabel = displayMode === 'shop' ? 'BUY' : 'SELECT';
  const buyTabDisabled = buyDisabled && displayMode === 'shop';

  const primaryTabStyle = useMemo(() => {
    if (buyTabDisabled) {
      return { fill: 0x555555, stroke: 0x444444, fillAlpha: 1 };
    }
    if (primaryActionTabColor != null) {
      return { fill: primaryActionTabColor, stroke: primaryActionTabColor };
    }
    return undefined;
  }, [buyTabDisabled, primaryActionTabColor]);

  const secondaryTabStyle = useMemo(() => {
    if (secondaryAction?.disabled) {
      return { fill: 0x555555, stroke: 0x444444, fillAlpha: 1 };
    }
    return { fill: 0x338833, stroke: 0x2a6e2a };
  }, [secondaryAction?.disabled]);

  const priceStyle = useMemo(() => {
    const style = priceTabTextStyle.clone();
    style.fill = buyDisabled ? PRICE_UNAFFORDABLE_COLOR : PRICE_AFFORDABLE_COLOR;
    return style;
  }, [buyDisabled]);

  const drawPrimaryActionTab = useCallback(
    (graphics: Graphics) => {
      if (primaryTabStyle) {
        drawBottomActionTabStyled(graphics, primaryTabStyle);
        return;
      }
      drawBottomActionTab(graphics);
    },
    [primaryTabStyle],
  );

  const drawSecondaryTabGfx = useCallback(
    (graphics: Graphics) => {
      drawRightShopActionTab(graphics, secondaryTabStyle);
    },
    [secondaryTabStyle],
  );

  const onBuyPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (buyTabDisabled) {
        return;
      }
      event.stopPropagation();
      onBuy?.();
    },
    [buyTabDisabled, onBuy],
  );

  const onSelectPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      event.stopPropagation();
      onSelect?.();
    },
    [onSelect],
  );

  const onSecondaryActionPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (secondaryAction?.disabled) {
        return;
      }
      event.stopPropagation();
      secondaryAction?.onAction();
    },
    [secondaryAction],
  );

  const actionTabHandler = displayMode === 'shop' ? onBuyPointerDown : onSelectPointerDown;

  useTick(() => {
    const { scaleX, scaleY } = scaleRef.current;
    const liftProgress = CARD_LIFT_PX > 0 ? liftSpring.value / CARD_LIFT_PX : 0;
    const priceTab = priceTabRef.current;
    const actionTab = actionTabRef.current;
    const secondaryActionTab = secondaryActionTabRef.current;

    if (priceTab) {
      priceTab.y = priceTabAnchorY(height, scaleY);
    }

    if (actionTab) {
      const liftY = liftSpring.value;
      actionTab.y = actionTabAnchorY(height, scaleY) + liftY;
      const inner = actionTabInnerRef.current;
      if (inner) {
        inner.y = -ACTION_TAB_HEIGHT + liftProgress * ACTION_TAB_HEIGHT;
        inner.eventMode = showActionTab && !buyTabDisabled && liftProgress > 0.15 ? 'static' : 'none';
      }
      actionTab.alpha = showActionTab && liftProgress > 0 ? 1 : 0;
    }

    if (secondaryActionTab) {
      const reveal = liftProgress;
      secondaryActionTab.x = secondaryActionTabAnchorX(width, scaleX);
      secondaryActionTab.y = secondaryActionTabAnchorY(height, scaleY);
      const inner = secondaryActionTabInnerRef.current;
      const secondaryVisible = showSecondaryActionTab && reveal > 0;
      const secondaryFade = secondaryVisible ? reveal : 0;
      if (inner) {
        inner.x = secondaryActionTabInnerX(reveal);
        inner.eventMode =
          showSecondaryActionTab && !secondaryAction?.disabled && reveal > 0.15 ? 'static' : 'none';
      }
      secondaryActionTab.alpha = 1;
      const secondaryShadow = secondaryActionTabShadowRef.current;
      const secondaryGfx = secondaryActionTabGfxRef.current;
      const secondaryText = secondaryActionTabTextRef.current;
      if (secondaryShadow) {
        secondaryShadow.alpha = secondaryFade;
      }
      if (secondaryGfx) {
        secondaryGfx.alpha = secondaryFade;
      }
      if (secondaryText) {
        secondaryText.alpha = secondaryFade;
      }
    }
  });

  return (
    <>
      {displayMode === 'shop' || displayMode === 'pack' ? (
        <pixiContainer ref={actionTabRef} zIndex={0} eventMode="passive">
          <pixiContainer
            ref={actionTabInnerRef}
            y={-ACTION_TAB_HEIGHT}
            eventMode="none"
            cursor={buyTabDisabled ? 'default' : 'pointer'}
            hitArea={
              new Rectangle(
                -TAB_WIDTH / 2,
                ACTION_TAB_HEIGHT / 2 - ACTION_TAB_VISIBLE_HEIGHT,
                TAB_WIDTH,
                ACTION_TAB_VISIBLE_HEIGHT,
              )
            }
            onPointerDown={actionTabHandler}
          >
            <pixiGraphics ref={actionTabShadowRef} draw={drawBottomActionTabShadow} eventMode="none" />
            <pixiGraphics ref={actionTabGfxRef} draw={drawPrimaryActionTab} eventMode="none" />
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

      {displayMode === 'shop' && secondaryAction ? (
        <pixiContainer ref={secondaryActionTabRef} zIndex={0} eventMode="passive">
          <pixiContainer
            ref={secondaryActionTabInnerRef}
            x={-SECONDARY_ACTION_TAB_WIDTH}
            eventMode="none"
            cursor={secondaryAction.disabled ? 'default' : 'pointer'}
            hitArea={
              new Rectangle(0, -SECONDARY_ACTION_TAB_HEIGHT / 2, SECONDARY_ACTION_TAB_WIDTH, SECONDARY_ACTION_TAB_HEIGHT)
            }
            onPointerDown={onSecondaryActionPointerDown}
          >
            <pixiGraphics ref={secondaryActionTabShadowRef} draw={drawRightShopActionTabShadow} eventMode="none" />
            <pixiGraphics ref={secondaryActionTabGfxRef} draw={drawSecondaryTabGfx} eventMode="none" />
            <pixiText
              ref={secondaryActionTabTextRef}
              text={secondaryAction.label}
              x={SECONDARY_ACTION_TAB_TEXT_X}
              anchor={0.5}
              style={sellTabTextStyle}
              eventMode="none"
            />
          </pixiContainer>
        </pixiContainer>
      ) : null}

      {displayMode === 'shop' ? (
        <pixiContainer ref={priceTabRef} eventMode="passive">
          <pixiGraphics ref={priceTabGfxRef} draw={drawPriceTab} eventMode="none" />
          <pixiText
            ref={priceTabTextRef}
            text={formatPrice(price)}
            anchor={0.5}
            y={-2}
            style={priceStyle}
            eventMode="none"
          />
        </pixiContainer>
      ) : null}
    </>
  );
}
