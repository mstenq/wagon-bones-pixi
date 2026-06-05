import type { PhaseState } from '@/game/types';

/**
 * Derives which die ids the row should render.
 *
 * DAY_END: hides scored dice early (partial UX until score layout playback exists).
 * SELECT: falls back to `handDiceIds` when controller `visualOrder` is stale.
 *
 * Full post-score transition (remove spent dice + pouch fly-in for replacements) must be
 * driven by the playback runner via `requestHandRefillFlyIn` — not phase heuristics here.
 * @see src/ui/playback/gameSceneRunner.ts
 */

export function orderKey(ids: readonly string[]): string {
  return ids.join('|');
}

export type SelectDisplayOrderOptions = {
  phase?: PhaseState | null;
  scoredIds?: readonly string[];
};

export function selectDisplayOrder(
  visualOrder: readonly string[],
  handDiceIds: readonly string[],
  options: SelectDisplayOrderOptions = {},
): string[] {
  const { phase = null, scoredIds = [] } = options;

  if (phase === 'DAY_END' && scoredIds.length > 0 && visualOrder.length > 0) {
    const scoredSet = new Set(scoredIds);
    const remaining = visualOrder.filter((id) => !scoredSet.has(id));
    if (remaining.length > 0) {
      return remaining;
    }
  }

  if (phase === 'SELECT' && handDiceIds.length > 0) {
    if (orderKey(visualOrder) !== orderKey(handDiceIds)) {
      return [...handDiceIds];
    }
  }

  if (visualOrder.length > 0) {
    return [...visualOrder];
  }
  return [...handDiceIds];
}

/** Splits carryover vs newly drawn ids for pouch fly-in after `endDay`. */
export function partitionHandRefill(prevHandIds: readonly string[], nextHandIds: readonly string[]): {
  carryoverIds: string[];
  newIds: string[];
} {
  const prevSet = new Set(prevHandIds);
  const carryoverIds: string[] = [];
  const newIds: string[] = [];

  for (const id of nextHandIds) {
    if (prevSet.has(id)) {
      carryoverIds.push(id);
    } else {
      newIds.push(id);
    }
  }

  return { carryoverIds, newIds };
}
