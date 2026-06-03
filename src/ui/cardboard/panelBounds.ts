import {
  CARDBOARD_CONTAINER_CONTENT_PADDING_PX,
  CARDBOARD_CONTAINER_SOURCE_SLICE_PX,
} from "@/ui/cardboard/theme";
import type { ReorderableRowLayout } from "@/ui/interaction/useReorderableRow";

export type CardboardPanelBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function cardboardPanelAroundRect(
  left: number,
  top: number,
  contentWidth: number,
  contentHeight: number,
  padding = CARDBOARD_CONTAINER_CONTENT_PADDING_PX,
  border = CARDBOARD_CONTAINER_SOURCE_SLICE_PX,
): CardboardPanelBounds {
  const inset = padding + border;
  return {
    x: left - inset,
    y: top - inset,
    width: contentWidth + inset * 2,
    height: contentHeight + inset * 2,
  };
}

/** Bounds for a horizontal reorderable row (cards, dice, etc.). */
export function cardboardPanelForRow(
  layout: ReorderableRowLayout,
  itemWidth: number,
  itemHeight: number,
  padding = CARDBOARD_CONTAINER_CONTENT_PADDING_PX,
  border = CARDBOARD_CONTAINER_SOURCE_SLICE_PX,
): CardboardPanelBounds {
  const contentLeft = layout.originX - itemWidth / 2;
  const contentTop = layout.rowY - itemHeight / 2;
  return cardboardPanelAroundRect(
    contentLeft,
    contentTop,
    layout.rowWidth,
    itemHeight,
    padding,
    border,
  );
}

export function offsetRowLayout(
  layout: ReorderableRowLayout,
  panel: CardboardPanelBounds,
): ReorderableRowLayout {
  return {
    ...layout,
    originX: layout.originX - panel.x,
    rowY: layout.rowY - panel.y,
  };
}
