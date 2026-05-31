import { useTick } from "@pixi/react";
import {
  Rectangle,
  type Container,
  type FederatedPointerEvent,
  type Graphics,
} from "pixi.js";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  BUTTON_CLICK_SQUISH_MS,
  BUTTON_GRAB_SQUISH,
  BUTTON_HOVER_SCALE,
  BUTTON_LABEL_CHAR_GAP_PX,
  BUTTON_LABEL_FONT_SIZE,
  BUTTON_PINCH_SQUISH,
  BUTTON_POP_SQUISH,
  BUTTON_REDUCED_MOTION_HOVER_SCALE,
  BUTTON_SHADOW_ALPHA,
  BUTTON_SHADOW_OFFSET_Y,
  buttonHoverSquish,
  buttonLabelTextStyleFor,
  buttonVariantTheme,
  DEFAULT_BUTTON_HEIGHT,
  DEFAULT_BUTTON_WIDTH,
  type ButtonProps,
} from "@/ui/components/Button/buttonTheme";
import { drawButtonFace, drawButtonShadow } from "@/ui/components/Button/buttonVisuals";
import { WaveBouncePixi } from "@/ui/components/WaveBounce/WaveBouncePixi";
import {
  createScalarSpring,
  createSquishState,
  setScalarTarget,
  setSquishTarget,
  snapSquish,
  SQUISH_IDLE,
  stepScalarSpring,
  stepSquish,
  type SquishState,
  type SquishTargets,
} from "@/ui/interaction/spring";

export type { ButtonProps, ButtonVariant } from "@/ui/components/Button/buttonTheme";
export { BUTTON_VARIANTS } from "@/ui/components/Button/buttonTheme";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clickNormXFromLocal(localX: number, width: number): number {
  return (localX + width / 2) / width;
}

function useButtonInteraction(
  disabled: boolean,
  width: number,
  height: number,
  hoverSquish: SquishTargets,
  onClick: (() => void) | undefined,
  variant: ButtonProps["variant"],
) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const contentRef = useRef<Container | null>(null);
  const squishRef = useRef<SquishState>(createSquishState());
  const highlightRef = useRef(createScalarSpring(0, 0));
  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);
  const popSquishUntilRef = useRef(0);
  const wasPopActiveRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const [hovered, setHovered] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ normX: number; startMs: number } | null>(
    null,
  );
  const [prevVariant, setPrevVariant] = useState(variant);
  const [prevDisabled, setPrevDisabled] = useState(disabled);

  if (variant !== prevVariant || disabled !== prevDisabled) {
    setPrevVariant(variant);
    setPrevDisabled(disabled);
    setSquishTarget(squishRef.current, SQUISH_IDLE);
    setScalarTarget(highlightRef.current, 0);
    hoveredRef.current = false;
    pressedRef.current = false;
    popSquishUntilRef.current = 0;
    wasPopActiveRef.current = false;
    setHovered(false);
    setClickRipple(null);
  }

  const hitArea = useMemo(
    () => new Rectangle(-width / 2, -height / 2, width, height),
    [height, width],
  );

  const settleSquish = useCallback(() => {
    setSquishTarget(
      squishRef.current,
      hoveredRef.current ? hoverSquish : SQUISH_IDLE,
    );
  }, [hoverSquish]);

  const bindRoot = useCallback(
    (node: Container | null) => {
      if (!node) {
        return;
      }
      node.hitArea = hitArea;
      node.eventMode = disabled ? "none" : "static";
      node.cursor = disabled ? "default" : "pointer";
    },
    [disabled, hitArea],
  );

  const onPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (disabled) {
        return;
      }
      event.stopPropagation();
      pressedRef.current = true;
      snapSquish(squishRef.current, BUTTON_GRAB_SQUISH);
      setSquishTarget(squishRef.current, BUTTON_PINCH_SQUISH);
    },
    [disabled],
  );

  const onPointerUp = useCallback(
    (event: FederatedPointerEvent) => {
      if (disabled) {
        return;
      }
      const wasPressed = pressedRef.current;
      pressedRef.current = false;

      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      const inside =
        local.x >= -width / 2 &&
        local.x <= width / 2 &&
        local.y >= -height / 2 &&
        local.y <= height / 2;

      if (wasPressed && inside) {
        setClickRipple({ normX: clickNormXFromLocal(local.x, width), startMs: performance.now() });
        setSquishTarget(squishRef.current, BUTTON_POP_SQUISH);
        popSquishUntilRef.current = performance.now() + BUTTON_CLICK_SQUISH_MS;
        onClickRef.current?.();
      } else {
        settleSquish();
      }
    },
    [disabled, height, settleSquish, width],
  );

  const onPointerUpOutside = useCallback(() => {
    if (disabled) {
      return;
    }
    pressedRef.current = false;
    settleSquish();
  }, [disabled, settleSquish]);

  const onPointerOver = useCallback(() => {
    if (disabled) {
      return;
    }
    hoveredRef.current = true;
    setHovered(true);
    setScalarTarget(highlightRef.current, 1);
    if (!pressedRef.current && performance.now() >= popSquishUntilRef.current) {
      setSquishTarget(squishRef.current, hoverSquish);
    }
  }, [disabled, hoverSquish]);

  const onPointerOut = useCallback(() => {
    if (disabled) {
      return;
    }
    hoveredRef.current = false;
    setHovered(false);
    setScalarTarget(highlightRef.current, 0);
    if (!pressedRef.current && performance.now() >= popSquishUntilRef.current) {
      setSquishTarget(squishRef.current, SQUISH_IDLE);
    }
  }, [disabled]);

  useTick((ticker) => {
    const dt = ticker.deltaMS / 1000;
    const now = performance.now();
    const popActive = now < popSquishUntilRef.current;

    if (wasPopActiveRef.current && !popActive && !pressedRef.current) {
      settleSquish();
    }
    wasPopActiveRef.current = popActive;

    stepSquish(squishRef.current, dt);
    stepScalarSpring(highlightRef.current, dt);
    contentRef.current?.scale.set(squishRef.current.scaleX, squishRef.current.scaleY);
  });

  return {
    bindRoot,
    contentRef,
    shadowRef,
    faceRef,
    highlightRef,
    hovered,
    clickRipple,
    onPointerDown,
    onPointerUp,
    onPointerUpOutside,
    onPointerOver,
    onPointerOut,
  };
}

