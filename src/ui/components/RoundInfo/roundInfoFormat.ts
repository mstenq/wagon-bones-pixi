export function formatRoundScore(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Math.max(0, Math.floor(value)).toLocaleString("en-US");
}

export function formatRoundPayout(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0";
  }
  return `$${Math.max(0, Math.floor(value))}`;
}
