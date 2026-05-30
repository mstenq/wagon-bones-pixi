import { useApplication } from "@pixi/react";
import { useTick } from "@pixi/react";
import { Sprite, Text, TextStyle, type Container, type Filter, type Texture } from "pixi.js";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";

import {
  ADJACENT_FACE_LAYOUTS,
  pickAdjacentFaceValues,
} from "@/ui/components/Dice/dieAdjacentFaces";
import { AuraMount } from "@/ui/effects/AuraMount";
import { createDefaultAuraFrame } from "@/ui/effects/context";
import type { AuraFrameContext, AuraId } from "@/ui/effects/types";

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
  aura?: AuraId;
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
};

/** Visual die only — position via parent `DraggableItem` or any container. */
export const Die = forwardRef<DieHandle, DieProps>(function Die(
  { texture, size = DEFAULT_DIE_SIZE, value = 1, aura = "none", phase = 0 },
  ref,
) {
  const { app } = useApplication();
  const squishRef = useRef<Container | null>(null);
  const rollRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const textRef = useRef<Text | null>(null);
  const adjacentTextRefs = useRef<(Text | null)[]>([]);
  const adjacentValues = useMemo(() => pickAdjacentFaceValues(value), [value]);
  const auraFrameRef = useRef<AuraFrameContext>(
    createDefaultAuraFrame("die", size, size, phase),
  );
  const auraArtRef = useRef<{
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

  const syncAdjacentTexts = (centerValue: number) => {
    const adjacent = pickAdjacentFaceValues(centerValue);
    adjacentTextRefs.current.forEach((node, index) => {
      if (node) {
        node.text = String(adjacent[index]);
      }
    });
  };

  useTick(() => {
    const frame = auraFrameRef.current;
    frame.dt = app.ticker.deltaMS / 1000;
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
    }),
    [],
  );

  return (
    <pixiContainer ref={squishRef} eventMode="none">
      <AuraMount
        aura={aura}
        hostKind="die"
        width={size}
        height={size}
        frameRef={auraFrameRef}
        artRef={auraArtRef}
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
      </AuraMount>
    </pixiContainer>
  );
});
