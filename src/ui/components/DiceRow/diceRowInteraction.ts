import type { Die } from '@/game/types';
import type { RoundRuntimeState, RunState } from '@/game/store/types';
import { dieValueInRound, resolveDiceByIds } from '@/game/store/roundResolve';

export type RollDieUiState = 'unselected' | 'selected' | 'locked';

export function getRollDieUiState(
  id: string,
  selectedIds: ReadonlySet<string>,
  rerollLockedIds: ReadonlySet<string>,
  bossLockedIds: ReadonlySet<string>,
): RollDieUiState {
  if (selectedIds.has(id)) {
    return 'selected';
  }
  if (rerollLockedIds.has(id) || bossLockedIds.has(id)) {
    return 'locked';
  }
  return 'unselected';
}

export function nextRollDieUiStateAfterClick(current: RollDieUiState, isRightClick: boolean): RollDieUiState {
  if (isRightClick) {
    if (current === 'unselected') {
      return 'locked';
    }
    if (current === 'locked') {
      return 'unselected';
    }
    return 'locked';
  }

  if (current === 'unselected') {
    return 'selected';
  }
  if (current === 'locked') {
    return 'selected';
  }
  return 'unselected';
}

export function applyRollDieUiStateChange(
  id: string,
  next: RollDieUiState,
  selectedIds: Set<string>,
  rerollLockedIds: Set<string>,
  bossLocked: boolean,
): RollDieUiState {
  let resolved = next;
  if (bossLocked && resolved === 'unselected') {
    resolved = 'locked';
  }

  selectedIds.delete(id);
  rerollLockedIds.delete(id);

  if (resolved === 'selected') {
    selectedIds.add(id);
  } else if (resolved === 'locked') {
    rerollLockedIds.add(id);
  }

  return resolved;
}

export function dieSortValue(die: Pick<Die, 'value' | 'enhancement'>): number {
  if (die.enhancement === 'stone') {
    return 13;
  }
  return die.value;
}

export function sortDieIdsAsc(ids: string[], diceById: ReadonlyMap<string, Pick<Die, 'value' | 'enhancement'>>): string[] {
  return [...ids].sort((a, b) => {
    const dieA = diceById.get(a);
    const dieB = diceById.get(b);
    if (!dieA || !dieB) {
      return 0;
    }
    const byValue = dieSortValue(dieA) - dieSortValue(dieB);
    if (byValue !== 0) {
      return byValue;
    }
    return a.localeCompare(b);
  });
}

function faceSortValue(
  id: string,
  round: RoundRuntimeState,
  run: RunState,
  enhancementById: ReadonlyMap<string, Die['enhancement']>,
  rolledValueById: ReadonlyMap<string, number>,
): number {
  if (enhancementById.get(id) === 'stone') {
    return 13;
  }
  if (rolledValueById.has(id)) {
    return rolledValueById.get(id)!;
  }
  return dieValueInRound(id, round, run) ?? 0;
}

/** Sort die ids by current face value in round (rolled refs first, like Phaser sortValue). */
export function sortDieIdsForRound(
  ids: readonly string[],
  round: RoundRuntimeState,
  run: RunState,
): string[] {
  const enhancementById = new Map(
    resolveDiceByIds([...ids], round, run).map((die) => [die.id, die.enhancement]),
  );
  const rolledValueById = new Map(round.rolledDice.map((ref) => [ref.id, ref.value]));

  return [...ids].sort((a, b) => {
    const byValue =
      faceSortValue(a, round, run, enhancementById, rolledValueById) -
      faceSortValue(b, round, run, enhancementById, rolledValueById);
    if (byValue !== 0) {
      return byValue;
    }
    return a.localeCompare(b);
  });
}

export function idsEligibleForReroll(
  allIds: readonly string[],
  selectedIds: ReadonlySet<string>,
  rerollLockedIds: ReadonlySet<string>,
): string[] {
  return allIds.filter((id) => !selectedIds.has(id) && !rerollLockedIds.has(id));
}
