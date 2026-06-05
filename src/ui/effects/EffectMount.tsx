import { useApplication, useTick } from '@pixi/react';
import { Container, type Filter } from 'pixi.js';
import { useCallback, useRef, type MutableRefObject, type ReactNode } from 'react';

import { CARD_EFFECT_PADDING, DIE_EFFECT_PADDING } from '@/ui/effects/dieTuning';
import { createEffectRuntime, destroyEffect, stepEffect } from '@/ui/effects/runtime';
import type {
  EffectArtRef,
  EffectArtTarget,
  EffectFrameContext,
  EffectHostKind,
  EffectId,
  EffectRuntime,
} from '@/ui/effects/types';

export type EffectMountProps = {
  effect: EffectId;
  hostKind: EffectHostKind;
  width: number;
  height: number;
  padding?: number;
  hideHalo?: boolean;
  frameRef: MutableRefObject<EffectFrameContext>;
  artRef: MutableRefObject<EffectArtRef | null>;
  children: ReactNode;
};

export function EffectMount({
  effect,
  hostKind,
  width,
  height,
  padding,
  hideHalo = false,
  frameRef,
  artRef,
  children,
}: EffectMountProps) {
  const resolvedPadding = padding ?? (hostKind === 'die' ? DIE_EFFECT_PADDING : CARD_EFFECT_PADDING);
  const { app } = useApplication();
  const backRef = useRef<Container | null>(null);
  const frontRef = useRef<Container | null>(null);
  const runtimeRef = useRef<EffectRuntime | null>(null);
  const prevEffectRef = useRef<EffectId>('none');

  const tryAttachRuntime = useCallback(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) {
      return;
    }
    if (effect === 'none') {
      if (runtimeRef.current) {
        destroyEffect(runtimeRef.current);
        runtimeRef.current = null;
      }
      artRef.current?.applyFilters(null);
      return;
    }
    if (runtimeRef.current?.id === effect) {
      return;
    }
    if (runtimeRef.current) {
      destroyEffect(runtimeRef.current);
      runtimeRef.current = null;
    }
    const art: EffectArtTarget = {
      applyFilters: (filters) => artRef.current?.applyFilters(filters ?? null),
    };
    runtimeRef.current = createEffectRuntime(
      effect,
      { back, front },
      { hostKind, width, height, padding: resolvedPadding, hideHalo },
      art,
    );
  }, [artRef, effect, height, hideHalo, hostKind, resolvedPadding, width]);

  const bindBack = useCallback(
    (node: Container | null) => {
      backRef.current = node;
      tryAttachRuntime();
    },
    [tryAttachRuntime],
  );

  const bindFront = useCallback(
    (node: Container | null) => {
      frontRef.current = node;
      tryAttachRuntime();
    },
    [tryAttachRuntime],
  );

  if (effect !== prevEffectRef.current) {
    prevEffectRef.current = effect;
    if (runtimeRef.current) {
      destroyEffect(runtimeRef.current);
      runtimeRef.current = null;
    }
    if (effect === 'none') {
      artRef.current?.applyFilters(null);
    } else {
      tryAttachRuntime();
    }
  }

  useTick(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    const frame = frameRef.current;
    frame.dt = app.ticker.deltaMS / 1000;
    frame.time = performance.now() / 1000;
    frame.width = width;
    frame.height = height;
    frame.hostKind = hostKind;
    frame.hideHalo = hideHalo;
    stepEffect(runtime, frame);
  });

  return (
    <pixiContainer sortableChildren eventMode="none">
      <pixiContainer ref={bindBack} zIndex={0} sortableChildren eventMode="none" />
      <pixiContainer zIndex={1} sortableChildren eventMode="none">
        {children}
      </pixiContainer>
      <pixiContainer ref={bindFront} zIndex={3} sortableChildren eventMode="none" />
    </pixiContainer>
  );
}
