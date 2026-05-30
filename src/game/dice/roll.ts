/** Pure dice roll helpers — no UI dependencies. */

export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

export function rollMany(count: number): number[] {
  return Array.from({ length: count }, rollD12);
}
