import { describe, expect, test } from 'bun:test';

import { partitionHandRefill, selectDisplayOrder } from '@/ui/components/DiceRow/diceRowOrder';

describe('selectDisplayOrder', () => {
  test('removes scored dice during DAY_END', () => {
    const order = selectDisplayOrder(['a', 'b', 'c'], ['a', 'b', 'c'], {
      phase: 'DAY_END',
      scoredIds: ['b'],
    });
    expect(order).toEqual(['a', 'c']);
  });

  test('uses handDiceIds in SELECT when visual order is stale', () => {
    const order = selectDisplayOrder(['old_1', 'old_2'], ['new_1', 'new_2'], {
      phase: 'SELECT',
    });
    expect(order).toEqual(['new_1', 'new_2']);
  });
});

describe('partitionHandRefill', () => {
  test('splits carryover and newly drawn dice', () => {
    const result = partitionHandRefill(['a', 'b', 'c'], ['b', 'c', 'd', 'e']);
    expect(result.carryoverIds).toEqual(['b', 'c']);
    expect(result.newIds).toEqual(['d', 'e']);
  });

  test('treats a full replacement hand as all new', () => {
    const result = partitionHandRefill(['a', 'b'], ['c', 'd']);
    expect(result.carryoverIds).toEqual([]);
    expect(result.newIds).toEqual(['c', 'd']);
  });
});
