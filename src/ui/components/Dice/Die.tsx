import { useApplication } from "@pixi/react";
import { useTick } from "@pixi/react";
import { Sprite, type Container, type Filter } from "pixi.js";
import { forwardRef, use, useImperativeHandle, useMemo, useRef } from "react";

import { getDiceFaceTexture, texturesReady } from "@/assets/dice/textures";
import type { DiceType } from "@/data/dice";
import { effectsTexturesReady } from "@/assets/effects/textures";
import type { ActionEffectComplete } from "@/ui/actionEffects/types";
import type { ItemAnimationConfig } from "@/ui/animation/itemAnimations";
import {
  applyItemAnimationSquish,
  useItemAnimations,
  type ItemAnimationRefs,
} from "@/ui/animation/useItemAnimations";
import { EffectMount } from "@/ui/effects/EffectMount";
import { createDefaultEffectFrame } from "@/ui/effects/context";
import type { EffectFrameContext, EffectId } from "@/ui/effects/types";

export const DEFAULT_DIE_SIZE = 88;

export type DieProps = {
  diceType: DiceType;
  size?: number;
  value?: number;
  effect?: EffectId;
  phase?: number;
};

export type DieFrame = {
  rotation: number;
  scale: number;
  value: number;
};

export type DieAnimationConfig = ItemAnimationConfig;

export type DieHandle = {
  setFrame: (frame: DieFrame) => void;
  reset: () => void;
  setSquishScale: (scaleX: number, scaleY: number) => void;
  animate: (config: ItemAnimationConfig, onComplete?: ActionEffectComplete) => boolean;
  isPlayingAnimation: () => boolean;
};

/** Visual die only — position via parent `DraggableItem` or any container. */
export const Die = forwardRef<DieHandle, DieProps>(function Die(
  { diceType, size = DEFAULT_DIE_SIZE, value = 1, effect = "none", phase = 0 },
  ref,
) {
  const { app } = useApplication();
  use(texturesReady);
  use(effectsTexturesReady);

  const faceTexture = getDiceFaceTexture(diceType, value);

  const rootRef = useRef<Container | null>(null);
  const animOverlayRef = useRef<Container | null>(null);
  const squishRef = useRef<Container | null>(null);
  const rollRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const effectFrameRef = useRef<EffectFrameContext>(
    createDefaultEffectFrame("die", size, size, phase),
  );
  const effectArtRef = useRef<{
    applyFilters: (filters: Filter[] | null) => void;
    setJitter: (dx: number, dy: number) => void;
  }>({
    applyFilters(filters) {
      const sprite = spriteRef.current;
      if (sprite) {
        sprite.filters = filters;
      }
    },
    setJitter() {},
  });
  const externalSquishRef = useRef({ scaleX: 1, scaleY: 1 });

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
    textPlacement: "above",
    refs: itemAnimRefs,
  });

  useTick(() => {
    const dt = app.ticker.deltaMS / 1000;
    const { destroyBlocksTick, growPopMul, shakeX } = stepAnimations(dt);

    if (destroyBlocksTick) {
      return;
    }

    applyItemAnimationSquish(
      squishRef.current,
      externalSquishRef.current,
      growPopMul,
      shakeX,
    );

    const frame = effectFrameRef.current;
    frame.dt = dt;
    frame.time = performance.now() / 1000;
    frame.width = size;
    frame.height = size;
    frame.hostKind = "die";
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
      animate: runAnimate,
      isPlayingAnimation,
    }),
    [diceType, isPlayingAnimation, runAnimate],
  );

  return (
    <pixiContainer ref={rootRef} sortableChildren eventMode="none">
      <pixiContainer ref={animOverlayRef} zIndex={10} eventMode="none" />
      <pixiContainer ref={squishRef} zIndex={2} eventMode="none">
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
    </pixiContainer>
  );
});
