import { describe, expect, test } from 'bun:test';

import {
  applyRollDieUiStateChange,
  getRollDieUiState,
  idsEligibleForReroll,
  nextRollDieUiStateAfterClick,
  sortDieIdsAsc,
  sortDieIdsForRound,
} from '@/ui/components/DiceRow/diceRowInteraction';
import type { RoundRuntimeState } from '@/game/store/types';
import type { RunState } from '@/game/store/types';
import type { Die } from '@/game/types';
import { DEFAULT_CONFIG } from '@/game/types';
import { D } from '@/game/scoreMath';

function die(id: string, value: number, enhancement: Die['enhancement'] = null): Die {
  return { id, value, enhancement, sticker: null, aura: null, bonusMiles: 0 };
}

describe('diceRowInteraction', () => {
  test('left click toggles score selection', () => {
    expect(nextRollDieUiStateAfterClick('unselected', false)).toBe('selected');
    expect(nextRollDieUiStateAfterClick('selected', false)).toBe('unselected');
    expect(nextRollDieUiStateAfterClick('locked', false)).toBe('selected');
  });

  test('right click toggles reroll lock', () => {
    expect(nextRollDieUiStateAfterClick('unselected', true)).toBe('locked');
    expect(nextRollDieUiStateAfterClick('locked', true)).toBe('unselected');
    expect(nextRollDieUiStateAfterClick('selected', true)).toBe('locked');
  });

  test('boss lock cannot be cleared via apply', () => {
    const selected = new Set<string>();
    const locked = new Set<string>();

    const result = applyRollDieUiStateChange('d1', 'unselected', selected, locked, true);

    expect(result).toBe('locked');
    expect(locked.has('d1')).toBe(true);
    expect(selected.has('d1')).toBe(false);
  });

  test('getRollDieUiState respects boss locks', () => {
    const selected = new Set<string>();
    const locked = new Set<string>();
    const bossLocked = new Set(['d1']);

    expect(getRollDieUiState('d1', selected, locked, bossLocked)).toBe('locked');
  });

  test('sortDieIdsAsc treats stone as 13', () => {
    const map = new Map([
      ['a', die('a', 12)],
      ['b', die('b', 0, 'stone')],
      ['c', die('c', 3)],
    ]);

    expect(sortDieIdsAsc(['a', 'b', 'c'], map)).toEqual(['c', 'a', 'b']);
  });

  test('sortDieIdsAsc tie-breaks equal values by id', () => {
    const map = new Map([
      ['die_b', die('die_b', 7)],
      ['die_a', die('die_a', 7)],
    ]);

    expect(sortDieIdsAsc(['die_b', 'die_a'], map)).toEqual(['die_a', 'die_b']);
  });

  test('sortDieIdsForRound sorts by rolled face value ascending', () => {
    const ids = ['d10', 'd6', 'd7', 'd8', 'd7b', 'd8b', 'd1', 'd2'];
    const rolled = [
      { id: 'd10', value: 10 },
      { id: 'd6', value: 6 },
      { id: 'd7', value: 7 },
      { id: 'd8', value: 8 },
      { id: 'd7b', value: 7 },
      { id: 'd8b', value: 8 },
      { id: 'd1', value: 1 },
      { id: 'd2', value: 2 },
    ];
    const round: RoundRuntimeState = {
      config: DEFAULT_CONFIG,
      phase: 'ROLL',
      day: 1,
      rerollsRemaining: 3,
      totalMiles: D(0),
      spentDiceIds: [],
      handDiceIds: ids,
      dieValuesByDieId: Object.fromEntries(rolled.map((r) => [r.id, r.value])),
      selectedForRollIds: ids,
      rolledDice: rolled,
      selectedForScoreIds: [],
      currentHandType: null,
      handHistory: [],
      lastScoreResult: null,
    };
    const run = {
      dice: ids.map((id) => die(id, 1)),
    } as RunState;

    expect(sortDieIdsForRound(ids, round, run)).toEqual([
      'd1',
      'd2',
      'd6',
      'd7',
      'd7b',
      'd8',
      'd8b',
      'd10',
    ]);
  });

  test('sortDieIdsForRound uses post-reroll face values', () => {
    const ids = ['a', 'b', 'c'];
    const round: RoundRuntimeState = {
      config: DEFAULT_CONFIG,
      phase: 'ROLL',
      day: 1,
      rerollsRemaining: 2,
      totalMiles: D(0),
      spentDiceIds: [],
      handDiceIds: ids,
      dieValuesByDieId: { a: 11, b: 6, c: 3 },
      selectedForRollIds: ids,
      rolledDice: [
        { id: 'a', value: 11 },
        { id: 'b', value: 2 },
        { id: 'c', value: 3 },
      ],
      selectedForScoreIds: [],
      currentHandType: null,
      handHistory: [],
      lastScoreResult: null,
    };
    const run = {
      dice: ids.map((id) => die(id, 99)),
    } as RunState;

    expect(sortDieIdsForRound(['a', 'b', 'c'], round, run)).toEqual(['b', 'c', 'a']);
  });

  test('sortDieIdsForRound matches screenshot-like roll values', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rolled = [
      { id: 'a', value: 11 },
      { id: 'b', value: 6 },
      { id: 'c', value: 6 },
      { id: 'd', value: 12 },
      { id: 'e', value: 3 },
      { id: 'f', value: 4 },
      { id: 'g', value: 12 },
      { id: 'h', value: 12 },
    ];
    const round: RoundRuntimeState = {
      config: DEFAULT_CONFIG,
      phase: 'ROLL',
      day: 1,
      rerollsRemaining: 3,
      totalMiles: D(0),
      spentDiceIds: [],
      handDiceIds: ids,
      dieValuesByDieId: Object.fromEntries(rolled.map((r) => [r.id, r.value])),
      selectedForRollIds: ids,
      rolledDice: rolled,
      selectedForScoreIds: [],
      currentHandType: null,
      handHistory: [],
      lastScoreResult: null,
    };
    const run = {
      dice: ids.map((id) => die(id, 99)),
    } as RunState;

    expect(sortDieIdsForRound(ids, round, run)).toEqual(['e', 'f', 'b', 'c', 'a', 'd', 'g', 'h']);
  });

  test('idsEligibleForReroll excludes selected and locked', () => {
    const selected = new Set(['a']);
    const locked = new Set(['b']);

    expect(idsEligibleForReroll(['a', 'b', 'c'], selected, locked)).toEqual(['c']);
  });
});
