import { useTick } from '@pixi/react';
import { Rectangle, type Container, type FederatedPointerEvent, type Graphics } from 'pixi.js';
import { useCallback, useMemo, useRef } from 'react';

import { BUTTON_PRESS_TRANSITION_MS, buttonFaceOffset } from '@/ui/components/Button/buttonTheme';
import { ROUND_CARD_SKIP_FACE_COLOR, skipButtonLabelTextStyle } from '@/ui/components/RoundCard/roundCardTheme';
import { drawSkipButtonFace, drawSkipButtonShadow } from '@/ui/components/RoundCard/roundCardVisuals';

type RoundCardSkipButtonProps = {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
};

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

export function RoundCardSkipButton({ label, x, y, width, height, onClick }: RoundCardSkipButtonProps) {
  const reducedMotion = prefersReducedMotion();
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const contentRef = useRef<Container | null>(null);
  const offsetAnimRef = useRef<OffsetAnim | null>(null);
  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const hitArea = useMemo(() => new Rectangle(-width / 2, -height / 2, width, height), [height, width]);

  const labelStyle = useMemo(() => skipButtonLabelTextStyle(), []);

  const snapContentOffset = useCallback((offsetX: number, offsetY: number) => {
    offsetAnimRef.current = null;
    contentRef.current?.position.set(offsetX, offsetY);
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
    const { x: offsetX, y: offsetY } = buttonFaceOffset(hoveredRef.current, pressedRef.current);
    animateContentOffset(offsetX, offsetY);
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
      node.eventMode = 'static';
      node.cursor = 'pointer';
    },
    [hitArea],
  );

  const onPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      event.stopPropagation();
      pressedRef.current = true;
      applyFaceOffset();
    },
    [applyFaceOffset],
  );

  const onPointerUp = useCallback(
    (event: FederatedPointerEvent) => {
      const wasPressed = pressedRef.current;
      pressedRef.current = false;

      const target = event.currentTarget as Container;
      const local = target.toLocal(event.global);
      const inside = local.x >= -width / 2 && local.x <= width / 2 && local.y >= -height / 2 && local.y <= height / 2;

      if (wasPressed && inside) {
        onClickRef.current?.();
      }
      applyFaceOffset();
    },
    [applyFaceOffset, height, width],
  );

  const onPointerUpOutside = useCallback(() => {
    pressedRef.current = false;
    applyFaceOffset();
  }, [applyFaceOffset]);

  const onPointerOver = useCallback(() => {
    hoveredRef.current = true;
    applyFaceOffset();
  }, [applyFaceOffset]);

  const onPointerOut = useCallback(() => {
    hoveredRef.current = false;
    if (!pressedRef.current) {
      applyFaceOffset();
    }
  }, [applyFaceOffset]);

  useTick(() => {
    stepOffsetAnim();
    if (shadowRef.current) {
      drawSkipButtonShadow(shadowRef.current, width, height);
    }
    if (faceRef.current) {
      drawSkipButtonFace(faceRef.current, width, height, ROUND_CARD_SKIP_FACE_COLOR);
    }
  });

  return (
    <pixiContainer
      ref={bindRoot}
      x={x}
      y={y}
      sortableChildren
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerUpOutside={onPointerUpOutside}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <pixiGraphics ref={shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer ref={contentRef} zIndex={1} sortableChildren eventMode="none">
        <pixiGraphics ref={faceRef} eventMode="none" draw={() => {}} />
        <pixiText text={label} style={labelStyle} anchor={0.5} eventMode="none" />
      </pixiContainer>
    </pixiContainer>
  );
}
