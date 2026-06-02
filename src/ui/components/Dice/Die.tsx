import { useApplication } from "@pixi/react";
import { useTick } from "@pixi/react";
import { Sprite, Text, TextStyle, type Container, type Filter, type Texture } from "pixi.js";
import { forwardRef, use, useCallback, useImperativeHandle, useMemo, useRef } from "react";

import { effectsTexturesReady, getEffectTexture } from "@/assets/effects/textures";
import {
  burnDestroyDissolveAt,
  createBurnDissolveFilter,
  BURN_DESTROY,
  type BurnDissolveFilter,
} from "@/ui/actionEffects/burnDissolveFilter";
import type { ActionEffectComplete } from "@/ui/actionEffects/types";
import {
  ADJACENT_FACE_LAYOUTS,
  pickAdjacentFaceValues,
} from "@/ui/components/Dice/dieAdjacentFaces";
import { EffectMount } from "@/ui/effects/EffectMount";
import { createDefaultEffectFrame } from "@/ui/effects/context";
import type { EffectFrameContext, EffectId } from "@/ui/effects/types";

export const DEFAULT_DIE_SIZE = 88;

export const dieTextStyle = new TextStyle({
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 24,
  fontWeight: "500",
  fill: "#000000",
});

export type DieProps = {
  texture: Texture | null;
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
  { texture, size = DEFAULT_DIE_SIZE, value = 1, effect = "none", phase = 0 },
  ref,
) {
  const { app } = useApplication();
  use(effectsTexturesReady);

  const squishRef = useRef<Container | null>(null);
  const rollRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const textRef = useRef<Text | null>(null);
  const adjacentTextRefs = useRef<(Text | null)[]>([]);
  const adjacentValues = useMemo(() => pickAdjacentFaceValues(value), [value]);
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

  const syncAdjacentTexts = (centerValue: number) => {
    const adjacent = pickAdjacentFaceValues(centerValue);
    adjacentTextRefs.current.forEach((node, index) => {
      if (node) {
        node.text = String(adjacent[index]);
      }
    });
  };

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
        const text = textRef.current;
        if (roll) {
          roll.rotation = rotation;
          roll.scale.set(scale);
        }
        if (text) {
          text.text = String(face);
        }
        syncAdjacentTexts(face);
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
    [startDestroy],
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
          {texture ? (
            <pixiSprite
              ref={spriteRef}
              texture={texture}
              anchor={0.5}
              width={size}
              height={size}
              eventMode="none"
            />
          ) : null}
          <pixiText
            ref={textRef}
            text={String(value)}
            anchor={0.5}
            y={-4}
            style={dieTextStyle}
            eventMode="none"
          />
          {ADJACENT_FACE_LAYOUTS.map((layout, index) => (
            <pixiContainer
              key={index}
              x={layout.x * size}
              y={layout.y * size}
              rotation={layout.rotation}
              scale={{ x: layout.scaleX, y: layout.scaleY }}
              skew={{ x: layout.skewX, y: 0 }}
              alpha={layout.alpha}
              eventMode="none"
            >
              <pixiText
                ref={(node) => {
                  adjacentTextRefs.current[index] = node;
                }}
                text={String(adjacentValues[index])}
                anchor={0.5}
                style={dieTextStyle}
                eventMode="none"
              />
            </pixiContainer>
          ))}
        </pixiContainer>
      </EffectMount>
    </pixiContainer>
  );
});
