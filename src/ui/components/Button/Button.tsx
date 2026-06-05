import { useTick } from '@pixi/react';
import { Rectangle, type Container, type FederatedPointerEvent, type Graphics } from 'pixi.js';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  BUTTON_PRESS_TRANSITION_MS,
  buttonFaceOffset,
  buttonLabelTextStyle,
  DEFAULT_BUTTON_HEIGHT,
  DEFAULT_BUTTON_WIDTH,
  getButtonVariantTheme,
  type ButtonProps,
} from '@/ui/components/Button/buttonTheme';
import { drawButtonFace, drawButtonShadow } from '@/ui/components/Button/buttonVisuals';
import { playSfx } from '@/ui/audio/sfx';
import { useUiPrimary } from '@/ui/theme/UiPrimaryProvider';

export type { ButtonProps, ButtonVariant } from '@/ui/components/Button/buttonTheme';
export { BUTTON_VARIANTS } from '@/ui/components/Button/buttonTheme';

type OffsetAnim = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useButtonInteraction(
  disabled: boolean,
  width: number,
  height: number,
  reducedMotion: boolean,
  onClick: (() => void) | undefined,
  variant: ButtonProps['variant'],
) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const contentRef = useRef<Container | null>(null);
  const offsetAnimRef = useRef<OffsetAnim | null>(null);
  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const [prevVariant, setPrevVariant] = useState(variant);
  const [prevDisabled, setPrevDisabled] = useState(disabled);

  if (variant !== prevVariant || disabled !== prevDisabled) {
    setPrevVariant(variant);
    setPrevDisabled(disabled);
    hoveredRef.current = false;
    pressedRef.current = false;
    offsetAnimRef.current = null;
    contentRef.current?.position.set(0, 0);
  }

  const hitArea = useMemo(() => new Rectangle(-width / 2, -height / 2, width, height), [height, width]);

  const snapContentOffset = useCallback((x: number, y: number) => {
    offsetAnimRef.current = null;
    contentRef.current?.position.set(x, y);
  }, []);

  const animateContentOffset = useCallback(
    (toX: number, toY: number) => {
      const content = contentRef.current;
      if (!content) {
        return;
      }

      const fromX = content.position.x;
      const fromY = content.position.y;

      if (reducedMotion || (fromX === toX && fromY === toY)) {
        snapContentOffset(toX, toY);
        return;
      }

      offsetAnimRef.current = {
        fromX,
        fromY,
        toX,
        toY,
        startMs: performance.now(),
      };
    },
    [reducedMotion, snapContentOffset],
  );

  const applyFaceOffset = useCallback(() => {
    const { x, y } = buttonFaceOffset(hoveredRef.current, pressedRef.current);
    animateContentOffset(x, y);
  }, [animateContentOffset]);

  const stepOffsetAnim = useCallback(() => {
    const anim = offsetAnimRef.current;
    const content = contentRef.current;
    if (!anim || !content) {
      return;
    }

    const t = Math.min(1, (performance.now() - anim.startMs) / BUTTON_PRESS_TRANSITION_MS);
    content.position.set(anim.fromX + (anim.toX - anim.fromX) * t, anim.fromY + (anim.toY - anim.fromY) * t);

    if (t >= 1) {
      snapContentOffset(anim.toX, anim.toY);
    }
  }, [snapContentOffset]);

  const bindRoot = useCallback(
    (node: Container | null) => {
      if (!node) {
        return;
      }
      node.hitArea = hitArea;
      node.eventMode = disabled ? 'none' : 'static';
      node.cursor = disabled ? 'default' : 'pointer';
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
      applyFaceOffset();
    },
    [applyFaceOffset, disabled],
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
      const inside = local.x >= -width / 2 && local.x <= width / 2 && local.y >= -height / 2 && local.y <= height / 2;

      if (wasPressed && inside) {
        playSfx('button', { volume: 0.4 });
        onClickRef.current?.();
      }
      applyFaceOffset();
    },
    [applyFaceOffset, disabled, height, width],
  );

  const onPointerUpOutside = useCallback(() => {
    if (disabled) {
      return;
    }
    pressedRef.current = false;
    applyFaceOffset();
  }, [applyFaceOffset, disabled]);

  const onPointerOver = useCallback(() => {
    if (disabled) {
      return;
    }
    hoveredRef.current = true;
    applyFaceOffset();
  }, [applyFaceOffset, disabled]);

  const onPointerOut = useCallback(() => {
    if (disabled) {
      return;
    }
    hoveredRef.current = false;
    if (!pressedRef.current) {
      applyFaceOffset();
    }
  }, [applyFaceOffset, disabled]);

  return {
    bindRoot,
    contentRef,
    shadowRef,
    faceRef,
    stepOffsetAnim,
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
  faceTheme,
}: ButtonProps) {
  useUiPrimary();
  const reducedMotion = prefersReducedMotion();

  const interaction = useButtonInteraction(disabled, width, height, reducedMotion, onClick, variant);

  const labelStyle = useMemo(() => buttonLabelTextStyle(), []);
  const theme = faceTheme ?? getButtonVariantTheme(variant);

  useTick(() => {
    interaction.stepOffsetAnim();
    if (interaction.shadowRef.current) {
      drawButtonShadow(interaction.shadowRef.current, width, height);
    }
    if (interaction.faceRef.current) {
      drawButtonFace(interaction.faceRef.current, width, height, theme, disabled);
    }
  });

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
      <pixiGraphics ref={interaction.shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer ref={interaction.contentRef} zIndex={1} sortableChildren eventMode="none">
        <pixiGraphics ref={interaction.faceRef} eventMode="none" draw={() => {}} />
        <pixiText text={label} style={labelStyle} anchor={0.5} eventMode="none" />
      </pixiContainer>
    </pixiContainer>
  );
}
