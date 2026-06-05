import type { Container } from 'pixi.js';
import { useCallback, useRef, type RefObject } from 'react';

import { getEffectTexture } from '@/loaders/effects/textures';
import type { BurnDissolveFilter } from '@/ui/actionEffects/burnDissolveFilter';
import type { ActionEffectComplete } from '@/ui/actionEffects/types';
import type { SquishTargets } from '@/ui/interaction/spring';

import {
  createItemAnimationRuntime,
  getGrowPopSquishMultiplier,
  getShakeOffsetX,
  isItemAnimationBusy,
  shouldBlockItemPointer,
  startItemAnimation,
  stepItemAnimation,
  type ItemAnimationConfig,
  type ItemAnimationHostContext,
  type ItemAnimationRuntime,
} from '@/ui/animation/itemAnimations';

export type ItemAnimationRefs = {
  root: RefObject<Container | null>;
  squish: RefObject<Container | null>;
  overlay: RefObject<Container | null>;
};

export type UseItemAnimationsOptions = {
  hostExtent: number;
  textPlacement: 'above' | 'below';
  beforeDestroy?: () => void;
  refs: ItemAnimationRefs;
};

export type ItemAnimationStepFrame = {
  destroyBlocksTick: boolean;
  growPopMul: SquishTargets;
  shakeX: number;
};

export function applyItemAnimationSquish(
  squishNode: Container | null,
  baseScale: SquishTargets,
  growPopMul: SquishTargets,
  shakeX: number,
): void {
  if (!squishNode) {
    return;
  }
  squishNode.scale.set(baseScale.scaleX * growPopMul.scaleX, baseScale.scaleY * growPopMul.scaleY);
  squishNode.x = shakeX;
}

export function useItemAnimations({ hostExtent, textPlacement, beforeDestroy, refs }: UseItemAnimationsOptions) {
  const runtimeRef = useRef<ItemAnimationRuntime>(createItemAnimationRuntime());
  const burnDissolveRef = useRef<BurnDissolveFilter | null>(null);
  const beforeDestroyRef = useRef(beforeDestroy);
  beforeDestroyRef.current = beforeDestroy;

  const hostRef = useRef<ItemAnimationHostContext>({
    root: null,
    squish: null,
    overlay: null,
    hostExtent,
    textPlacement,
    beforeDestroy: () => beforeDestroyRef.current?.(),
    getBurnTexture: () => getEffectTexture('burn'),
    burnDissolve: null,
    setBurnDissolve: (filter) => {
      burnDissolveRef.current = filter;
    },
  });

  const syncHost = useCallback((): ItemAnimationHostContext => {
    const host = hostRef.current;
    host.root = refs.root.current;
    host.squish = refs.squish.current;
    host.overlay = refs.overlay.current;
    host.hostExtent = hostExtent;
    host.textPlacement = textPlacement;
    host.burnDissolve = burnDissolveRef.current;
    return host;
  }, [hostExtent, refs.overlay, refs.root, refs.squish, textPlacement]);

  const runAnimate = useCallback(
    (config: ItemAnimationConfig, onComplete?: ActionEffectComplete) => {
      return startItemAnimation(runtimeRef.current, syncHost(), config, onComplete);
    },
    [syncHost],
  );

  const isPlayingAnimation = useCallback(() => {
    return isItemAnimationBusy(runtimeRef.current);
  }, []);

  const shouldBlockPointer = useCallback(() => {
    return shouldBlockItemPointer(runtimeRef.current);
  }, []);

  const stepAnimations = useCallback(
    (dt: number): ItemAnimationStepFrame => {
      const runtime = runtimeRef.current;
      const step = stepItemAnimation(runtime, syncHost(), dt);
      return {
        destroyBlocksTick: step.destroyBlocksTick,
        growPopMul: getGrowPopSquishMultiplier(runtime),
        shakeX: getShakeOffsetX(runtime),
      };
    },
    [syncHost],
  );

  return {
    runAnimate,
    isPlayingAnimation,
    shouldBlockPointer,
    stepAnimations,
  };
}
