import type { ReactNode } from "react";
import { useMemo } from "react";

import { cardboardPanelForRow, offsetRowLayout } from "@/ui/cardboard/panelBounds";
import { PixiCardboardPanel } from "@/ui/pixi/cardboard/PixiCardboardPanel";
import type { ReorderableRowLayout } from "@/ui/interaction/useReorderableRow";

export type PixiCardboardRowPanelProps = {
  layout: ReorderableRowLayout;
  itemWidth: number;
  itemHeight: number;
  zIndex?: number;
  children: (localLayout: ReorderableRowLayout) => ReactNode;
};

/** Cardboard frame sized for a reorderable row; children receive panel-local coordinates. */
export function PixiCardboardRowPanel({
  layout,
  itemWidth,
  itemHeight,
  zIndex = 0,
  children,
}: PixiCardboardRowPanelProps) {
  const { panel, localLayout } = useMemo(() => {
    const panelBounds = cardboardPanelForRow(layout, itemWidth, itemHeight);
    return {
      panel: panelBounds,
      localLayout: offsetRowLayout(layout, panelBounds),
    };
  }, [itemHeight, itemWidth, layout]);

  return (
    <PixiCardboardPanel
      x={panel.x}
      y={panel.y}
      width={panel.width}
      height={panel.height}
      zIndex={zIndex}
    >
      {children(localLayout)}
    </PixiCardboardPanel>
  );
}
