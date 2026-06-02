import { useApplication } from "@pixi/react";
import { useTick } from "@pixi/react";
import { Sprite, type Container, type Filter } from "pixi.js";
import { forwardRef, use, useCallback, useImperativeHandle, useRef } from "react";

import { getDiceFaceTexture, texturesReady } from "@/assets/dice/textures";
import type { DiceType } from "@/data/dice";
import { effectsTexturesReady, getEffectTexture } from "@/assets/effects/textures";
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

export type DieHandle = {
  setFrame: (frame: DieFrame) => void;
  reset: () => void;
  setSquishScale: (scaleX: number, scaleY: number) => void;
  /** Burn-away destroy animation; runs on top of the die's visual effect. */
  destroy: (onComplete?: ActionEffectComplete) => void;
  /** Whether a destroy animation is currently playing. */
  isDestroying: () => boolean;
};

type DestroyAnimState = {
  progress: number;
  duration: number;
  onComplete?: ActionEffectComplete;
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
  const burnDissolveRef = useRef<BurnDissolveFilter | null>(null);
  const destroyAnimRef = useRef<DestroyAnimState | null>(null);
  const destroyingRef = useRef(false);

  const startDestroy = useCallback((onComplete?: ActionEffectComplete) => {
    if (destroyingRef.current) {
      return;
    }

    const burnTex = getEffectTexture("burn");
    if (!burnTex) {
      squishRef.current && (squishRef.current.visible = false);
      onComplete?.();
      return;
    }

    destroyingRef.current = true;

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
  }, []);

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
        const squish = squishRef.current;
        if (squish) {
          squish.visible = false;
          squish.filters = null;
        }
        onComplete?.();
      }
      return;
    }

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
        squishRef.current?.scale.set(scaleX, scaleY);
      },
      destroy: startDestroy,
      isDestroying: () => destroyingRef.current,
    }),
    [diceType, startDestroy],
  );

  return (
    <pixiContainer ref={squishRef} eventMode="none">
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
  );
});
