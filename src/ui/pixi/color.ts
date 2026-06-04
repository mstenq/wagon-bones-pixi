/** CSS hex (`#rrggbb`) to Pixi fill/stroke color number. */
export function hexToPixiColor(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}
