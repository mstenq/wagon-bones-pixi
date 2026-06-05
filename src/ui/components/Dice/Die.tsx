import { useApplication } from '@pixi/react';
import { useTick } from '@pixi/react';
import { BlurFilter, Sprite, TextStyle, type Container, type Filter, type Graphics, Rectangle } from 'pixi.js';
import { forwardRef, use, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { getDiceFaceTexture, texturesReady } from '@/loaders/dice/textures';
import type { DiceType } from '@/data/dice';
import { effectsTexturesReady } from '@/loaders/effects/textures';
import type { ActionEffectComplete } from '@/ui/actionEffects/types';
import type { ItemAnimationConfig } from '@/ui/animation/itemAnimations';
import { applyItemAnimationSquish, useItemAnimations, type ItemAnimationRefs } from '@/ui/animation/useItemAnimations';
import { DIE_SELECTED_LIFT_PX, dieModeAlpha, type DieMode } from '@/ui/components/Dice/config';
import {
  DIE_SHADOW_BLUR_BASE,
  DIE_SHADOW_BLUR_QUALITY,
  dieShadowGroundY,
  dieShadowLocalPose,
  syncDieGroundShadow,
  type DieShadowDragState,
} from '@/ui/components/Dice/dieGroundShadow';
import { EffectMount } from '@/ui/effects/EffectMount';
import { createDefaultEffectFrame } from '@/ui/effects/context';
import type { EffectArtRef, EffectFrameContext, EffectId } from '@/ui/effects/types';
import { createScalarSpring, setScalarTarget, stepScalarSpring, type ScalarSpringState } from '@/ui/interaction/spring';

export const DEFAULT_DIE_SIZE = 88;

export type DieProps = {
  diceType: DiceType;
  size?: number;
  value?: number;
  effect?: EffectId;
  phase?: number;
  mode?: DieMode;
};

export type DieFrame = {
  rotation: number;
  scale: number;
  value: number;
};

export type DieAnimationConfig = ItemAnimationConfig;

export type { DieShadowDragState } from '@/ui/components/Dice/dieGroundShadow';

export type DieHandle = {
  setFrame: (frame: DieFrame) => void;
  reset: () => void;
  setSquishScale: (scaleX: number, scaleY: number) => void;
  setShadowDragState: (state: DieShadowDragState) => void;
  animate: (config: ItemAnimationConfig, onComplete?: ActionEffectComplete) => boolean;
  isPlayingAnimation: () => boolean;
};

/** Visual die only — position via parent `DraggableItem` or any container. */
export const Die = forwardRef<DieHandle, DieProps>(function Die(
  { diceType, size = DEFAULT_DIE_SIZE, value = 1, effect = 'none', phase = 0, mode = 'base' },
  ref,
) {
  const { app } = useApplication();
  use(texturesReady);
  use(effectsTexturesReady);

  const faceTexture = getDiceFaceTexture(diceType, value);

  const rootRef = useRef<Container | null>(null);
  const shadowRef = useRef<Graphics | null>(null);
  const shadowFilterAreaRef = useRef(new Rectangle());
  const shadowBlurRef = useRef<BlurFilter>(
    new BlurFilter({ strength: DIE_SHADOW_BLUR_BASE, quality: DIE_SHADOW_BLUR_QUALITY }),
  );
  const animOverlayRef = useRef<Container | null>(null);
  const liftRef = useRef<Container | null>(null);
  const squishRef = useRef<Container | null>(null);
  const rollRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const liftSpringRef = useRef<ScalarSpringState>(createScalarSpring(0, 0));
  const effectFrameRef = useRef<EffectFrameContext>(createDefaultEffectFrame('die', size, size, phase));
  const effectArtRef = useRef<EffectArtRef>({
    applyFilters(filters) {
      const sprite = spriteRef.current;
      if (sprite) {
        sprite.filters = filters;
      }
    },
  });
  const externalSquishRef = useRef({ scaleX: 1, scaleY: 1 });
  const shadowDragRef = useRef<DieShadowDragState>({
    floorOffsetY: 0,
    extraLiftPx: 0,
    visibility: 1,
  });

  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setScalarTarget(liftSpringRef.current, mode === 'selected' ? DIE_SELECTED_LIFT_PX : 0);
  }

  const debuffXStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: size * 0.5,
        fontWeight: '100',
        fill: '#dc2626',
        align: 'center',
      }),
    [size],
  );

  const lockStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: size * 0.28,
        align: 'center',
      }),
    [size],
  );

  const itemAnimRefs = useMemo(
    (): ItemAnimationRefs => ({
      root: rootRef,
      squish: squishRef,
      overlay: animOverlayRef,
    }),
    [],
  );

  const { runAnimate, isPlayingAnimation, stepAnimations } = useItemAnimations({
    hostExtent: size,
    textPlacement: 'above',
    refs: itemAnimRefs,
  });

  const artAlpha = dieModeAlpha(mode);

  const applyShadowVisual = useCallback(() => {
    const shadow = shadowRef.current;
    if (!shadow) {
      return;
    }
    const { floorOffsetY, extraLiftPx, visibility } = shadowDragRef.current;
    const dragRotation = rootRef.current?.parent?.rotation ?? 0;
    const liftPx = liftSpringRef.current.value;
    const totalLiftPx = liftPx + extraLiftPx;
    const shadowPose = dieShadowLocalPose(dieShadowGroundY(size), floorOffsetY, dragRotation);
    shadow.position.set(shadowPose.x, shadowPose.y);
    shadow.rotation = shadowPose.rotation;
    if (visibility > 0.01) {
      syncDieGroundShadow(
        shadow,
        shadowBlurRef.current,
        shadowFilterAreaRef.current,
        size,
        totalLiftPx,
        DIE_SELECTED_LIFT_PX,
      );
      shadow.alpha = artAlpha * visibility;
    } else {
      shadow.alpha = 0;
    }
  }, [artAlpha, size]);

  useTick(() => {
    const dt = app.ticker.deltaMS / 1000;
    const { destroyBlocksTick, growPopMul, shakeX } = stepAnimations(dt);

    if (destroyBlocksTick) {
      return;
    }

    applyItemAnimationSquish(squishRef.current, externalSquishRef.current, growPopMul, shakeX);

    stepScalarSpring(liftSpringRef.current, dt);
    const liftPx = liftSpringRef.current.value;
    const lift = liftRef.current;
    if (lift) {
      lift.y = -liftPx;
    }

    applyShadowVisual();

    const frame = effectFrameRef.current;
    frame.dt = dt;
    frame.time = performance.now() / 1000;
    frame.width = size;
    frame.height = size;
    frame.hostKind = 'die';
    frame.phase = phase;
  });

  useImperativeHandle(
    ref,
    () => ({
      setFrame({ rotation, scale, value: face }) {
        const roll = rollRef.current;
        const sprite = spriteRef.current;
        if (roll) {
          roll.rotation = rotation;
          roll.scale.set(scale);
        }
        if (sprite) {
          sprite.texture = getDiceFaceTexture(diceType, face);
        }
      },
      reset() {
        const roll = rollRef.current;
        if (roll) {
          roll.rotation = 0;
          roll.scale.set(1);
        }
      },
      setSquishScale(scaleX, scaleY) {
        externalSquishRef.current = { scaleX, scaleY };
      },
      setShadowDragState(state) {
        shadowDragRef.current = state;
        applyShadowVisual();
      },
      animate: runAnimate,
      isPlayingAnimation,
    }),
    [applyShadowVisual, diceType, isPlayingAnimation, runAnimate],
  );

  return (
    <pixiContainer ref={rootRef} sortableChildren eventMode="none">
      <pixiGraphics ref={shadowRef} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer ref={animOverlayRef} zIndex={10} eventMode="none" />
      <pixiContainer ref={liftRef} zIndex={2} eventMode="none">
        <pixiContainer ref={squishRef} alpha={artAlpha} eventMode="none">
          <EffectMount
            effect={effect}
            hostKind="die"
            width={size}
            height={size}
            frameRef={effectFrameRef}
            artRef={effectArtRef}
          >
            <pixiContainer ref={rollRef} eventMode="none">
              <pixiSprite
                ref={spriteRef}
                texture={faceTexture}
                anchor={0.5}
                width={size}
                height={size}
                eventMode="none"
              />
            </pixiContainer>
          </EffectMount>
        </pixiContainer>
        {mode === 'debuffed' ? (
          <pixiText text="✕" anchor={0.5} zIndex={5} style={debuffXStyle} eventMode="none" />
        ) : null}
        {mode === 'locked' ? (
          <pixiText
            text="🔒"
            anchor={{ x: 0.5, y: 0 }}
            y={size / 2 + 10}
            zIndex={5}
            style={lockStyle}
            eventMode="none"
          />
        ) : null}
      </pixiContainer>
    </pixiContainer>
  );
});
