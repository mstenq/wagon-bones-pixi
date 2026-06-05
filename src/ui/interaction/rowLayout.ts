/** Center of item `index` in a horizontal row. */
export function rowSlotCenter(index: number, pitch: number, originX: number, y: number): { x: number; y: number } {
  return {
    x: originX + index * pitch,
    y,
  };
}

export function rowMetrics(count: number, itemSize: number, gap: number, canvasWidth: number) {
  const pitch = itemSize + gap;
  const rowWidth = count * itemSize + (count - 1) * gap;
  const originX = (canvasWidth - rowWidth) / 2 + itemSize / 2;

  return { pitch, originX, rowWidth };
}

/** Visual slot index from a local x coordinate in the row. */
export function slotIndexFromX(x: number, count: number, pitch: number, originX: number): number {
  const raw = Math.round((x - originX) / pitch);
  return Math.max(0, Math.min(count - 1, raw));
}

export function moveInArray<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item!);
  return next;
}
