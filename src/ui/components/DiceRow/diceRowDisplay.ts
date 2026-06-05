import { DEFAULT_DIE_SIZE } from '@/ui/components/Dice/Die';
import { getRollDieUiState } from '@/ui/components/DiceRow/diceRowInteraction';
import type { DieMode } from '@/ui/components/Dice/config';
import { gameFacade } from '@/game/facade';
import type { RoundRuntimeState } from '@/game/store/types';
import type { Die as GameDie } from '@/game/types';
import { dieValueInRound } from '@/game/store/roundResolve';
import { rowMetrics } from '@/ui/interaction/rowLayout';
import type { ReorderableRowLayout, RowLayoutMeta } from '@/ui/interaction/useReorderableRow';

export function layoutForDiceCount(layout: ReorderableRowLayout, diceCount: number): ReorderableRowLayout {
  if (diceCount <= 0 || diceCount === layout.count) {
    return layout;
  }

  const gap = layout.pitch - DEFAULT_DIE_SIZE;
  const contentW = 2 * (layout.originX - DEFAULT_DIE_SIZE / 2) + layout.rowWidth;
  const metrics = rowMetrics(diceCount, DEFAULT_DIE_SIZE, gap, contentW);

  return { ...layout, ...metrics, count: diceCount };
}

export function dieShadowFloorLineY(
  dieId: string,
  homeY: number,
  meta: RowLayoutMeta<string>,
  slotHomeY: (slotIndex: number) => number,
): number | null {
  if (meta.dragSession?.itemId === dieId) {
    return slotHomeY(meta.dragSession.fromSlot);
  }
  if (meta.dropSettlingItemId === dieId) {
    return homeY;
  }
  return null;
}

export function buildRollFinalValues(dice: GameDie[], round: RoundRuntimeState): Record<string, number> {
  const values: Record<string, number> = {};
  for (const die of dice) {
    values[die.id] = dieValueInRound(die.id, round) ?? die.value;
  }
  return values;
}

export function buildRollEnhancements(dice: GameDie[]): Record<string, GameDie['enhancement']> {
  const enhancements: Record<string, GameDie['enhancement']> = {};
  for (const die of dice) {
    enhancements[die.id] = die.enhancement;
  }
  return enhancements;
}

export function buildDiceByIdMap(dice: GameDie[]): Map<string, GameDie> {
  return new Map(dice.map((die) => [die.id, die]));
}

export function dieModeForDie(
  dieId: string,
  die: GameDie,
  selectedIds: ReadonlySet<string>,
  rerollLockedIds: ReadonlySet<string>,
  bossLockedIds: ReadonlySet<string>,
): DieMode {
  if (gameFacade.boss.isDiceScoringDisabled(die)) {
    return 'debuffed';
  }

  const uiState = getRollDieUiState(dieId, selectedIds, rerollLockedIds, bossLockedIds);
  if (uiState === 'selected') {
    return 'selected';
  }
  if (uiState === 'locked') {
    return 'locked';
  }
  return 'base';
}