export function Button({
  variant,
  label,
  x = 0,
  y = 0,
  width = DEFAULT_BUTTON_WIDTH,
  height = DEFAULT_BUTTON_HEIGHT,
  disabled = false,
  onClick,
}: ButtonProps) {
  const theme = buttonVariantTheme[variant];
  const reducedMotion = prefersReducedMotion();
  const hoverScale = reducedMotion ? BUTTON_REDUCED_MOTION_HOVER_SCALE : BUTTON_HOVER_SCALE;
  const hoverSquish = useMemo(() => buttonHoverSquish(hoverScale), [hoverScale]);

  const interaction = useButtonInteraction(
    disabled,
    width,
    height,
    hoverSquish,
    onClick,
    variant,
  );

  useTick(() => {
    const highlight = interaction.highlightRef.current.value;
    if (interaction.shadowRef.current) {
      drawButtonShadow(
        interaction.shadowRef.current,
        width,
        height,
        theme.shadow,
        BUTTON_SHADOW_ALPHA,
        BUTTON_SHADOW_OFFSET_Y,
      );
    }
    if (interaction.faceRef.current) {
      drawButtonFace(
        interaction.faceRef.current,
        width,
        height,
        theme,
        highlight,
        disabled,
      );
    }
  });

  const textColor = disabled ? theme.disabledText : theme.text;
  const labelStyle = useMemo(
    () => buttonLabelTextStyleFor(textColor, theme.textShadow),
    [textColor, theme.textShadow],
  );

  return (
    <pixiContainer
      ref={interaction.bindRoot}
      x={x}
      y={y}
      sortableChildren
      onPointerDown={interaction.onPointerDown}
      onPointerUp={interaction.onPointerUp}
      onPointerUpOutside={interaction.onPointerUpOutside}
      onPointerOver={interaction.onPointerOver}
      onPointerOut={interaction.onPointerOut}
    >
      <pixiGraphics
        ref={interaction.shadowRef}
        zIndex={0}
        eventMode="none"
        draw={() => {}}
      />
      <pixiContainer ref={interaction.contentRef} zIndex={1} sortableChildren eventMode="none">
        <pixiGraphics ref={interaction.faceRef} eventMode="none" draw={() => {}} />
        <WaveBouncePixi
          text={label}
          style={labelStyle}
          fontSizePx={BUTTON_LABEL_FONT_SIZE}
          idleWavePaused={interaction.hovered}
          reducedMotion={reducedMotion}
          charGapPx={BUTTON_LABEL_CHAR_GAP_PX}
          clickRipple={interaction.clickRipple}
          y={-1}
        />
      </pixiContainer>
    </pixiContainer>
  );
}
