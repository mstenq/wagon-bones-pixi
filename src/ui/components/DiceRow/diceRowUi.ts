/** Shared hand visual order for RollDiceButton (DOM) ↔ DiceRow (Pixi). */

let visualOrder: string[] = [];

export function getDiceRowVisualOrder(): string[] {
  return visualOrder;
}

export function setDiceRowVisualOrder(order: string[]): void {
  visualOrder = order;
}
