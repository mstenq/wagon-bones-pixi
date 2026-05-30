import { useApplication, useTick } from "@pixi/react";
import { Container, type Filter } from "pixi.js";
import {
  useCallback,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";

import { CARD_AURA_PADDING, DIE_AURA_PADDING } from "@/ui/effects/dieTuning";
import {
  createAuraRuntime,
  destroyAura,
  stepAura,
} from "@/ui/effects/runtime";
import type {
  AuraArtTarget,
  AuraFrameContext,
  AuraHostKind,
  AuraId,
  AuraRuntime,
} from "@/ui/effects/types";

export type AuraMountProps = {
  aura: AuraId;
  hostKind: AuraHostKind;
  width: number;
  height: number;
  padding?: number;
  frameRef: MutableRefObject<AuraFrameContext>;
  artRef: MutableRefObject<{
    applyFilters: (filters: Filter[] | null) => void;
    setJitter: (dx: number, dy: number) => void;
  } | null>;
  children: ReactNode;
};

export function AuraMount({
  aura,
  hostKind,
  width,
  height,
  padding,
  frameRef,
  artRef,
  children,
}: AuraMountProps) {
  const resolvedPadding = padding ?? (hostKind === "die" ? DIE_AURA_PADDING : CARD_AURA_PADDING);
  const { app } = useApplication();
  const backRef = useRef<Container | null>(null);
  const frontRef = useRef<Container | null>(null);
  const artJitterRef = useRef<Container | null>(null);
  const runtimeRef = useRef<AuraRuntime | null>(null);
  const prevAuraRef = useRef<AuraId>("none");

  const bindArtJitter = useCallback((node: Container | null) => {
    artJitterRef.current = node;
  }, []);

  const tryAttachRuntime = useCallback(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) {
      return;
    }
    if (aura === "none") {
      if (runtimeRef.current) {
        destroyAura(runtimeRef.current);
        runtimeRef.current = null;
      }
      artRef.current?.applyFilters(null);
      artRef.current?.setJitter(0, 0);
      return;
    }
    if (runtimeRef.current?.id === aura) {
      return;
    }
    if (runtimeRef.current) {
      destroyAura(runtimeRef.current);
      runtimeRef.current = null;
    }
    const art: AuraArtTarget = {
      applyFilters: (filters) => artRef.current?.applyFilters(filters ?? null),
      setJitter: (dx, dy) => {
        if (artJitterRef.current) {
          artJitterRef.current.position.set(dx, dy);
        }
      },
    };
    runtimeRef.current = createAuraRuntime(
      aura,
      { back, front },
      { hostKind, width, height, padding: resolvedPadding },
      art,
    );
  }, [artRef, aura, frontRef, height, hostKind, resolvedPadding, width]);

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

  if (aura !== prevAuraRef.current) {
    prevAuraRef.current = aura;
    if (runtimeRef.current) {
      destroyAura(runtimeRef.current);
      runtimeRef.current = null;
    }
    if (aura === "none") {
      artRef.current?.applyFilters(null);
      artRef.current?.setJitter(0, 0);
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
    stepAura(runtime, frame);
  });

  return (
    <pixiContainer sortableChildren eventMode="none">
      <pixiContainer ref={bindBack} zIndex={0} sortableChildren eventMode="none" />
      <pixiContainer ref={bindArtJitter} zIndex={1} sortableChildren eventMode="none">
        {children}
      </pixiContainer>
      <pixiContainer ref={bindFront} zIndex={3} sortableChildren eventMode="none" />
    </pixiContainer>
  );
}
