import type { ReactNode } from "react";

import { PixiCardboardPanelFrame } from "@/ui/pixi/cardboard/PixiCardboardNinePatch";

export type PixiCardboardPanelProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  border?: number;
  zIndex?: number;
  wavyEdges?: boolean;
  children?: ReactNode;
};

/** Positioned cardboard panel with optional content and wavy outer edges. */
export function PixiCardboardPanel({
  x,
  y,
  width,
  height,
  border,
  zIndex = 0,
  wavyEdges = true,
  children,
}: PixiCardboardPanelProps) {
  return (
    <pixiContainer x={x} y={y} zIndex={zIndex} sortableChildren eventMode="passive">
      <PixiCardboardPanelFrame
        width={width}
        height={height}
        border={border}
        wavyEdges={wavyEdges}
      />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        {children}
      </pixiContainer>
    </pixiContainer>
  );
}
